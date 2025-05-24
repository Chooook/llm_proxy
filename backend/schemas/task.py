from enum import Enum

from pydantic import BaseModel


class TaskType(str, Enum):
    GENERATE = 'generate'
    SEARCH = 'search'

class TaskCreate(BaseModel):
    prompt: str
    task_type: TaskType = TaskType.GENERATE
