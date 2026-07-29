from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db
from auth import require_roles
from crud import users as crud

router = APIRouter(prefix="/users", tags=["Users Management"])


@router.get("", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["admin"])),
):
    return crud.list_users(db)


@router.post("", response_model=schemas.UserOut, status_code=201)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["admin"])),
):
    existing = crud.get_user_by_username_or_email(db, user_in.username, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    return crud.create_user(db, user_in)


@router.patch("/{user_id}/status", response_model=schemas.UserOut)
def update_user_status(
    user_id: int,
    payload: schemas.UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["admin"])),
):
    if user_id == current_user.user_id and not payload.is_active:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return crud.set_user_status(db, user, payload.is_active)


@router.patch("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["admin"])),
):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.role and payload.role != user.role and user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    if payload.is_active is False and user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")

    if payload.username or payload.email:
        existing = crud.get_user_by_username_or_email(
            db,
            payload.username or user.username,
            payload.email or user.email,
        )
        if existing and existing.user_id != user_id:
            raise HTTPException(status_code=400, detail="Username or email already registered")

    return crud.update_user(db, user, payload)


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles(["admin"])),
):
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        crud.delete_user(db, user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="This user has recorded transactions and cannot be deleted. Deactivate the account instead.",
        )
