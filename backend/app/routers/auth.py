from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import UserContext
from app.database.session import get_db
from app.schemas.auth import LoginRequest, TokenPair, UserMe
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db=db)
    user = service.authenticate(payload.username, payload.password)
    access, refresh = service.issue_tokens(user)
    return TokenPair(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: dict, db: Session = Depends(get_db)):
    refresh_token = str(payload.get("refresh_token") or "")
    service = AuthService(db=db)
    access, refresh_tok = service.refresh_access_token(refresh_token)
    return TokenPair(access_token=access, refresh_token=refresh_tok)


@router.get("/me", response_model=UserMe)
def me(user: UserContext = Depends(get_current_user)):
    return UserMe(id=user.id, username=user.username, role=user.role, allowed_machines=user.allowed_machines)
