from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

import schemas
from database import get_db
from auth import require_roles
from crud import reports as crud

router = APIRouter(prefix="/reports", tags=["Reports & Dashboard"])


@router.get("/dashboard-summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager"])),
):
    return crud.get_dashboard_summary(db)


@router.get("/sales-summary", response_model=schemas.SalesSummary)
def sales_summary(
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager"])),
):
    return crud.get_sales_summary(db, period)


@router.get("/top-products", response_model=List[schemas.TopProduct])
def top_products(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager"])),
):
    return crud.get_top_products(db, limit=limit)


@router.get("/slow-moving", response_model=List[schemas.ProductOut])
def slow_moving_products(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(["admin", "manager"])),
):
    return crud.get_slow_moving_products(db)
