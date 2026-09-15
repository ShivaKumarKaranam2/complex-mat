from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.task import Task, TaskStatus


class TaskRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        meeting_id: int,
        title: str,
        assignee_id: int,
        description_notes: str | None,
        due_date: date | None,
    ) -> Task:
        task = Task(
            meeting_id=meeting_id,
            title=title,
            assignee_id=assignee_id,
            description_notes=description_notes,
            due_date=due_date,
            status=TaskStatus.TODO,
        )
        self.db.add(task)
        self.db.flush()
        self.db.refresh(task)
        return task

    def get_by_id(self, task_id: int) -> Task | None:
        return self.db.get(Task, task_id)

    def list_by_meeting(self, meeting_id: int) -> list[Task]:
        stmt = select(Task).where(Task.meeting_id == meeting_id).order_by(Task.created_at)
        return list(self.db.scalars(stmt).all())

    def list_by_assignee(self, user_id: int) -> list[tuple[Task, str]]:
        stmt = (
            select(Task, Meeting.title)
            .join(Meeting, Meeting.id == Task.meeting_id)
            .where(Task.assignee_id == user_id)
            .order_by(Task.created_at)
        )
        return [(task, meeting_title) for task, meeting_title in self.db.execute(stmt).all()]

    def update(self, task: Task, **fields: Any) -> Task:
        for key, value in fields.items():
            setattr(task, key, value)
        self.db.flush()
        self.db.refresh(task)
        return task

    def update_status(self, task: Task, status: TaskStatus) -> Task:
        return self.update(task, status=status)

    def update_description_notes(self, task: Task, description_notes: str | None) -> Task:
        return self.update(task, description_notes=description_notes)

    def delete(self, task: Task) -> None:
        self.db.delete(task)
        self.db.flush()
