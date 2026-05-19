-- Database Schema for Aproject E-commerce

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Updating Products Table
-- Assuming 'products' table already exists with: id, name, price, image, stock, created_at
ALTER TABLE products ADD COLUMN category_id INT;
ALTER TABLE products ADD COLUMN is_featured TINYINT(1) DEFAULT 0;
ALTER TABLE products ADD FOREIGN KEY (category_id) REFERENCES categories(id);

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Rejected', 'Processing', 'Shipped', 'Delivered') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    size VARCHAR(20),
    quantity INT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 7. Category Sizes (Templates for sizes per category)
CREATE TABLE IF NOT EXISTS category_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    size_name VARCHAR(20) NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 8. Product Size Inventory
CREATE TABLE IF NOT EXISTS product_sizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    size_name VARCHAR(20) NOT NULL,
    stock INT DEFAULT 0,
    is_enabled TINYINT(1) DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Default Admin Account (password: admin123)
-- INSERT INTO admins (username, password) VALUES ('admin', '$2y$10$Ph9N59y3oP9.FmY6zYV.I.N2f1G8v6z9Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y');
