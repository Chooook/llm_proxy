import asyncio
import json
from typing import Dict, Callable, Awaitable

import aioredis
from loguru import logger

from settings import settings


class TaskProcessingError(Exception):
    pass


logger.add('worker.log', level=settings.LOGLEVEL, rotation='10 MB')

task_handlers: Dict[str, Callable[[str, aioredis.Redis], Awaitable[None]]] = {}

async def main():
    register_handlers()

    if not task_handlers:
        logger.error("❌ Нет доступных обработчиков задач!")
        return

    redis = aioredis.Redis.from_url(
        f'redis://{settings.HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}',
        decode_responses=True
    )
    try:
        await worker_loop(redis)
    finally:
        await redis.close()


def register_handlers():
    """Регистрирует доступные обработчики задач"""
    try:
        import llama_cpp
        task_handlers['generate_local'] = _handle_generate_local_task
        logger.info("✅ LLM обработчик зарегистрирован")
    except ImportError:
        logger.warning(
            "⚠️ LLM обработчик недоступен: зависимости не установлены")


async def _handle_generate_local_task(task_id: str, redis: aioredis.Redis):
    """Обработчик для задач с локальным инференсом"""
    try:
        from llama_cpp import (Llama,
                               ChatCompletionRequestUserMessage,
                               ChatCompletionRequestSystemMessage)
    except ImportError:
        await mark_task_failed(
            redis,
            task_id,
            "LLM обработка недоступна: отсутствуют зависимости"
        )
        raise TaskProcessingError("LLM зависимости не установлены")

    task_data = await redis.get(f'task:{task_id}')
    if not task_data:
        logger.warning(f'⚠️ Задача {task_id} не найдена')
        return

    # Ленивая инициализация модели
    if not hasattr(_handle_generate_local_task, 'llm'):
        try:
            _handle_generate_local_task.llm = Llama(
                model_path=settings.MODEL_PATH,
                n_ctx=65536,
                n_thread=12,
                n_batch=512,
                verbose=False
            )
            logger.info('✅ Модель LLM инициализирована')
        except Exception as e:
            await mark_task_failed(
                redis,
                task_id,
                f"Ошибка инициализации модели: {str(e)}"
            )
            raise TaskProcessingError(f"Ошибка модели: {e}")

    task = json.loads(task_data)
    prompt = task['prompt']
    logger.debug(f'🧠 Получен prompt: {prompt}')
    try:
        system_message: ChatCompletionRequestSystemMessage = {
            "role": "system",
            "content": "Ты — помощник, который даёт краткие ответы.",
        }
        user_message = ChatCompletionRequestUserMessage(
            role="user",
            content=prompt
        )
        output = _handle_generate_local_task.llm.create_chat_completion(
            messages=[system_message, user_message],
            max_tokens=512,
        )
        result = output['choices'][0]['message']['content'].strip()
        logger.debug(f'🧠 Результат: {result}')

        task['status'] = 'completed'
        task['result'] = result
        await redis.setex(f'task:{task_id}', 86400, json.dumps(task))
        logger.info(f'✅ Задача {task_id} выполнена')

    except Exception as e:
        await mark_task_failed(
            redis,
            task_id,
            f"Ошибка обработки LLM: {str(e)}"
        )
        raise


async def _handle_generate_api_task(task_id: str, redis: aioredis.Redis):
    # TODO
    pass


async def process_task(task_id: str, redis: aioredis.Redis):
    """Основной обработчик задач"""
    task_data = await redis.get(f'task:{task_id}')
    if not task_data:
        logger.warning(f'⚠️ Задача {task_id} не найдена')
        return

    task = json.loads(task_data)
    handler = task_handlers.get(task['type'])

    if not handler:
        await mark_task_failed(
            redis,
            task_id,
            f"Неподдерживаемый тип задачи: {task['type']}"
        )
        return

    try:
        await handler(task_id, redis)
    except Exception as e:
        logger.error(f"Ошибка обработки задачи {task_id}: {str(e)}")

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


async def mark_task_failed(
        redis: aioredis.Redis, task_id: str, error_msg: str):
    task_data = await redis.get(f'task:{task_id}')
    if task_data:
        task = json.loads(task_data)
        task['status'] = 'failed'
        task['error'] = error_msg
        await redis.setex(f'task:{task_id}', 86400, json.dumps(task))



if __name__ == '__main__':
    asyncio.run(main())
