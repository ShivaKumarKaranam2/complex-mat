from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps.auth import require_role
from app.models.user import Role, User
from app.schemas.user import UserResponse
from app.services import user_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def search_users(
    q: str | None = Query(default=None),
    active_only: bool = Query(default=True, alias="activeOnly"),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role(Role.ADMIN)),
) -> list[UserResponse]:
    users = user_service.search_users(db, q, active_only)
    return [UserResponse.model_validate(user) for user in users]
