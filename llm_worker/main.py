import asyncio
import json

import aioredis
from llama_cpp import (
    ChatCompletionRequestSystemMessage,
    ChatCompletionRequestUserMessage,
)
from llama_cpp import Llama
from loguru import logger

from settings import settings

logger.add('worker.log', level=settings.LOGLEVEL, rotation='10 MB')

logger.info(f'📥 Загрузка модели: {settings.MODEL_PATH}')
llm = Llama(
    model_path=settings.MODEL_PATH,
    n_ctx=65536,
    n_thread=12,
    n_batch=512,
    verbose=False
)
logger.info('✅ Модель загружена')
system_message: ChatCompletionRequestSystemMessage = {
    "role": "system",
    "content": "Ты — помощник, который даёт краткие ответы.",
}

def run_llm_inference(prompt: str) -> str:
    logger.info(f'🧠 Получен prompt: {prompt}')
    user_message: ChatCompletionRequestUserMessage = {
        "role": "user",
        "content": prompt,
    }
    try:
        output = llm.create_chat_completion(
            messages=[system_message, user_message],
            max_tokens=512,
        )
        response = output['choices'][0]['message']['content'].strip()
        return response
    except Exception as e:
        logger.error(f'❌ Ошибка при генерации: {e}')
        return f'[Ошибка] {str(e)}'


async def process_task(task_id: str, redis_client: aioredis.Redis):
    task_data = await redis_client.get(f'task:{task_id}')
    if not task_data:
        logger.warning(f'⚠️ Задача {task_id} не найдена')
        return

    task = json.loads(task_data)
    prompt = task['prompt']
    logger.info(f'🔄 Начинаем обработку задачи {task_id}')
    logger.debug(f'🧠 Промпт: {prompt}')

    # Выносим синхронный вызов LLM в отдельный поток
    result = await asyncio.to_thread(run_llm_inference, prompt)
    logger.debug(f'🧠 Результат: {result}')

    task['status'] = 'completed'
    task['result'] = result
    await redis_client.setex(f'task:{task_id}', 86400, json.dumps(task))
    logger.info(f'✅ Задача {task_id} выполнена')


async def worker_loop(redis_client: aioredis.Redis):
    logger.info('👂 Worker запущен. Ожидание задач...')
    while True:
        try:
            _, task_id = await redis_client.blpop('task_queue', timeout=0)
            logger.info(f'📥 Получена задача: {task_id}')
            await process_task(task_id, redis_client)
        except Exception as e:
            logger.error(f'⚠️ Ошибка в worker: {e}')
            await asyncio.sleep(5)


async def main():
    redis_client = aioredis.Redis.from_url(
        f'redis://{settings.HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}',
        decode_responses=True
    )
    try:
        await worker_loop(redis_client)
    finally:
        await redis_client.close()


if __name__ == '__main__':
    asyncio.run(main())
