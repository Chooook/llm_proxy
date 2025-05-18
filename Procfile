queue_service: cd queue_service && gunicorn -w 1 -b $HOST:$QUEUE_PORT    app:app --worker-class gevent
backend_proxy: cd backend_proxy && gunicorn -w 1 -b $HOST:$BACKEND_PORT  app:app --worker-class gevent
frontend:      cd frontend      && gunicorn -w 1 -b $HOST:$FRONTEND_PORT app:app --worker-class gevent
search_engine: cd search_engine && python search_router.py

# queue_service, возможно, лучше без gevent для синхронных запросов
# pip install honcho
# honcho start -e .env
# CRON:
# @reboot cd /home/user/project && honcho start >> app.log 2>&1
