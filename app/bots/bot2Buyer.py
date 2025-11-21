import asyncio
import logging
import requests
import os
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.exceptions import TelegramAPIError 
from aiogram.types import InlineKeyboardButton, LabeledPrice, PreCheckoutQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder
from urllib.parse import unquote_plus


logging.basicConfig(level=logging.DEBUG)

load_dotenv('config.env')

BOT_TOKEN = os.getenv('BOT2_TOKEN')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000')
PAYMENT_PROVIDER_TOKEN = os.getenv('PAYMENT_PROVIDER_TOKEN')
MOCK_PAYMENTS = os.getenv('MOCK_PAYMENTS', '1') == '1'


if not BOT_TOKEN:
    print("❌ BOT2_TOKEN не найден в переменных окружения!")
    exit(1)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()



import requests
import xml.etree.ElementTree as ET


CBR_XML_URL = "https://www.cbr-xml-daily.ru/daily.xml"

def get_usd_rate():
    response = requests.get(CBR_XML_URL)
    response.raise_for_status()  

    
    root = ET.fromstring(response.content)
    
    
    for valute in root.findall('Valute'):
        char_code = valute.find('CharCode').text
        if char_code == 'USD':
            
            nominal = int(valute.find('Nominal').text)
            value = float(valute.find('Value').text.replace(',', '.'))
            
            
            rate = value / nominal
            return rate

    raise ValueError("USD курс не найден в XML")

usd_rate = get_usd_rate()
print(f"Курс USD к RUB: {usd_rate:.2f} ₽")



def get_all_deals():
    try:
        r = requests.get(f"{API_BASE_URL}/getDeals")
        if r.status_code == 200:
            return r.json().get('deals', [])
        logging.error(f"API Error get_all_deals: Status code {r.status_code}, Response: {r.text}")
        return []
    except requests.exceptions.RequestException as e:
        logging.error(f"Ошибка получения сделок (Network/HTTP): {e}")
        return []
    except Exception as e:
        logging.error(f"Ошибка получения сделок (General): {e}")
        return []

def get_deal_by_id(deal_id):
    try:
        r = requests.post(f"{API_BASE_URL}/getDealById", json={"dealId": deal_id})
        if r.status_code == 200:
            return r.json().get('neededDeal')
        logging.error(f"API Error get_deal_by_id: Status code {r.status_code}, Response: {r.text}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"Ошибка получения сделки (Network/HTTP): {e}")
        return None
    except Exception as e:
        logging.error(f"Ошибка получения сделки (General): {e}")
        return None

def buy_deal(deal_id, buyer_telegram_id):
    try:
        r = requests.post(f"{API_BASE_URL}/updateDeals", json={"dealUID": deal_id, "buyer": buyer_telegram_id})
        if r.status_code == 200:
            return r.json()
        logging.error(f"API Error buy_deal: Status code {r.status_code}, Response: {r.text}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"Ошибка покупки (Network/HTTP): {e}")
        return None
    except Exception as e:
        logging.error(f"Ошибка покупки (General): {e}")
        return None

def get_balance(telegram_id: str):
    try:
        r = requests.post(f"{API_BASE_URL}/getBalance", json={"telegram_id": telegram_id})
        if r.status_code == 200:
            return r.json().get('balance')
        logging.error(f"API Error get_balance: Status code {r.status_code}, Response: {r.text}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"Ошибка получения баланса (Network/HTTP): {e}")
        return None
    except Exception as e:
        logging.error(f"Ошибка получения баланса (General): {e}")
        return None

def change_balance(telegram_id: str, delta_rub: int = 0, delta_stars: int = 0):
    try:
        payload = {
            "telegram_id": telegram_id,
            "delta_rub": delta_rub,
            "delta_stars": delta_stars,
        }
        r = requests.post(f"{API_BASE_URL}/changeBalance", json=payload)
        return r
    except requests.exceptions.RequestException as e:
        logging.error(f"Ошибка change_balance (Network/HTTP): {e}")
        return None
    except Exception as e:
        logging.error(f"Ошибка change_balance (General): {e}")
        return None


async def show_balance_menu(message: types.Message, telegram_id: str, buyer_tg_encoded: str | None = None):
    bal = get_balance(telegram_id)
    if not bal:
        await message.answer("❌ Не удалось получить баланс. Попробуйте позже.")
        return

    rub = bal.get('rub', 0)
    stars = bal.get('stars', 0)

    text = (
        "💼 <b>Ваш баланс</b>\n\n"
        f"Рубли: <b>{rub} ₽</b>\n"
        f"Звёзды: <b>{stars} ⭐</b>\n\n"
        "Выберите, что хотите пополнить (mock):"
    )

    kb = InlineKeyboardBuilder()
    suffix = f"_{buyer_tg_encoded}" if buyer_tg_encoded else ""
    kb.add(
        InlineKeyboardButton(
            text="➕ Пополнить рубли (+1000₽)",
            callback_data=f"topup_rub_1000{suffix}",
        )
    )
    kb.add(
        InlineKeyboardButton(
            text="➕ Пополнить звёзды (+100⭐)",
            callback_data=f"topup_stars_100{suffix}",
        )
    )
    kb.adjust(1)

    await message.answer(text, parse_mode="HTML", reply_markup=kb.as_markup())


@dp.message(Command("start"))
async def start_handler(message: types.Message):
    deal_arg = None
    buyer_tg_encoded = None

    if message.text:
        parts = message.text.split(maxsplit=1)
        if len(parts) > 1:
            deal_arg = parts[1].strip()

    if deal_arg:
        deal_arg = unquote_plus(deal_arg)

        if deal_arg.startswith("topup_"):
            buyer_tg_encoded = deal_arg[len("topup_"):]
            if not buyer_tg_encoded:
                await message.answer("❌ Неверные параметры пополнения в ссылке.")
                return
            telegram_id = f"@{buyer_tg_encoded}" if not buyer_tg_encoded.startswith("@") else buyer_tg_encoded
            await show_balance_menu(message, telegram_id, buyer_tg_encoded)
            return

        if deal_arg.startswith("b_"):
            rest = deal_arg[2:]
            subparts = rest.split("_")
            if len(subparts) >= 2:
                deal_id = subparts[0]
                buyer_tg_encoded = "_".join(subparts[1:])
            else:
                await message.answer("❌ Неверный формат ID сделки в ссылке.")
                return
        else:
            deal_id = deal_arg

        if 2 <= len(deal_id) <= 256 and any(c.isalnum() for c in deal_id):
            await show_specific_deal_for_buy(message, deal_id, buyer_tg_encoded)
            return
        await message.answer("❌ Неверный формат ID сделки в ссылке.")
        return

    await message.answer(
        "🌟 <b>Добро пожаловать!</b>\n\n"
        "Отправьте ссылку или ID сделки для покупки.\n\n",
        parse_mode="HTML"
    )


@dp.message(Command("balance", "topup"))
async def balance_handler(message: types.Message):
    telegram_id = f"@{message.from_user.username}" if message.from_user.username else str(message.from_user.id)
    buyer_tg_encoded = telegram_id[1:] if telegram_id.startswith("@") else telegram_id
    await show_balance_menu(message, telegram_id, buyer_tg_encoded)


@dp.callback_query(lambda c: c.data.startswith("buy_"))
async def process_buy_callback(c: types.CallbackQuery):
    payload = c.data[len("buy_"):]
    parts = payload.split("_")
    if len(parts) == 1:
        deal_id = parts[0]
        buyer_tg_encoded = None
    else:
        deal_id = parts[0]
        buyer_tg_encoded = "_".join(parts[1:])

    deal = get_deal_by_id(deal_id)
    if not deal:
        await c.message.edit_text("❌ Сделка не найдена или недоступна.")
        await c.answer()
        return

    price = float(deal.get('price', 0))
    stars = int(deal.get('stars_amount', 0))
    rate = get_usd_rate()
    if not rate:
        rate = 87
    price_kopecks = int(int(price * 100 ) / rate)

    if price_kopecks <= 0:
        await c.message.answer("❌ Ошибка: Неверная сумма для оплаты.")
        await c.answer()
        return
    
    # MOCK-режим: если токен провайдера не задан или включён mock-флаг,
    # считаем, что оплата прошла сразу
    if not PAYMENT_PROVIDER_TOKEN or MOCK_PAYMENTS:

        if buyer_tg_encoded:
            buyer_telegram_id = f"@{buyer_tg_encoded}" if not buyer_tg_encoded.startswith("@") else buyer_tg_encoded
        else:
            buyer_telegram_id = f"@{c.from_user.username}" if c.from_user.username else str(c.from_user.id)

        result = buy_deal(deal_id, buyer_telegram_id)
        if result and result.get('success'):
            await c.message.edit_text(
                f"✅ (MOCK) Оплата проведена. Сделка <code>{deal_id}</code> ожидает подтверждения продавца.",
                parse_mode="HTML"
            )
        else:
            await c.message.edit_text(
                f"❌ (MOCK) Оплата прошла, но не удалось обновить сделку <code>{deal_id}</code>.",
                parse_mode="HTML"
            )
        await c.answer("Оплата в mock-режиме", show_alert=False)
        return
    
    logging.info(f"Сделка ID: {deal_id}, Цена RUB: {price:.2f}, Цена копейки: {price_kopecks}")

    try:
        await bot.send_invoice(
            chat_id=c.from_user.id,
            title=f"Покупка {stars} звезд",
           
            description=f"Приобретение {stars} ⭐ за {price:.2f} ₽ у пользователя {deal.get('telegram_id', 'Неизвестно')}",
            provider_token=PAYMENT_PROVIDER_TOKEN,
            currency="USD",
            prices=[
                LabeledPrice(label=f"{stars} ⭐", amount=price_kopecks)
            ],
            payload=f"deal_{deal_id}_{buyer_tg_encoded}" if buyer_tg_encoded else f"deal_{deal_id}",
            start_parameter="invoice_payment" 
        )
        
        
        await c.message.edit_text(
            f"✅ Счёт для сделки <code>{deal_id}</code> создан. Проверьте сообщение выше, бот отправил счёт на оплату.",
            parse_mode="HTML"
        )
        await c.answer("Счёт создан!")
        logging.debug(f"Инвойс для сделки {deal_id} успешно отправлен.")

    
    except TelegramAPIError as e:
        error_message = f"❌ Ошибка API при отправке счета: {e}"
        logging.error(f"{error_message} для сделки {deal_id}")
        await c.message.answer(f"{error_message}")
        await c.answer("Ошибка при создании счета!")
    

    except Exception as e:
        error_message = f"❌ Непредвиденная ошибка: {e}"
        logging.error(f"{error_message} для сделки {deal_id}")
        await c.message.answer(f"{error_message}")
        await c.answer("Ошибка при создании счета!")



@dp.message()
async def successful_payment_handler(message: types.Message):
    if message.successful_payment:
        payload = message.successful_payment.invoice_payload
        if payload.startswith("deal_"):
            rest = payload[len("deal_"):]
            parts = rest.split("_")
            deal_id = parts[0]
            buyer_tg_encoded = "_".join(parts[1:]) if len(parts) > 1 else None

            if buyer_tg_encoded:
                buyer_telegram_id = f"@{buyer_tg_encoded}" if not buyer_tg_encoded.startswith("@") else buyer_tg_encoded
            else:
                buyer_telegram_id = f"@{message.from_user.username}" if message.from_user.username else str(message.from_user.id)

            
            logging.info(f"Успешная оплата! Deal ID: {deal_id}, Buyer: {buyer_telegram_id}")
            
            result = buy_deal(deal_id, buyer_telegram_id)

            if result and result.get('success'):
                await message.answer(
                    f"✅ Оплата успешно проведена!\n\n"
                    f"Сделка <code>{deal_id}</code> переведена в статус 'Ожидает подтверждения продавца'.",
                    parse_mode="HTML"
                )
            else:
                await message.answer("❌ Оплата прошла, но не удалось обновить сделку. Обратитесь в поддержку.")


@dp.message(Command("deals"))
async def deals_handler(message: types.Message):
    deals = get_all_deals()
    active_deals = [d for d in deals if d.get('status') == 'active']

    if not active_deals:
        await message.answer("📭 Сейчас нет доступных сделок.")
        return

    text = f"🛒 <b>Доступные сделки ({len(active_deals)}):</b>\n\n"
    for i, d in enumerate(active_deals[:10], 1):
        seller = d.get('telegram_id', 'Неизвестно')
        stars = d.get('stars_amount', 0)
        price = d.get('price', 0)
        deal_id = d.get('uid', '')
        
        try:
            price_per_star = float(price) / float(stars) if float(stars) else 0
        except:
            price_per_star = 0
            
        text += f"<b>{i}. {stars} ⭐ за {price} ₽</b>\nПродавец: {seller}\nЦена за звезду: {price_per_star:.2f} ₽\nID: <code>{deal_id[:8]}...</code>\n\n"

    keyboard = InlineKeyboardBuilder()
    for d in active_deals[:5]:
        keyboard.add(InlineKeyboardButton(text=f"🛒 Купить {d['stars_amount']}⭐ за {d['price']}₽", callback_data=f"buy_{d['uid']}"))
    keyboard.add(InlineKeyboardButton(text="🔄 Обновить", callback_data="refresh_deals"))
    await message.answer(text, parse_mode="HTML", reply_markup=keyboard.as_markup())



@dp.callback_query()
async def callback_handler(c: types.CallbackQuery):
    data = c.data
    
    if data.startswith("topup_"):
        parts = data.split("_")
        if len(parts) < 3:
            await c.answer("Неверные параметры пополнения", show_alert=True)
            return

        _, kind, amount_str, *rest = parts
        try:
            amount = int(amount_str)
        except ValueError:
            await c.answer("Неверная сумма", show_alert=True)
            return

        buyer_tg_encoded = "_".join(rest) if rest else None

        if buyer_tg_encoded:
            telegram_id = f"@{buyer_tg_encoded}" if not buyer_tg_encoded.startswith("@") else buyer_tg_encoded
        else:
            telegram_id = f"@{c.from_user.username}" if c.from_user.username else str(c.from_user.id)


        delta_rub = amount if kind == "rub" else 0
        delta_stars = amount if kind == "stars" else 0

        resp = change_balance(telegram_id, delta_rub=delta_rub, delta_stars=delta_stars)

        if not resp:
            await c.answer("Ошибка пополнения", show_alert=True)
            return

        try:
            data_json = resp.json()
        except Exception:
            data_json = {}

        if resp.status_code == 200 and data_json.get("success"):
            bal = data_json.get("balance", {})
            rub = bal.get('rub', 0)
            stars = bal.get('stars', 0)
            await c.message.edit_text(
                f"💼 Баланс обновлён\n\nРубли: <b>{rub} ₽</b>\nЗвёзды: <b>{stars} ⭐</b>",
                parse_mode="HTML",
            )
            await c.answer("Баланс пополнен (mock)", show_alert=False)
        else:
            msg = data_json.get("message") or "Не удалось пополнить баланс"
            await c.answer(msg, show_alert=True)
        return

    if data.startswith("refresh_deals"):
        
        deals = get_all_deals()
        active_deals = [d for d in deals if d.get('status') == 'active']

        if not active_deals:
            await c.message.edit_text("📭 Сейчас нет доступных сделок.")
            await c.answer("Список сделок обновлен.")
            return

        
        text = f"🛒 <b>Доступные сделки ({len(active_deals)}):</b>\n\n"
        keyboard = InlineKeyboardBuilder()
        
        for i, d in enumerate(active_deals[:10], 1):
           
            seller = d.get('telegram_id', 'Неизвестно')
            stars = d.get('stars_amount', 0)
            price = d.get('price', 0)
            deal_id = d.get('uid', '')
            try:
                price_per_star = float(price) / float(stars) if float(stars) else 0
            except:
                price_per_star = 0
            text += f"<b>{i}. {stars} ⭐ за {price} ₽</b>\nПродавец: {seller}\nЦена за звезду: {price_per_star:.2f} ₽\nID: <code>{deal_id[:8]}...</code>\n\n"
        
        for d in active_deals[:5]:
            keyboard.add(InlineKeyboardButton(text=f"🛒 Купить {d['stars_amount']}⭐ за {d['price']}₽", callback_data=f"buy_{d['uid']}"))
        keyboard.add(InlineKeyboardButton(text="🔄 Обновить", callback_data="refresh_deals"))
        
        await c.message.edit_text(text, parse_mode="HTML", reply_markup=keyboard.as_markup())
        await c.answer("Список сделок обновлен.")
    
    else:
        await c.answer()


async def main():
    print("🛒 Запуск бота покупателя (bot2) с оплатой...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())