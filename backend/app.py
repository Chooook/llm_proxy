import os

import requests
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

from utils import wait_for_server

dotenv_path = '../.env'
load_dotenv(dotenv_path)
HOST = os.getenv('HOST')
QUEUE_PORT = os.getenv('QUEUE_PORT')
if not HOST or not QUEUE_PORT:
    raise ValueError('Не удалось получить параметры сервера'
                     ' из переменных окружения')
QUEUE_URL = f'http://{HOST}:{QUEUE_PORT}'
wait_for_server(QUEUE_URL)

app = Flask(__name__)

FRONTEND_PORT = os.getenv('FRONTEND_PORT')
CORS(app, resources={r'/api/*': {'origins': f'http://{HOST}:{FRONTEND_PORT}'}})


@app.route('/')
def check_in():
    return jsonify({'status': 'ok'})

@app.route('/api/enqueue', methods=['POST'])
def enqueue():
    resp = requests.post(f'{QUEUE_URL}/api/enqueue', json=request.json)
    return jsonify(resp.json()), resp.status_code

@app.route('/api/status/<int:task_id>', methods=['GET'])
def status(task_id):
    resp = requests.get(f'{QUEUE_URL}/api/status/{task_id}')
    return jsonify(resp.json()), resp.status_code

@app.route('/api/subscribe/<int:task_id>')
def subscribe(task_id):
    def generate():
        url = f'{QUEUE_URL}/api/subscribe/{task_id}'
        with requests.get(url, stream=True) as r:
            for chunk in r.iter_content(chunk_size=1024):
                if chunk:
                    yield chunk

    return Response(generate(), content_type='text/event-stream')

@app.route('/api/tasks', methods=['GET'])
def list_tasks():
    resp = requests.get(f'{QUEUE_URL}/tasks')
    return jsonify(resp.json()), resp.status_code
