from enum import Enum

from pydantic import BaseModel


class TaskType(str, Enum):
    GENERATE = 'generate'
    SEARCH = 'search'

class TaskCreate(BaseModel):
    prompt: str
    # TODO: replace with real user id when authentication is implemented:
    user_id: str = 'localuser'
    task_type: TaskType = TaskType.GENERATE
