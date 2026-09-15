from collections.abc import Callable

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotAuthenticatedError, NotFoundError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import Role, User
from app.repositories.meeting_repository import MeetingRepository
from app.repositories.user_repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if token is None:
        raise NotAuthenticatedError("Missing bearer token.")

    payload = decode_access_token(token)
    if payload is None or "sub" not in payload:
        raise NotAuthenticatedError("Invalid or expired token.")

    user = UserRepository(db).get_by_id(int(payload["sub"]))
    if user is None or not user.is_active:
        raise NotAuthenticatedError("Invalid or expired token.")

    return user


def require_role(role: Role) -> Callable[[User], User]:
    def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != role:
            raise ForbiddenError(f"This action requires the {role.value} role.")
        return current_user

    return _check


def require_meeting_owner(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    meeting = MeetingRepository(db).get_by_id(meeting_id)
    if meeting is None:
        raise NotFoundError("Meeting not found.")
    if current_user.id != meeting.owner_id:
        raise ForbiddenError("Only the Meeting Owner may perform this action.")
    return current_user
