from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError
from app.db.session import get_db
from app.deps.auth import get_current_user, require_meeting_owner
from app.models.task import Task
from app.models.user import Role, User
from app.repositories.user_repository import UserRepository
from app.schemas.task import (
    TaskCreateRequest,
    TaskResponse,
    TaskStatusUpdateRequest,
    TaskUpdateRequest,
    TaskWithMeetingResponse,
)
from app.services import task_service

router = APIRouter(tags=["tasks"])


def task_to_response(db: Session, task: Task) -> TaskResponse:
    assignee = UserRepository(db).get_by_id(task.assignee_id)
    return TaskResponse(
        id=task.id,
        meeting_id=task.meeting_id,
        title=task.title,
        description_notes=task.description_notes,
        assignee_id=task.assignee_id,
        assignee_name=assignee.employee_name if assignee else "",
        due_date=task.due_date,
        status=task.status,
        needs_reassignment=task.needs_reassignment,
    )


def _to_with_meeting(task: Task, meeting_title: str) -> TaskWithMeetingResponse:
    return TaskWithMeetingResponse(
        id=task.id,
        meeting_id=task.meeting_id,
        meeting_title=meeting_title,
        title=task.title,
        description_notes=task.description_notes,
        due_date=task.due_date,
        status=task.status,
        needs_reassignment=task.needs_reassignment,
    )


@router.get("/api/tasks/mine", response_model=list[TaskWithMeetingResponse])
def list_my_tasks(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[TaskWithMeetingResponse]:
    rows = task_service.list_my_tasks(db, current_user)
    return [_to_with_meeting(task, meeting_title) for task, meeting_title in rows]


@router.post(
    "/api/meetings/{meeting_id}/tasks", response_model=TaskResponse, status_code=201
)
def create_task(
    meeting_id: int,
    payload: TaskCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_meeting_owner),
) -> TaskResponse:
    task = task_service.create_task(
        db,
        owner=current_user,
        meeting_id=meeting_id,
        title=payload.title,
        assignee_id=payload.assignee_id,
        description_notes=payload.description_notes,
        due_date=payload.due_date,
    )
    return task_to_response(db, task)


@router.patch("/api/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    task = task_service.update_task_status(db, current_user, task_id, payload.status)
    return task_to_response(db, task)


@router.patch("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskResponse:
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        raise ForbiddenError("At least one task field is required.")
    task = task_service.update_task(db, current_user, task_id, fields)
    return task_to_response(db, task)


@router.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    task_service.delete_task(db, current_user, task_id)
