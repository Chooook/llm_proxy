import json
import os
import time

from dotenv import load_dotenv
import requests

from utils import wait_for_server
from tasks import process_data

dotenv_path = '../.env'
load_dotenv(dotenv_path)
HOST = os.getenv('HOST')
QUEUE_PORT = os.getenv('QUEUE_PORT')
if not HOST or not QUEUE_PORT:
    raise ValueError('Не удалось получить параметры сервера'
                     ' из переменных окружения')
QUEUE_URL = f'http://{os.getenv("HOST")}:{os.getenv("QUEUE_PORT")}'
wait_for_server(QUEUE_URL)


def run_worker():
    while True:
        try:
            response = requests.get(f'{QUEUE_URL}/api/get-task')
            task = response.json()

            if not task:
                continue

            print(f'[x] Получена задача ID={task["id"]}', flush=True)
            payload = json.loads(task['payload'])['args'][0]
            result = process_data(payload)
            update_url = f'{QUEUE_URL}/api/update-result/{task["id"]}'
            requests.post(update_url, json={'result': result})
            print(f'[✓] Выполнена задача ID={task["id"]}', flush=True)

        except Exception as e:
            print(f'[!] Ошибка: {e}', flush=True)
        finally:
            time.sleep(3)

run_worker()
