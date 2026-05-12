from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str) -> User | None:
        return self.db.query(User).filter(User.username == username).first()

    def get_by_id(self, user_id: str) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def create(self, *, username: str, password_hash: str, role: str, allowed_machines: list[str]) -> User:
        user = User(
            username=username,
            password_hash=password_hash,
            role=role,
            allowed_machines=allowed_machines,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
