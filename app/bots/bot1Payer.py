import asyncio
import logging
import requests
import os
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.filters.command import CommandObject
from aiogram.types import InlineKeyboardButton, LabeledPrice, PreCheckoutQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder
from urllib.parse import unquote_plus
from datetime import datetime

load_dotenv('config.env')
logging.basicConfig(level=logging.INFO)

BOT_TOKEN = os.getenv('BOT1_TOKEN')
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000')
STARS_PROVIDER_TOKEN = os.getenv('STARS_PAYMENT_PROVIDER_TOKEN') 
MOCK_PAYMENTS = os.getenv('MOCK_PAYMENTS', '1') == '1'

if not BOT_TOKEN:
    print("❌ Ошибка: BOT1_TOKEN не найден!")
    exit(1)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

import requests

def get_usd_to_rub_rate():
    try:
        r = requests.get("https://api.exchangerate.host/latest?base=USD&symbols=RUB")
        r.raise_for_status()
        data = r.json()
        return data['rates']['RUB']  
    except Exception as e:
        print("Ошибка получения курса USD→RUB:", e)
        return None


def get_user_deals(telegram_id):
    try:
        r = requests.post(f"{API_BASE_URL}/myDeals", json={"telegram_id": telegram_id})
        if r.status_code == 200:
            return r.json().get('myDeals', [])
        return []
    except Exception as e:
        logging.error(f"Ошибка получения сделок: {e}")
        return []


def get_deal_by_id(deal_id):
    try:
        r = requests.post(f"{API_BASE_URL}/getDealById", json={"dealId": deal_id})
        if r.status_code == 200:
            return r.json().get('neededDeal')
        return None
    except Exception as e:
        logging.error(f"Ошибка получения сделки: {e}")
        return None


def update_deal_status(deal_id, status):
    try:
        r = requests.post(f"{API_BASE_URL}/updateDeals", json={"dealUID": deal_id, "status": status})
        if r.status_code == 200:
            return r.json()
        return None
    except Exception as e:
        logging.error(f"Ошибка обновления сделки: {e}")
        return None


def get_balance(telegram_id: str):
    try:
        r = requests.post(f"{API_BASE_URL}/getBalance", json={"telegram_id": telegram_id})
        if r.status_code == 200:
            return r.json().get('balance')
        logging.error(f"get_balance error: {r.status_code} {r.text}")
        return None
    except Exception as e:
        logging.error(f"get_balance exception: {e}")
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
    except Exception as e:
        logging.error(f"change_balance exception: {e}")
        return None


async def send_invoice_with_stars_payment(chat_id: int, deal: dict):
    deal_id = deal.get('uid')
    stars = int(deal.get('stars_amount', 0))
    buyer = deal.get('buyer', 'Неизвестно')
    
    stars_in_nanostars = stars * 1000

    # Если токен не настроен, не пытаемся создавать реальный инвойс здесь
    if not STARS_PROVIDER_TOKEN:
        await bot.send_message(
            chat_id,
            "⚠️ Токен Telegram Stars не настроен, работаем в режиме мока."
        )
        return

    keyboard = InlineKeyboardBuilder()
    keyboard.add(InlineKeyboardButton(text="💫 Получить звёзды", pay=True))

    await bot.send_invoice(
        chat_id=chat_id,
        title="Получение оплаты звёздами 🌟",
        description=f"Оплата сделки {deal_id} от {buyer}",
        payload=f"stars_{deal_id}",
        provider_token=STARS_PROVIDER_TOKEN,
        currency="XTR",
        prices=[LabeledPrice(label=f"{stars}⭐", amount=stars_in_nanostars)],
        start_parameter="stars_payment",
        reply_markup=keyboard.as_markup()
    )


@dp.message(Command("start"))
async def start_handler(message: types.Message, command: CommandObject = None):
    args = command.args if command else None

    if args:
        raw = unquote_plus(args.strip())

        if raw.startswith("c_"):
            rest = raw[2:]
            parts = rest.split("_")
            if len(parts) >= 4:
                uid = parts[0]
                price_str = parts[-1]
                stars_str = parts[-2]
                seller_tg_encoded = "_".join(parts[1:-2])

                try:
                    stars = int(stars_str)
                    price = int(float(price_str))
                except ValueError:
                    await message.answer("❌ Неверные параметры сделки в ссылке.")
                    return

                seller_tg_display = f"@{seller_tg_encoded}" if seller_tg_encoded else "Неизвестно"

                text = (
                    "💫 Моковый перевод звёзд\n\n"
                    "Вы хотите создать сделку:\n"
                    f"{stars} ⭐ за {price} ₽\n"
                    f"ID: <code>{uid}</code>\n"
                    f"Продавец: <code>{seller_tg_display}</code>\n\n"
                    "Нажмите кнопку ниже, чтобы отправить звёзды (mock) и создать сделку."
                )

                kb = InlineKeyboardBuilder()
                kb.add(
                    InlineKeyboardButton(
                        text="💫 (MOCK) Отправить звёзды и создать сделку",
                        callback_data=f"create_cdeal_{uid}_{seller_tg_encoded}_{stars}_{price}",
                    )
                )
                kb.adjust(1)

                await message.answer(text, parse_mode="HTML", reply_markup=kb.as_markup())
                return

        await show_specific_deal(message, raw)
        return

    await message.answer("🌟 Привет! Это бот продавца.\nИспользуй /mydeals для просмотра сделок.")


@dp.message(Command("mydeals"))
async def mydeals_handler(message: types.Message):
    telegram_id = f"@{message.from_user.username}" if message.from_user.username else str(message.from_user.id)
    deals = get_user_deals(telegram_id)

    if not deals:
        await message.answer("📭 У вас пока нет активных сделок.")
        return

    text = f"📋 <b>Мои сделки ({len(deals)}):</b>\n\n"
    kb = InlineKeyboardBuilder()

    for i, d in enumerate(deals[:10], 1):
        stars = d.get('stars_amount', 0)
        price = d.get('price', 0)
        status = d.get('status', 'unknown')
        deal_id = d.get('uid', '')
        buyer = d.get('buyer', 'Нет')
        
        text += f"<b>{i}. {stars} ⭐ за {price} ₽</b> | Статус: {status.upper()}\n"
        if status == 'pending':
            text += f"Покупатель: {buyer} (Ожидает оплаты)\n"
            kb.add(InlineKeyboardButton(text=f"💫 Получить оплату за {stars}⭐", callback_data=f"stars_pay_{deal_id}"))
        else:
            text += f"Покупатель: {buyer}\n"
        
        text += f"ID: <code>{deal_id[:8]}...</code>\n\n"

    kb.adjust(1)
    await message.answer(text, parse_mode="HTML", reply_markup=kb.as_markup())


async def show_specific_deal(message: types.Message, deal_id: str):
    deal = get_deal_by_id(deal_id)
    if not deal:
        await message.answer("❌ Сделка не найдена.")
        return

    stars = int(deal.get('stars_amount', 0))
    price = float(deal.get('price', 0))
    status = deal.get('status', 'unknown')
    buyer = deal.get('buyer', 'Нет')
    seller = deal.get('telegram_id', 'Неизвестно')

    text = f"""
📦 <b>Сделка</b>
⭐ {stars} звёзд
💰 Цена: {price:.2f} ₽
🧑‍💼 Продавец: {seller}
👤 Покупатель: {buyer}
📊 Статус: {status.upper()}
🆔 ID: <code>{deal_id}</code>
    """

    kb = InlineKeyboardBuilder()

    if status == "pending":
        text += "\n💫 <b>Покупатель готов оплатить звёздами!</b>"
        kb.add(InlineKeyboardButton(text="💫 Получить оплату", callback_data=f"stars_pay_{deal_id}"))
    else:
        kb.add(InlineKeyboardButton(text="🔄 Обновить", callback_data=f"refresh_{deal_id}"))

    await message.answer(text, parse_mode="HTML", reply_markup=kb.as_markup())


@dp.callback_query()
async def callback_handler(c: types.CallbackQuery):
    data = c.data
    if data.startswith("create_cdeal_"):
        rest = data[len("create_cdeal_"):]
        parts = rest.split("_")
        if len(parts) < 4:
            await c.answer("Неверные параметры сделки", show_alert=True)
            return

        uid = parts[0]
        price_str = parts[-1]
        stars_str = parts[-2]
        seller_tg_encoded = "_".join(parts[1:-2])

        try:
            stars = int(stars_str)
            price = int(float(price_str))
        except ValueError:
            await c.answer("Неверные параметры сделки", show_alert=True)
            return

        seller_id = f"@{seller_tg_encoded}" if seller_tg_encoded else (f"@{c.from_user.username}" if c.from_user.username else str(c.from_user.id))

        deal_payload = {
            "uid": uid,
            "telegram_id": seller_id,
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "active",
            "stars_amount": stars,
            "price": price,
            "buyer": ""
        }

        try:
            r = requests.post(f"{API_BASE_URL}/handleDeal", json=deal_payload)
            if r.status_code == 200 and r.json().get("success"):
                await c.message.edit_text(
                    f"✅ (MOCK) Звёзды отправлены, сделка создана.\nID: <code>{uid}</code>",
                    parse_mode="HTML"
                )
                await c.answer("Сделка создана", show_alert=False)
            else:
                logging.error(f"Create deal via bot error: {r.status_code} {r.text}")
                await c.answer("Не удалось создать сделку", show_alert=True)
        except Exception as e:
            logging.error(f"Create deal via bot exception: {e}")
            await c.answer("Ошибка при создании сделки", show_alert=True)
        return

    deal_id = data.split("_")[-1]

    if data.startswith("stars_pay_"):

        deal = get_deal_by_id(deal_id)
        if not deal:
            await c.answer("❌ Сделка не найдена.", show_alert=True)
            return

        if not STARS_PROVIDER_TOKEN or MOCK_PAYMENTS:

            result = update_deal_status(deal_id, "completed")
            if result and result.get('success'):
                await c.message.edit_text(
                    f"✅ (MOCK) Звёзды отправлены, сделка <code>{deal_id}</code> завершена.",
                    parse_mode="HTML"
                )
            else:
                await c.message.edit_text(
                    f"⚠️ (MOCK) Не удалось обновить сделку <code>{deal_id}</code>.",
                    parse_mode="HTML"
                )
            await c.answer("Сделка завершена (mock)", show_alert=False)
            return

        await send_invoice_with_stars_payment(c.message.chat.id, deal)
        
        await c.message.edit_text(
            f"✅ Счет на оплату звёздами отправлен! Проверьте новое сообщение от бота.", 
            parse_mode="HTML"
        )
        await c.answer("💫 Ожидание оплаты звёздами...", show_alert=False)

    elif data.startswith("refresh_"):
        deal = get_deal_by_id(deal_id)
        if not deal:
            await c.answer("❌ Сделка не найдена.", show_alert=True)
            return

        stars = int(deal.get('stars_amount', 0))
        price = float(deal.get('price', 0))
        status = deal.get('status', 'unknown')
        buyer = deal.get('buyer', 'Нет')
        seller = deal.get('telegram_id', 'Неизвестно')

        text = f"""
📦 <b>Сделка</b>
⭐ {stars} звёзд
💰 Цена: {price:.2f} ₽
🧑‍💼 Продавец: {seller}
👤 Покупатель: {buyer}
📊 Статус: {status.upper()}
🆔 ID: <code>{deal_id}</code>
        """

        kb = InlineKeyboardBuilder()
        if status == "pending":
            text += "\n💫 <b>Покупатель готов оплатить звёздами!</b>"
            kb.add(InlineKeyboardButton(text="💫 Получить оплату", callback_data=f"stars_pay_{deal_id}"))
        else:
            kb.add(InlineKeyboardButton(text="🔄 Обновить", callback_data=f"refresh_{deal_id}"))

        await c.message.edit_text(text, parse_mode="HTML", reply_markup=kb.as_markup())
        await c.answer("🔄 Статус обновлен.")

    else:
        await c.answer()


@dp.pre_checkout_query()
async def process_pre_checkout_query(pre_checkout_q: PreCheckoutQuery):
    await bot.answer_pre_checkout_query(pre_checkout_q.id, ok=True)


@dp.message()
async def successful_payment_handler(message: types.Message):
    if message.successful_payment:
        payload = message.successful_payment.invoice_payload
        if payload.startswith("stars_"):
            deal_id = payload.split("_", 1)[1]
            result = update_deal_status(deal_id, "completed")
            
            if result and result.get('success'):
                await message.answer(
                    f"✅ Оплата звёздами успешно получена!\nСделка <code>{deal_id}</code> завершена.",
                    parse_mode="HTML"
                )
            else:
                await message.answer(
                    f"⚠️ Оплата получена, но не удалось обновить статус сделки <code>{deal_id}</code>. Обратитесь в поддержку.",
                    parse_mode="HTML"
                )


async def main():
    print("🤖 Запуск бота продавца с оплатой звёздами...")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())