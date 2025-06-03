backend: cd backend/src && uvicorn main:app --reload --host $HOST --port $BACKEND_PORT
llm_worker: cd worker/src && python main.py
frontend: cd frontend/src && gunicorn -w 1 --worker-class gevent -b $HOST:$FRONTEND_PORT app:app
