from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import UserContext
from app.database.session import get_db
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("/query", response_model=ChatQueryResponse)
def query(payload: ChatQueryRequest, user: UserContext = Depends(get_current_user), db: Session = Depends(get_db)):
    return ChatService(db=db).query(user=user, req=payload)
