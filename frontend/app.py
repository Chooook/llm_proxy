import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template

from utils import wait_for_server

dotenv_path = '../.env'
load_dotenv(dotenv_path)
BACKEND_URL = f'http://{os.getenv("HOST")}:{os.getenv("BACKEND_PORT")}'
wait_for_server(BACKEND_URL)

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/config')
def get_config():
    return jsonify({'BACKEND_URL': BACKEND_URL})
