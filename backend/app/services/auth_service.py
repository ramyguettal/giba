from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import UnauthorizedError
from app.core.security import (
    UserContext,
    build_refresh_token_id,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, *, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def authenticate(self, username: str, password: str) -> User:
        user = self.users.get_by_username(username)
        if not user or not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid username or password")
        return user

    def issue_tokens(self, user: User) -> tuple[str, str]:
        ctx = UserContext(
            id=user.id,
            username=user.username,
            role=user.role,
            allowed_machines=list(user.allowed_machines or []),
        )
        access = create_access_token(ctx)
        refresh, _ = create_refresh_token(ctx)
        return access, refresh

    def refresh_access_token(self, refresh_token: str) -> tuple[str, str]:
        claims = decode_token(refresh_token)
        build_refresh_token_id(claims)
        user_id = str(claims.get("sub") or "")
        if not user_id:
            raise UnauthorizedError("Invalid refresh token")

        user = self.users.get_by_id(user_id)
        if not user:
            raise UnauthorizedError("User not found")

        return self.issue_tokens(user)

    def ensure_bootstrap_admin(self) -> None:
        if not settings.BOOTSTRAP_ADMIN_USERNAME or not settings.BOOTSTRAP_ADMIN_PASSWORD:
            return
        existing = self.users.get_by_username(settings.BOOTSTRAP_ADMIN_USERNAME)
        if existing:
            return

        allowed = [m.strip() for m in settings.BOOTSTRAP_ADMIN_ALLOWED_MACHINES.split(",") if m.strip()]
        self.users.create(
            username=settings.BOOTSTRAP_ADMIN_USERNAME,
            password_hash=hash_password(settings.BOOTSTRAP_ADMIN_PASSWORD),
            role="admin",
            allowed_machines=allowed,
        )
