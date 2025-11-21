import subprocess
import sys
import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent


PROCESSES = []


def spawn(cmd, cwd=None):
    """Запустить подпроцесс и запомнить его."""
    if cwd is None:
        cwd = PROJECT_ROOT
    print(f"[RUN] {cmd} (cwd={cwd})")
    # shell=True нужен для корректного запуска npm на Windows
    p = subprocess.Popen(cmd, cwd=str(cwd), shell=True)
    PROCESSES.append(p)
    return p


def main():
    backend_dir = PROJECT_ROOT / "backend"
    bots_dir = PROJECT_ROOT / "app" / "bots"

    if not backend_dir.exists():
        print(f"❌ Не найдена папка backend: {backend_dir}")
        return

    if not bots_dir.exists():
        print(f"❌ Не найдена папка с ботами: {bots_dir}")
        return

    try:
        # Бэкенд (Flask)
        spawn(f"{sys.executable} app.py", cwd=backend_dir)

        # Боты
        spawn(f"{sys.executable} bot1Payer.py", cwd=bots_dir)
        spawn(f"{sys.executable} bot2Buyer.py", cwd=bots_dir)

        # Фронт (Next.js)
        spawn("npm run dev", cwd=PROJECT_ROOT)

        print("\nВсе процессы запущены. Нажмите Ctrl+C для остановки.")

        # Ждём, пока не прервут
        while True:
            for p in PROCESSES:
                ret = p.poll()
                if ret is not None:
                    print(f"Процесс {p.pid} завершился с кодом {ret}")
                    PROCESSES.remove(p)
            if not PROCESSES:
                print("Все процессы завершились.")
                break
    except KeyboardInterrupt:
        print("\nОстанавливаем все процессы...")
    finally:
        for p in PROCESSES:
            if p.poll() is None:
                try:
                    p.terminate()
                except Exception:
                    pass


if __name__ == "__main__":
    main()
