from flask import Flask, Response, jsonify, request

from tasks_db import TasksDB

DB_NAME = 'tasks.db'
db = TasksDB(DB_NAME)

app = Flask(__name__)

@app.route('/')
def check_in():
    return jsonify({'status': 'ok'})

@app.route('/api/enqueue', methods=['POST'])
def enqueue():
    data = request.json
    task_id = db.enqueue('process_data', data.get('input'))
    return jsonify({'task_id': task_id})

@app.route('/api/status/<int:task_id>', methods=['GET'])
def status(task_id):
    result = db.get_result(task_id)
    if not result:
        return jsonify({'error': 'Task not found'}), 404
    return jsonify(result)

@app.route('/api/subscribe/<int:task_id>')
def subscribe(task_id):
    return Response(db.subscribe_to_task(task_id), content_type='text/event-stream')

@app.route('/api/tasks', methods=['GET'])
def list_tasks():
    tasks = db.get_all_tasks()
    return jsonify(tasks)

@app.route('/api/get-task', methods=['GET'])
def get_task():
    task = db.get_next_task()
    return jsonify(task) if task else jsonify({})

@app.route('/api/update-result/<int:task_id>', methods=['POST'])
def update_result(task_id):
    data = request.json
    result = data.get('result')
    error = data.get('error')

    try:
        db.update_result(task_id, result=result, error=error)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
