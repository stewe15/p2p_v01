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


@dp.message(Command("start"))
async def start_handler(message: types.Message):
    deal_id = None

    if message.text:
        parts = message.text.split(maxsplit=1)
        if len(parts) > 1:
            deal_id = parts[1].strip()

    if deal_id:
        deal_id = unquote_plus(deal_id)
        if 2 <= len(deal_id) <= 256 and any(c.isalnum() for c in deal_id):
            await show_specific_deal_for_buy(message, deal_id)
            return
        await message.answer("❌ Неверный формат ID сделки в ссылке.")
        return

    await message.answer(
        "🌟 <b>Добро пожаловать!</b>\n\n"
        "Отправьте ссылку или ID сделки для покупки.\n\n",
        parse_mode="HTML"
    )

async def show_specific_deal_for_buy(message: types.Message, deal_id: str):
    deal = get_deal_by_id(deal_id)
    if not deal:
        await message.answer("❌ Сделка не найдена.")
        return

    status = deal.get('status')
    stars = int(deal.get('stars_amount', 0))
    price = float(deal.get('price', 0))
    seller = deal.get('telegram_id', 'Неизвестно')
    time = deal.get('time', '')

    text = f"""
🛒 <b>Информация о сделке</b>

📦 {stars} ⭐ за {price:.2f} ₽
👤 Продавец: {seller}
🕒 Создана: {time}
🆔 ID: <code>{deal_id}</code>
    """

    
    if status == "completed":
        await message.answer(text + "\n✅ <b>Сделка уже завершена.</b>", parse_mode="HTML")
        return

    
    keyboard = InlineKeyboardBuilder()
    if status != "completed":
        keyboard.add(
            InlineKeyboardButton(
                text=f"Оплатить {stars} ⭐ за {price:.2f}₽",
                callback_data=f"buy_{deal_id}"
            )
        )

    
    status_text = ""
    if status == "pending":
        status_text = "\n⏳ <b>Сделка ожидает оплаты.</b>"
    elif status == "active":
        status_text = "\n🟢 <b>Сделка активна и доступна к покупке.</b>"

    await message.answer(
        text + status_text,
        parse_mode="HTML",
        reply_markup=keyboard.as_markup() 
    )





@dp.callback_query(lambda c: c.data.startswith("buy_"))
async def process_buy_callback(c: types.CallbackQuery):
    deal_id = c.data.replace("buy_", "")
    
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

    if not PAYMENT_PROVIDER_TOKEN:
        await c.message.answer("❌ Ошибка: Токен платежного провайдера не настроен.")
        await c.answer()
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
            payload=f"deal_{deal_id}",
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
            deal_id = payload.split("_", 1)[1]
            username = f"@{message.from_user.username}" if message.from_user.username else str(message.from_user.id)
            
            
            logging.info(f"Успешная оплата! Deal ID: {deal_id}, Buyer: {username}")
            
            result = buy_deal(deal_id, username)
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