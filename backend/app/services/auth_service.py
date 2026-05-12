from __future__ import annotations

from datetime import datetime

import redis
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ForbiddenError, UnauthorizedError
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
    def __init__(self, *, db: Session, redis_client: redis.Redis | None = None):
        self.db = db
        self.redis = redis_client
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
        refresh, token_id = create_refresh_token(ctx)

        # Track refresh token (optional). If Redis isn't available, we skip revocation tracking.
        if self.redis:
            self.redis.setex(f"refresh:{token_id}", settings.JWT_REFRESH_EXPIRE_MINUTES * 60, "active")

        return access, refresh

    def refresh_access_token(self, refresh_token: str) -> tuple[str, str]:
        claims = decode_token(refresh_token)
        token_id = build_refresh_token_id(claims)
        user_id = str(claims.get("sub") or "")
        if not user_id:
            raise UnauthorizedError("Invalid refresh token")

        if self.redis:
            status = self.redis.get(f"refresh:{token_id}")
            if status != "active":
                raise UnauthorizedError("Refresh token revoked")

        user = self.users.get_by_id(user_id)
        if not user:
            raise UnauthorizedError("User not found")

        return self.issue_tokens(user)

    def revoke_refresh_token(self, refresh_token: str) -> None:
        if not self.redis:
            return
        claims = decode_token(refresh_token)
        token_id = build_refresh_token_id(claims)
        self.redis.delete(f"refresh:{token_id}")

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
