from sqlalchemy import (
    Column, Integer, String, Boolean, DECIMAL, ForeignKey, TIMESTAMP, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum("admin", "manager", "cashier", "inventory_staff"), default="cashier")
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    transactions = relationship("Transaction", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=False)
    product_name = Column(String(150), nullable=False)
    sku = Column(String(50), unique=True, nullable=False)
    barcode = Column(String(50), unique=True)
    size = Column(String(20))
    color = Column(String(40))
    price = Column(DECIMAL(10, 2), nullable=False)
    cost_price = Column(DECIMAL(10, 2), default=0.00)
    quantity_in_stock = Column(Integer, default=0)
    reorder_threshold = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    category = relationship("Category", back_populates="products")


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    transaction_date = Column(TIMESTAMP, server_default=func.now())
    subtotal = Column(DECIMAL(10, 2), default=0.00)
    discount_amount = Column(DECIMAL(10, 2), default=0.00)
    tax_amount = Column(DECIMAL(10, 2), default=0.00)
    total_amount = Column(DECIMAL(10, 2), default=0.00)
    payment_method = Column(Enum("cash", "gcash", "card"), default="cash")
    amount_paid = Column(DECIMAL(10, 2), default=0.00)
    change_due = Column(DECIMAL(10, 2), default=0.00)
    status = Column(Enum("completed", "voided", "refunded"), default="completed")

    user = relationship("User", back_populates="transactions")
    items = relationship("TransactionItem", back_populates="transaction", cascade="all, delete-orphan")


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    transaction_item_id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.transaction_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    line_discount = Column(DECIMAL(10, 2), default=0.00)
    line_total = Column(DECIMAL(10, 2), nullable=False)

    transaction = relationship("Transaction", back_populates="items")
    product = relationship("Product")


class StockIn(Base):
    __tablename__ = "stock_in"

    stock_in_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    quantity_added = Column(Integer, nullable=False)
    supplier = Column(String(150))
    stock_in_date = Column(TIMESTAMP, server_default=func.now())
    notes = Column(String(255))

    product = relationship("Product")
    user = relationship("User")


class StockAlert(Base):
    __tablename__ = "stock_alerts"

    alert_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    alert_message = Column(String(255), nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    product = relationship("Product")
