"""CRUD/aggregation layer for the dashboard and reporting endpoints."""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import List

from sqlalchemy.orm import Session
from sqlalchemy import func

import models
import schemas


def get_dashboard_summary(db: Session) -> dict:
    today = datetime.utcnow().date()
    start_of_day = datetime.combine(today, datetime.min.time())

    today_sales = db.query(func.coalesce(func.sum(models.Transaction.total_amount), 0)).filter(
        models.Transaction.transaction_date >= start_of_day,
        models.Transaction.status == "completed",
    ).scalar()

    today_txn_count = db.query(func.count(models.Transaction.transaction_id)).filter(
        models.Transaction.transaction_date >= start_of_day,
        models.Transaction.status == "completed",
    ).scalar()

    low_stock_count = db.query(func.count(models.Product.product_id)).filter(
        models.Product.quantity_in_stock <= models.Product.reorder_threshold,
        models.Product.is_active == True,  # noqa: E712
    ).scalar()

    active_alerts = db.query(func.count(models.StockAlert.alert_id)).filter(
        models.StockAlert.is_resolved == False  # noqa: E712
    ).scalar()

    total_products = db.query(func.count(models.Product.product_id)).filter(
        models.Product.is_active == True  # noqa: E712
    ).scalar()

    return {
        "today_sales": today_sales,
        "today_transaction_count": today_txn_count,
        "low_stock_count": low_stock_count,
        "active_alerts_count": active_alerts,
        "total_active_products": total_products,
    }


def _period_start(period: str, now: datetime) -> datetime:
    if period == "daily":
        return datetime.combine(now.date(), datetime.min.time())
    if period == "weekly":
        return now - timedelta(days=7)
    return now - timedelta(days=30)  # monthly


def get_sales_summary(db: Session, period: str) -> schemas.SalesSummary:
    now = datetime.utcnow()
    start = _period_start(period, now)

    txns = db.query(models.Transaction).filter(
        models.Transaction.transaction_date >= start,
        models.Transaction.status == "completed",
    ).all()

    total_sales = sum((t.total_amount for t in txns), Decimal("0.00"))
    total_items_sold = 0
    for t in txns:
        total_items_sold += sum(i.quantity for i in t.items)

    return schemas.SalesSummary(
        period=period,
        total_sales=total_sales,
        total_transactions=len(txns),
        total_items_sold=total_items_sold,
    )


def get_top_products(db: Session, limit: int = 5) -> List[schemas.TopProduct]:
    results = (
        db.query(
            models.Product.product_id,
            models.Product.product_name,
            func.sum(models.TransactionItem.quantity).label("total_quantity_sold"),
            func.sum(models.TransactionItem.line_total).label("total_revenue"),
        )
        .join(models.TransactionItem, models.TransactionItem.product_id == models.Product.product_id)
        .join(models.Transaction, models.Transaction.transaction_id == models.TransactionItem.transaction_id)
        .filter(models.Transaction.status == "completed")
        .group_by(models.Product.product_id, models.Product.product_name)
        .order_by(func.sum(models.TransactionItem.quantity).desc())
        .limit(limit)
        .all()
    )

    return [
        schemas.TopProduct(
            product_id=r.product_id,
            product_name=r.product_name,
            total_quantity_sold=r.total_quantity_sold or 0,
            total_revenue=r.total_revenue or Decimal("0.00"),
        )
        for r in results
    ]


def get_slow_moving_products(db: Session) -> List[models.Product]:
    """Products with zero or very low sales activity (heuristic: high stock, few/no transactions)."""
    sold_product_ids = db.query(models.TransactionItem.product_id).distinct().subquery()
    return db.query(models.Product).filter(
        models.Product.is_active == True,  # noqa: E712
        ~models.Product.product_id.in_(sold_product_ids),
    ).all()
