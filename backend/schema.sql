-- =====================================================
-- WardrobeX Database Schema
-- POS and Inventory Management System for Retail Clothing Store
-- =====================================================

CREATE DATABASE IF NOT EXISTS wardrobex_db;
USE wardrobex_db;

-- Drop tables in reverse dependency order (safe re-run)
DROP TABLE IF EXISTS stock_alerts;
DROP TABLE IF EXISTS stock_in;
DROP TABLE IF EXISTS transaction_items;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- =====================================================
-- 1. USERS  (Manager, Cashier, Inventory Staff, Admin)
-- =====================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'cashier', 'inventory_staff') NOT NULL DEFAULT 'cashier',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. CATEGORIES
-- =====================================================
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- =====================================================
-- 3. PRODUCTS
-- =====================================================
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(50) UNIQUE,
    size VARCHAR(20),
    color VARCHAR(40),
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0.00,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    reorder_threshold INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================================
-- 4. TRANSACTIONS (POS sales header)
-- =====================================================
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('cash', 'gcash', 'card') NOT NULL DEFAULT 'cash',
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    change_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('completed', 'voided', 'refunded') NOT NULL DEFAULT 'completed',
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================================
-- 5. TRANSACTION ITEMS (POS sales line items)
-- =====================================================
CREATE TABLE transaction_items (
    transaction_item_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    line_total DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_titems_transaction FOREIGN KEY (transaction_id)
        REFERENCES transactions(transaction_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_titems_product FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================================
-- 6. STOCK IN (restocking log)
-- =====================================================
CREATE TABLE stock_in (
    stock_in_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    quantity_added INT NOT NULL,
    supplier VARCHAR(150),
    stock_in_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255),
    CONSTRAINT fk_stockin_product FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_stockin_user FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

-- =====================================================
-- 7. STOCK ALERTS (low-stock notifications)
-- =====================================================
CREATE TABLE stock_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    alert_message VARCHAR(255) NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alerts_product FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Default admin user (password: Admin@123 -- hashed at first backend run via /auth/register recommended instead)
INSERT INTO categories (category_name, description) VALUES
('T-Shirts', 'Casual t-shirts and tops'),
('Pants', 'Jeans, slacks, and trousers'),
('Jackets', 'Outerwear and jackets'),
('Dresses', 'Dresses and gowns'),
('Accessories', 'Belts, caps, and other accessories');

INSERT INTO products (category_id, product_name, sku, barcode, size, color, price, cost_price, quantity_in_stock, reorder_threshold) VALUES
(1, 'Classic Crew Tee', 'TSH-001', '4801234500011', 'M', 'White', 299.00, 150.00, 50, 10),
(1, 'Graphic Print Tee', 'TSH-002', '4801234500028', 'L', 'Black', 349.00, 170.00, 8, 10),
(2, 'Slim Fit Jeans', 'PNT-001', '4801234500035', '32', 'Blue', 899.00, 500.00, 25, 5),
(3, 'Denim Jacket', 'JKT-001', '4801234500042', 'M', 'Blue', 1299.00, 700.00, 4, 5),
(4, 'Summer Floral Dress', 'DRS-001', '4801234500059', 'S', 'Multicolor', 999.00, 550.00, 15, 8),
(5, 'Leather Belt', 'ACC-001', '4801234500066', 'One Size', 'Brown', 399.00, 180.00, 30, 10);
