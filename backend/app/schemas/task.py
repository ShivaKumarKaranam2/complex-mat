from datetime import date

from app.models.task import TaskStatus
from app.schemas.camel import CamelModel


class TaskCreateRequest(CamelModel):
    title: str
    assignee_id: int
    description_notes: str | None = None
    due_date: date | None = None


class TaskUpdateRequest(CamelModel):
    title: str | None = None
    description_notes: str | None = None
    assignee_id: int | None = None
    due_date: date | None = None


class TaskResponse(CamelModel):
    id: int
    meeting_id: int
    title: str
    description_notes: str | None
    assignee_id: int
    assignee_name: str
    due_date: date | None
    status: TaskStatus
    needs_reassignment: bool

    model_config = CamelModel.model_config | {"from_attributes": True}


class TaskWithMeetingResponse(CamelModel):
    id: int
    meeting_id: int
    meeting_title: str
    title: str
    description_notes: str | None
    due_date: date | None
    status: TaskStatus
    needs_reassignment: bool

    model_config = CamelModel.model_config | {"from_attributes": True}


class TaskStatusUpdateRequest(CamelModel):
    status: TaskStatus
