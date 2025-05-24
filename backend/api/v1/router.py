import asyncio
import json
import uuid

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from core.redis import redis_client
from core.task_short_id import generate_short_id
from schemas.task import TaskCreate

router = APIRouter(prefix='/api/v1')


@router.post('/enqueue')
async def submit_task(task: TaskCreate):
    task_id = str(uuid.uuid4())
    # TODO: replace with real user id when authentication is implemented
    task.user_id = 'localuser'
    short_id = generate_short_id(task_id, task.user_id)
    redis_client.setex(f'task:{task_id}', 3600, json.dumps({
        'status': 'queued',
        'prompt': task.prompt,
        'type': task.task_type,
        'user_id': task.user_id,
        'short_task_id': short_id
    }))
    redis_client.rpush('task_queue', task_id)
    return {'task_id': task_id, 'short_id': short_id}


@router.get('/subscribe/{task_id}')
async def stream_status(task_id: str):
    async def event_generator():
        last_status = ''
        while True:
            raw_task = redis_client.get(f'task:{task_id}')
            if not raw_task:
                break
            task = json.loads(raw_task)
            if task['status'] != last_status:
                yield json.dumps(task)
                last_status = task['status']
            if task['status'] in ['completed', 'failed']:
                break
            await asyncio.sleep(1)
    return EventSourceResponse(event_generator())


@router.get('/tasks')
async def list_tasks():
    task_ids = redis_client.lrange('task_queue', 0, -1)
    task_ids = [task_id.decode('utf-8') for task_id in task_ids]
    tasks = []
    for task_id in task_ids:
        task = json.loads(redis_client.get(f'task:{task_id}'))
        tasks.append({
            'task_id': task_id,
            'status': task['status'],
            'prompt': task['prompt'],
            'type': task['type'],
            'user_id': task['user_id'],
            'short_task_id': task['short_id']
        })
    return tasks
