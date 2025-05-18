from enum import Enum

from pydantic import BaseModel


class TaskType(str, Enum):
    GENERATE = 'generate'

class TaskCreate(BaseModel):
    prompt: str
    task_type: TaskType
