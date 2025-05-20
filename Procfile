backend: cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000
llm_worker: cd llm_worker && python main.py

# `honcho start -e .env` если нужна информация из .env
# CRON:
# @reboot cd /home/user/project && honcho start >> app.log 2>&1
