

import asyncio
import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Установить зависимости"""
    print("Устанавливаем зависимости...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("Зависимости установлены")
    except subprocess.CalledProcessError as e:
        print(f"Ошибка установки зависимостей: {e}")
        return False
    return True

def run_bot(bot_file):
    """Запустить бота"""
    print(f"🤖 Запускаем {bot_file}...")
    try:
        subprocess.run([sys.executable, bot_file])
    except KeyboardInterrupt:
        print(f"\nОстановлен {bot_file}")
    except Exception as e:
        print(f"Ошибка запуска {bot_file}: {e}")

def main():
    """Главная функция"""
    print("Запуск Telegram ботов")
    print("=" * 50)
    
    bot1_file = "bot1Payer.py"
    bot2_file = "bot2Buyer.py"
    
    if not os.path.exists(bot1_file):
        print(f"Файл {bot1_file} не найден")
        return
    
    if not os.path.exists(bot2_file):
        print(f"Файл {bot2_file} не найден")
        return
    
   
    if not install_requirements():
        return
    
    print("\nДоступные боты:")
    print("1. bot1Payer.py - Бот продавца")
    print("2. bot2Buyer.py - Бот покупателя")
    print("3. Оба бота одновременно")
    print("0. Выход")
    
    while True:
        try:
            choice = input("\nВыберите бота для запуска (0-3): ").strip()
            
            if choice == "0":
                print("👋 До свидания!")
                break
            elif choice == "1":
                print("\nЗапуск бота продавца...")
                print("Не забудьте установить токен в bot1Payer.py!")
                run_bot(bot1_file)
            elif choice == "2":
                print("\nЗапуск бота покупателя...")
                print("⚠️ Не забудьте установить токен в bot2Buyer.py!")
                run_bot(bot2_file)
            elif choice == "3":
                print("\nЗапуск обоих ботов...")
                print("Не забудьте установить токены в файлах ботов!")
                print("Для одновременного запуска используйте отдельные терминалы")
                print("\nТерминал 1:")
                print(f"python {bot1_file}")
                print("\nТерминал 2:")
                print(f"python {bot2_file}")
                break
            else:
                print("Неверный выбор. Попробуйте снова.")
                
        except KeyboardInterrupt:
            print("\n👋 До свидания!")
            break
        except Exception as e:
            print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    main()
