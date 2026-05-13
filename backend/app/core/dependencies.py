from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedError
from app.core.security import UserContext, build_user_context_from_access_claims, decode_token
from app.database.session import get_db
from app.repositories.user_repository import UserRepository


def get_current_user(request: Request, db: Session = Depends(get_db)) -> UserContext:
    auth = request.headers.get("Authorization") or ""
    if not auth.startswith("Bearer "):
        raise UnauthorizedError("Missing bearer token")

    token = auth.removeprefix("Bearer ").strip()
    claims = decode_token(token)
    user_ctx = build_user_context_from_access_claims(claims)

    repo = UserRepository(db)
    user = repo.get_by_id(user_ctx.id)
    if not user:
        raise UnauthorizedError("User no longer exists")

    request.state.user_id = user.id
    return UserContext(
        id=user.id,
        username=user.username,
        role=user.role,
        allowed_machines=list(user.allowed_machines or []),
    )
