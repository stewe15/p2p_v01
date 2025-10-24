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



@app.route('/handleDeal', methods=['POST'])
def handle_deal():
    data = request.json
    
    if data is None:
        return jsonify({"message": "Invalid JSON data or missing Content-Type header", "success": False}), 400
    
    deal = {
        'uid': data.get('uid'),
        'telegram_id': data.get('telegram_id'),
        'time': data.get('time'),
        'status': data.get('status'),
        'stars_amount': data.get('stars_amount'),
        'price': int(int(data.get('price')) * 1.09),
        'buyer': ''
    }

    try:
        deals = read_json_file('deals.json')
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

    deals = read_json_file('deals.json')
    deal_to_update = None
    for deal in deals:
        if deal['uid'] == dealUID:
            deal['buyer'] = buyer
            deal['status'] = 'pending'
            deal_to_update = deal
            break

    if not deal_to_update:
        return jsonify({'message': 'Нет сделки', 'success': False}), 400

    write_json_file('deals.json', deals)
    broadcast({"type": "new_deal", "deal": deal_to_update})
    return jsonify({'message': 'Сделка ожидает оплаты', 'success': True})


@app.route('/getDeals', methods=['GET'])
def get_deals():
    deals = read_json_file('deals.json')
    return jsonify({'deals': deals})


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
