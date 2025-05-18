import time

import requests


def wait_for_server(url, timeout=30, interval=1):
    """Ждёт, пока указанный URL станет доступным"""
    start_time = time.time()
    while True:
        try:
            response = requests.get(f'{url}')
            if response.status_code == 200:
                print(f'[✓] Сервер {url} стал доступен', flush=True)
                return
        except requests.exceptions.ConnectionError:
            pass

        if time.time() - start_time > timeout:
            raise TimeoutError(f'Сервер {url} не стал доступен за {timeout} секунд')

        print(f'[ ] Ожидание доступности сервера {url}...', flush=True)
        time.sleep(interval)
