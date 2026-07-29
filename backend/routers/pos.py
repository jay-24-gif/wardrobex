from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import schemas
from database import get_db
from auth import get_current_user, require_roles
from crud import pos as crud
from crud.pos import CheckoutError

router = APIRouter(prefix="/pos", tags=["Point of Sale"])


@router.post("/checkout", response_model=schemas.TransactionOut)
def checkout(
    order: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager", "cashier"])),
):
    if not order.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    try:
        return crud.create_transaction(db, order, user_id=current_user.user_id)
    except CheckoutError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("/transactions", response_model=List[schemas.TransactionOut])
def list_transactions(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return crud.list_transactions(db, limit=limit)


@router.get("/transactions/{transaction_id}", response_model=schemas.TransactionOut)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    txn = crud.get_transaction(db, transaction_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.post("/transactions/{transaction_id}/void")
def void_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager"])),
):
    txn = crud.get_transaction_for_void(db, transaction_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status == "voided":
        raise HTTPException(status_code=400, detail="Transaction already voided")

    crud.void_transaction(db, txn)
    return {"detail": "Transaction voided and stock restored"}
