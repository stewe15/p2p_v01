import io
import json
import secrets
import string
import os
from queue import Queue, Empty
from threading import Thread
from datetime import datetime
from dotenv import load_dotenv

from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
import bcrypt
import qrcode


load_dotenv('../app/bots/config.env')

app = Flask(__name__)
CORS(app)


BASE_URL_BUYER = 'https://t.me/buyer_stars_kur_bot'
BASE_URL_SELLER = 'https://t.me/seller_stars_kur_bot'
BALANCES_FILE = 'balances.json'


clients = []

@app.route('/events')
def events():
    def stream(client_queue: Queue):
        try:
            while True:
                try:
                    data = client_queue.get(timeout=15)
                    yield f"data: {data}\n\n"
                except Empty:
                    yield "event: ping\ndata: {}\n\n"
        except GeneratorExit:
            if client_queue in clients:
                clients.remove(client_queue)

    q = Queue()
    clients.append(q)
    return Response(stream(q), mimetype="text/event-stream")


def broadcast(event: dict):
    data = json.dumps(event)
    for q in clients[:]:
        try:
            q.put_nowait(data)
        except:
            try:
                clients.remove(q)
            except:
                pass


def generate_random_key(length=12):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))


def read_json_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, dict):
                return [data]
            return data
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def write_json_file(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)



def read_balances():
    balances = read_json_file(BALANCES_FILE)
    if not isinstance(balances, list):
        return []
    return balances


def write_balances(balances):
    write_json_file(BALANCES_FILE, balances)


def get_or_create_balance(balances, telegram_id):
    for b in balances:
        if b.get('telegram_id') == telegram_id:
            return b
    new_b = {
        'telegram_id': telegram_id,
        'rub': 0,
        'stars': 0,
    }
    balances.append(new_b)
    return new_b



@app.route('/register', methods=['POST'])
def register():
    data = request.json
    
    if data is None:
        return jsonify({"message": "Invalid JSON data or missing Content-Type header", "success": False}), 400
    
    telegram_id = data.get('telegram_id')
    username = data.get('username')
    password = data.get('password')

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user = {
        'telegram_id': telegram_id,
        'username': username,
        'password': hashed_password
    }

    try:
        users = read_json_file('users.json')
        users.append(user)
        write_json_file('users.json', users)
        return jsonify({"message": "Пользователь зарегистрирован", "success": True})
    except Exception as e:
        return jsonify({"message": f"Ошибка сохранения: {str(e)}", "success": False}), 500


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    
    if data is None:
        return jsonify({'success': False, 'message': 'Invalid JSON data or missing Content-Type header'}), 400
    
    telegram_id = data.get('telegram_id')
    username = data.get('username')
    password = data.get('password').encode('utf-8')

    try:
        users = read_json_file('users.json')
        for user in users:
            if user['telegram_id'] == telegram_id or user['username'] == username:
                if bcrypt.checkpw(password, user['password'].encode('utf-8')):
                    return jsonify({
                        'success': True,
                        'message': 'Вход выполнен',
                        'telegram_id': user['telegram_id'],
                        'username': user['username']
                    })
                else:
                    return jsonify({'success': False, 'message': 'Неверный пароль'}), 401
        return jsonify({'success': False, 'message': 'Пользователь не найден'}), 404
    except Exception as e:
        return jsonify({"success": False, "message": f"Ошибка: {str(e)}"}), 500



@app.route('/getRandomKey', methods=['GET'])
def get_random_key():
    return jsonify({"key": generate_random_key()})



@app.route('/getBalance', methods=['POST'])
def get_balance():
    data = request.json

    if data is None:
        return jsonify({'success': False, 'message': 'Invalid JSON data or missing Content-Type header'}), 400

    telegram_id = data.get('telegram_id')
    if not telegram_id:
        return jsonify({'success': False, 'message': 'telegram_id is required'}), 400

    balances = read_balances()
    bal = next((b for b in balances if b.get('telegram_id') == telegram_id), None)
    if not bal:
        bal = {
            'telegram_id': telegram_id,
            'rub': 0,
            'stars': 0,
        }

    return jsonify({'success': True, 'balance': bal})


@app.route('/changeBalance', methods=['POST'])
def change_balance():
    data = request.json

    if data is None:
        return jsonify({'success': False, 'message': 'Invalid JSON data or missing Content-Type header'}), 400

    telegram_id = data.get('telegram_id')
    if not telegram_id:
        return jsonify({'success': False, 'message': 'telegram_id is required'}), 400

    try:
        delta_rub = int(data.get('delta_rub', 0) or 0)
        delta_stars = int(data.get('delta_stars', 0) or 0)
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'delta_rub and delta_stars must be integers'}), 400

    balances = read_balances()
    bal = get_or_create_balance(balances, telegram_id)

    new_rub = int(bal.get('rub', 0)) + delta_rub
    new_stars = int(bal.get('stars', 0)) + delta_stars

    if new_rub < 0 or new_stars < 0:
        return jsonify({'success': False, 'message': 'Недостаточно средств на балансе'}), 400

    bal['rub'] = new_rub
    bal['stars'] = new_stars
    write_balances(balances)

    return jsonify({'success': True, 'balance': bal})



@app.route('/handleDeal', methods=['POST'])
def handle_deal():
    data = request.json
    
    if data is None:
        return jsonify({"message": "Invalid JSON data or missing Content-Type header", "success": False}), 400
    
    deals = read_json_file('deals.json')

    uid = data.get('uid') or generate_random_key()
    # защита от дубликатов UID
    existing_uids = {d.get('uid') for d in deals}
    if uid in existing_uids:
        return jsonify({"message": "Сделка с таким UID уже существует", "success": False}), 400

    seller_id = data.get('telegram_id')
    if not seller_id:
        return jsonify({"message": "telegram_id is required", "success": False}), 400

    try:
        stars_amount = int(data.get('stars_amount'))
        price_raw = int(data.get('price'))
    except (TypeError, ValueError):
        return jsonify({"message": "Некорректные параметры сделки", "success": False}), 400

    if stars_amount <= 0 or price_raw <= 0:
        return jsonify({"message": "Некорректные параметры сделки", "success": False}), 400

    balances = read_balances()
    seller_balance = get_or_create_balance(balances, seller_id)

    current_stars = int(seller_balance.get('stars', 0))
    if current_stars < stars_amount:
        return jsonify({"message": "Недостаточно звёзд на балансе", "success": False}), 400

    seller_balance['stars'] = current_stars - stars_amount
    write_balances(balances)

    deal = {
        'uid': uid,
        'telegram_id': seller_id,
        'time': data.get('time'),
        'status': data.get('status'),
        'stars_amount': stars_amount,
        'price': int(price_raw * 1.09),
        'buyer': ''
    }

    try:
        deals.append(deal)
        write_json_file('deals.json', deals)
        broadcast({"type": "new_deal", "deal": deal})
        return jsonify({'success': True, 'message': 'Сделка создана'})
    except Exception as e:
        return jsonify({"message": f"Ошибка сохранения: {str(e)}", "success": False}), 500


@app.route('/updateDeals', methods=['POST'])
def update_deals():
    data = request.json
    
    if data is None:
        return jsonify({'message': 'Invalid JSON data or missing Content-Type header', 'success': False}), 400
    
    dealUID = data.get('dealUID')
    buyer = data.get('buyer')
    new_status = data.get('status')

    deals = read_json_file('deals.json')
    deal_to_update = None
    for deal in deals:
        if deal['uid'] == dealUID:
            # Обновление покупателя (обычно из бота покупателя)
            if buyer is not None:
                # проверяем и списываем рубли покупателя при переходе в pending
                try:
                    price = int(deal.get('price', 0))
                except (TypeError, ValueError):
                    return jsonify({'message': 'Некорректная цена сделки', 'success': False}), 400

                balances = read_balances()
                buyer_balance = get_or_create_balance(balances, buyer)
                current_rub = int(buyer_balance.get('rub', 0))
                if current_rub < price:
                    return jsonify({'message': 'Недостаточно рублей на балансе', 'success': False}), 400

                buyer_balance['rub'] = current_rub - price
                write_balances(balances)

                deal['buyer'] = buyer
                deal['status'] = new_status or 'pending'
            # Обновление только статуса (например, переход в completed из бота продавца)
            elif new_status:
                # При завершении сделки начисляем средства продавцу и звёзды покупателю
                if new_status == 'completed':
                    try:
                        price = int(deal.get('price', 0))
                        stars_amount = int(deal.get('stars_amount', 0))
                    except (TypeError, ValueError):
                        return jsonify({'message': 'Некорректные параметры сделки', 'success': False}), 400

                    seller_id = deal.get('telegram_id')
                    buyer_id = deal.get('buyer')

                    balances = read_balances()

                    if seller_id:
                        seller_balance = get_or_create_balance(balances, seller_id)
                        seller_balance['rub'] = int(seller_balance.get('rub', 0)) + price

                    if buyer_id:
                        buyer_balance = get_or_create_balance(balances, buyer_id)
                        buyer_balance['stars'] = int(buyer_balance.get('stars', 0)) + stars_amount

                    write_balances(balances)

                deal['status'] = new_status
            deal_to_update = deal
            break

    if not deal_to_update:
        return jsonify({'message': 'Нет сделки', 'success': False}), 400

    write_json_file('deals.json', deals)
    broadcast({"type": "new_deal", "deal": deal_to_update})

    message = 'Сделка обновлена'
    if deal_to_update.get('status') == 'pending':
        message = 'Сделка ожидает оплаты'
    elif deal_to_update.get('status') == 'completed':
        message = 'Сделка завершена'

    return jsonify({'message': message, 'success': True})


@app.route('/getDeals', methods=['GET'])
def get_deals():
    deals = read_json_file('deals.json')
    return jsonify({'deals': deals})


@app.route('/dealsStats', methods=['GET'])
def deals_stats():
    deals = read_json_file('deals.json')

    stats_map = {}

    for deal in deals:
        time_str = deal.get('time')
        date_key = None

        if isinstance(time_str, str):
            try:
                dt = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
                date_key = dt.date().isoformat()
            except ValueError:
                try:
                    dt = datetime.strptime(time_str, "%Y-%m-%d")
                    date_key = dt.date().isoformat()
                except ValueError:
                    pass

        if not date_key:
            date_key = 'unknown'

        if date_key not in stats_map:
            stats_map[date_key] = {
                'date': date_key,
                'dealsCount': 0,
                'totalRub': 0,
                'totalStars': 0,
            }

        entry = stats_map[date_key]

        try:
            price = int(deal.get('price', 0) or 0)
        except (TypeError, ValueError):
            price = 0

        try:
            stars = int(deal.get('stars_amount', 0) or 0)
        except (TypeError, ValueError):
            stars = 0

        entry['dealsCount'] += 1
        entry['totalRub'] += price
        entry['totalStars'] += stars

    stats_list = [v for v in stats_map.values() if v['date'] != 'unknown']
    stats_list.sort(key=lambda x: x['date'])

    unknown_entry = stats_map.get('unknown')
    if unknown_entry:
        stats_list.append(unknown_entry)

    overall = {
        'totalDeals': sum(s['dealsCount'] for s in stats_list),
        'totalRub': sum(s['totalRub'] for s in stats_list),
        'totalStars': sum(s['totalStars'] for s in stats_list),
    }

    return jsonify({'success': True, 'stats': stats_list, 'overall': overall})


@app.route('/userStats', methods=['GET'])
def user_stats():
    deals = read_json_file('deals.json')

    users_map = {}

    for deal in deals:
        seller_id = deal.get('telegram_id')
        buyer_id = deal.get('buyer')

        try:
            price = int(deal.get('price', 0) or 0)
        except (TypeError, ValueError):
            price = 0

        try:
            stars = int(deal.get('stars_amount', 0) or 0)
        except (TypeError, ValueError):
            stars = 0

        # Продавец
        if seller_id:
            if seller_id not in users_map:
                users_map[seller_id] = {
                    'telegram_id': seller_id,
                    'sellDeals': 0,
                    'buyDeals': 0,
                    'sellStars': 0,
                    'buyStars': 0,
                    'sellRub': 0,
                    'buyRub': 0,
                    'totalDeals': 0,
                    'totalStars': 0,
                    'totalRub': 0,
                }

            u = users_map[seller_id]
            u['sellDeals'] += 1
            u['sellStars'] += stars
            u['sellRub'] += price

        # Покупатель
        if buyer_id:
            if buyer_id not in users_map:
                users_map[buyer_id] = {
                    'telegram_id': buyer_id,
                    'sellDeals': 0,
                    'buyDeals': 0,
                    'sellStars': 0,
                    'buyStars': 0,
                    'sellRub': 0,
                    'buyRub': 0,
                    'totalDeals': 0,
                    'totalStars': 0,
                    'totalRub': 0,
                }

            u = users_map[buyer_id]
            u['buyDeals'] += 1
            u['buyStars'] += stars
            u['buyRub'] += price

    # Финальный перерасчёт total-полей
    users_list = []
    for u in users_map.values():
        u['totalDeals'] = u['sellDeals'] + u['buyDeals']
        u['totalStars'] = u['sellStars'] + u['buyStars']
        u['totalRub'] = u['sellRub'] + u['buyRub']
        users_list.append(u)

    # Сортируем по общему обороту в рублях
    users_list.sort(key=lambda x: x['totalRub'], reverse=True)

    return jsonify({'success': True, 'users': users_list})


@app.route('/myDeals', methods=['POST'])
def my_deals():
    data = request.json
    
    if data is None:
        return jsonify({'message': 'Invalid JSON data or missing Content-Type header', 'success': False}), 400
    
    telegram_id = data.get('telegram_id')
    deals = read_json_file('deals.json')
    filtered = [d for d in deals if d['telegram_id'] == telegram_id or d.get('buyer') == telegram_id]
    return jsonify({'myDeals': filtered})


@app.route('/getDealById', methods=['POST'])
def get_deal_by_id():
    data = request.json
    
    if data is None:
        return jsonify({'message': 'Invalid JSON data or missing Content-Type header', 'success': False}), 400
    
    deal_id = data.get('dealId')
    deals = read_json_file('deals.json')
    needed = next((d for d in deals if d['uid'] == deal_id), None)
    if not needed:
        return jsonify({'message': 'Сделка не найдена', 'success': False}), 404
    return jsonify({'neededDeal': needed})



def generate_qr(url: str):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img_io = io.BytesIO()
    img.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')


@app.route('/generateBuyer', methods=['POST'])
def generate_buyer_qr():
    data = request.json
    deal_id = data.get('dealId')
    
    if not deal_id:
        return jsonify({'error': 'dealId is required'}), 400
    
    url = f"{BASE_URL_BUYER}?start={deal_id}"
    return generate_qr(url)


@app.route('/generateSeller', methods=['POST'])
def generate_seller_qr():
    data = request.json
    
    deal_id = data.get('dealId')
    
    if not deal_id:
        return jsonify({'error': 'dealId is required'}), 400
    
    
    url = f"{BASE_URL_SELLER}?start={deal_id}"
    return generate_qr(url)



if __name__ == '__main__':
    app.run(debug=True, threaded=True)
