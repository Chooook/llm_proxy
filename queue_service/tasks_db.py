import json
import sqlite3
import time


class TasksDB:
    def __init__(self, db_name):
        self._db_name = db_name
        self._setup_db()

    def _connect(self):
        # TODO вернуть подгрузку инфы из wal и shm кэша
        # опция check_same_thread должна позволять создавать новые
        # соединения в разных потоках, но может быть менее безопасна
        conn = sqlite3.connect(self._db_name, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute('PRAGMA journal_mode=WAL;')
        return conn

    def _setup_db(self):
        creation_query = '''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload TEXT NOT NULL,
                result TEXT,
                error TEXT,
                status TEXT DEFAULT 'pending',
                retries INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 3,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        '''
        with self._connect() as conn:
            conn.execute('PRAGMA journal_mode=WAL;')
            conn.execute(creation_query)
            conn.commit()

    def enqueue(self, task_name, *args, **kwargs):
        payload = json.dumps({
            'task': task_name,
            'args': args,
            'kwargs': kwargs
        })
        enqueue_query = 'INSERT INTO tasks (payload) VALUES (?)'
        with self._connect() as conn:
            cur = conn.execute(enqueue_query, (payload,))
            conn.commit()
            return cur.lastrowid

    def get_next_task(self):
        mark_task_as_in_progress_query = '''
            UPDATE tasks
            SET status='in_progress',
                retries = retries + 1 
            WHERE id = (
                SELECT id
                FROM tasks 
                WHERE status = 'pending'
                      AND (expires_at IS NULL
                           OR expires_at > CURRENT_TIMESTAMP)
                      AND retries < max_retries
                ORDER BY created_at ASC 
                LIMIT 1
            )
        '''
        get_marked_task_query = '''
            SELECT id,
                   payload
            FROM tasks
            WHERE status = 'in_progress'
            ORDER BY created_at ASC
            LIMIT 1
        '''
        with self._connect() as conn:
            conn.execute('BEGIN IMMEDIATE')
            cur = conn.execute(mark_task_as_in_progress_query)
            if cur.rowcount == 0:
                return None
            row = conn.execute(get_marked_task_query).fetchone()
            return dict(row) if row else None

    def update_result(self, task_id, result=None, error=None):
        update_query = '''
            UPDATE tasks
            SET result=?,
                error=?,
                status=?
            WHERE id=?
        '''
        with self._connect() as conn:
            conn.execute(
                update_query,
                (json.dumps(result) if result else None,
                 str(error) if error else None,
                 'done' if not error else 'failed',
                 task_id)
            )
            conn.commit()

    def get_result(self, task_id):
        get_result_query = '''
            SELECT id,
                   status,
                   result,
                   error
            FROM tasks
            WHERE id=?
        '''
        with self._connect() as conn:
            row = conn.execute(get_result_query, (task_id,)).fetchone()
            return dict(row) if row else None

    def get_all_tasks(self):
        get_all_tasks_query = '''
            SELECT id,
                   status,
                   created_at
            FROM tasks
            ORDER BY created_at DESC
        '''
        with self._connect() as conn:
            rows = conn.execute(get_all_tasks_query).fetchall()
            return [dict(row) for row in rows]

    def subscribe_to_task(self, task_id):
        while True:
            result = self.get_result(task_id)
            if result and result['status'] in ['done', 'failed']:
                yield f'data: {json.dumps(result)}\n\n'
                break
            time.sleep(1)
