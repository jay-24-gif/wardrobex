"""CRUD layer for user accounts (used by both routers/users.py and
routers/auth_router.py, since both need "find by username/email" and
"create user" logic)."""

from typing import List, Optional

from sqlalchemy.orm import Session

import models
import schemas
from auth import hash_password


def list_users(db: Session) -> List[models.User]:
    return db.query(models.User).order_by(models.User.user_id).all()


def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.user_id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_username_or_email(db: Session, username: str, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(
        (models.User.username == username) | (models.User.email == email)
    ).first()


def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    new_user = models.User(
        full_name=user_in.full_name,
        username=user_in.username,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role=user_in.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def set_user_status(db: Session, user: models.User, is_active: bool) -> models.User:
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: models.User, user_in: schemas.UserUpdate) -> models.User:
    data = user_in.model_dump(exclude_unset=True)
    password = data.pop("password", None)

    for field, value in data.items():
        setattr(user, field, value)

    if password:
        user.password_hash = hash_password(password)

    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: models.User) -> None:
    db.delete(user)
    db.commit()
