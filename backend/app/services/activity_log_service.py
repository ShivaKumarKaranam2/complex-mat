from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLogEntry


def log_activity(db: Session, actor_id: int, action: str, entity_type: str, entity_id: int) -> None:
    entry = ActivityLogEntry(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    db.add(entry)
    db.flush()
