from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


@dataclass(frozen=True)
class UserContext:
    id: str
    username: str
    role: str
    allowed_machines: list[str]


def create_access_token(user: UserContext) -> str:
    if not settings.JWT_SECRET:
        raise UnauthorizedError("JWT_SECRET is not configured")

    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": user.id,
        "username": user.username,
        "role": user.role,
        "allowed_machines": user.allowed_machines,
        "typ": "access",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user: UserContext) -> tuple[str, str]:
    if not settings.JWT_SECRET:
        raise UnauthorizedError("JWT_SECRET is not configured")

    token_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=settings.JWT_REFRESH_EXPIRE_MINUTES)
    payload = {
        "sub": user.id,
        "jti": token_id,
        "typ": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, token_id


def decode_token(token: str) -> dict:
    if not settings.JWT_SECRET:
        raise UnauthorizedError("JWT_SECRET is not configured")

    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError as exc:
        raise UnauthorizedError("Invalid token") from exc


def build_user_context_from_access_claims(claims: dict) -> UserContext:
    if claims.get("typ") != "access":
        raise UnauthorizedError("Invalid access token")
    user_id = claims.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token subject")
    return UserContext(
        id=str(user_id),
        username=str(claims.get("username") or ""),
        role=str(claims.get("role") or "repairer"),
        allowed_machines=list(claims.get("allowed_machines") or []),
    )


def build_refresh_token_id(claims: dict) -> str:
    if claims.get("typ") != "refresh":
        raise UnauthorizedError("Invalid refresh token")
    jti = claims.get("jti")
    if not jti:
        raise UnauthorizedError("Missing refresh token id")
    return str(jti)
