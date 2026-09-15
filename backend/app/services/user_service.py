from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository


def search_users(db: Session, q: str | None, active_only: bool) -> list[User]:
    return UserRepository(db).search(q, active_only)
