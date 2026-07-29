from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ---------- AUTH ----------
class UserCreate(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role: str = "cashier"


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    full_name: str
    username: str
    email: EmailStr
    role: str
    is_active: bool


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- CATEGORY ----------
class CategoryCreate(BaseModel):
    category_name: str
    description: Optional[str] = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    category_id: int
    category_name: str
    description: Optional[str] = None


# ---------- PRODUCT ----------
class ProductCreate(BaseModel):
    category_id: int
    product_name: str
    sku: str
    barcode: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    price: Decimal
    cost_price: Decimal = Decimal("0.00")
    quantity_in_stock: int = 0
    reorder_threshold: int = 10


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    product_name: Optional[str] = None
    price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    quantity_in_stock: Optional[int] = None
    reorder_threshold: Optional[int] = None
    is_active: Optional[bool] = None
    size: Optional[str] = None
    color: Optional[str] = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    category_id: int
    product_name: str
    sku: str
    barcode: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    price: Decimal
    cost_price: Decimal
    quantity_in_stock: int
    reorder_threshold: int
    is_active: bool


class StockInCreate(BaseModel):
    product_id: int
    quantity_added: int
    supplier: Optional[str] = None
    notes: Optional[str] = None


# ---------- POS / TRANSACTIONS ----------
class CartItem(BaseModel):
    product_id: int
    quantity: int
    line_discount: Decimal = Decimal("0.00")


class TransactionCreate(BaseModel):
    items: List[CartItem]
    payment_method: str = "cash"
    amount_paid: Decimal
    discount_amount: Decimal = Decimal("0.00")
    tax_rate: Decimal = Decimal("0.12")  # 12% VAT default


class TransactionItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    product_id: int
    quantity: int
    unit_price: Decimal
    line_discount: Decimal
    line_total: Decimal


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    transaction_id: int
    user_id: int
    transaction_date: datetime
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    payment_method: str
    amount_paid: Decimal
    change_due: Decimal
    status: str
    items: List[TransactionItemOut] = []


# ---------- REPORTS ----------
class SalesSummary(BaseModel):
    period: str
    total_sales: Decimal
    total_transactions: int
    total_items_sold: int


class TopProduct(BaseModel):
    product_id: int
    product_name: str
    total_quantity_sold: int
    total_revenue: Decimal
