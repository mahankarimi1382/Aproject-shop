<?php
require "auth_check.php";
require "../config/db.php";

$stats = [];

// Total Users (Customers)
$res = mysqli_query($conn, "SELECT COUNT(*) as count FROM customers");
$stats['total_customers'] = mysqli_fetch_assoc($res)['count'];

// Total Products
$res = mysqli_query($conn, "SELECT COUNT(*) as count FROM products");
$stats['total_products'] = mysqli_fetch_assoc($res)['count'];

// Total Categories
$res = mysqli_query($conn, "SELECT COUNT(*) as count FROM categories");
$stats['total_categories'] = mysqli_fetch_assoc($res)['count'];

// Orders
$res = mysqli_query($conn, "SELECT COUNT(*) as count FROM orders WHERE status != 'Delivered' AND status != 'Rejected'");
$stats['active_orders'] = mysqli_fetch_assoc($res)['count'];

$res = mysqli_query($conn, "SELECT COUNT(*) as count FROM orders WHERE status = 'Delivered'");
$stats['completed_orders'] = mysqli_fetch_assoc($res)['count'];

// Recent Orders
$res = mysqli_query($conn, "SELECT o.id, c.full_name, o.total_price, o.status, o.created_at
                            FROM orders o
                            JOIN customers c ON o.customer_id = c.id
                            ORDER BY o.created_at DESC LIMIT 5");
$stats['recent_orders'] = mysqli_fetch_all($res, MYSQLI_ASSOC);

echo json_encode(['success' => true, 'data' => $stats]);
?>
