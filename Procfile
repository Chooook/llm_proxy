backend: cd backend && uvicorn main:app --reload --host $HOST --port $BACKEND_PORT
llm_worker: cd llm_worker && python main.py
frontend: cd frontend && gunicorn -w 1 --worker-class gevent -b $HOST:$FRONTEND_PORT app:app
# source /opt/python/virtualenv/jupyter/bin/activate ~/.conda_env && redis-server --bind $HOST --port $REDIS_PORT --protected-mode no

# @reboot cd /home/user/project && load_env_and_run.sh >> app.log 2>&1
