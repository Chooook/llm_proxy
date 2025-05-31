1. [x] Разделить requirements частей проекта в свои файлы
2. [x] Переделать backend с flask на fastapi+uvicorn+sse_starlette
3. [x] Добавить redis вместо sqlite (redis, redis unix)
4. [x] Реализовать search, подключить очередь redis
5. [ ] Dummy handler for tests
6. [ ] Redis to PG/GP if >100 tasks (.env param) and at server stop
7. [ ] Renew event-stream connect at page reload
8. [ ] Добавить postgres бд для мониторинга и архива задач, использовать асинхронно (tortoise_db, asyncpg)
9. [ ] Переделать frontend на react (npm+)
10. [ ] Реализовать мониторинг всего что только можно (loguru, prometheus, grafana)
11. [ ] Реализовать контроль зависимостей для разных пакетных менеджеров
12. [ ] Переделать всё на docker-compose
13. [ ] Реализовать search на основе фреймворка для развертывания llm
14. [ ] Реализовать полнотекстовый поиск в качестве отдельного сервиса
