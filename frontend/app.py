from flask import Flask, jsonify, render_template

from settings import settings

BACKEND_URL = f'http://{settings.BACKEND_HOST}:{settings.BACKEND_PORT}'

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/config')
def get_config():
    return jsonify({'BACKEND_URL': BACKEND_URL})
