from sqlalchemy.orm import Session

from app.core.exceptions import InvalidCredentialsError
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


def login(db: Session, employee_mail_id: str, password: str) -> tuple[User, str]:
    user = UserRepository(db).get_by_mail_id(employee_mail_id)
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError("Employee Mail ID or Password is incorrect.")

    token = create_access_token(subject=user.id)
    return user, token
