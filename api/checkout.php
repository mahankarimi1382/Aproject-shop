<?php
header('Content-Type: application/json; charset=utf-8');
require "config/db.php";

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

$customer = $data['customer'];
$items = $data['items'];
$totalPrice = $data['totalPrice'];

mysqli_begin_transaction($conn);

try {
    // 1. Handle Customer
    $stmt = mysqli_prepare($conn, "SELECT id FROM customers WHERE phone_number = ?");
    mysqli_stmt_bind_param($stmt, "s", $customer['phone']);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $customerRow = mysqli_fetch_assoc($result);

    if ($customerRow) {
        $customerId = $customerRow['id'];
        // Optional: Update customer info
        $updateStmt = mysqli_prepare($conn, "UPDATE customers SET full_name = ?, address = ? WHERE id = ?");
        mysqli_stmt_bind_param($updateStmt, "ssi", $customer['fullName'], $customer['address'], $customerId);
        mysqli_stmt_execute($updateStmt);
    } else {
        $insertStmt = mysqli_prepare($conn, "INSERT INTO customers (full_name, phone_number, address) VALUES (?, ?, ?)");
        mysqli_stmt_bind_param($insertStmt, "sss", $customer['fullName'], $customer['phone'], $customer['address']);
        mysqli_stmt_execute($insertStmt);
        $customerId = mysqli_insert_id($conn);
    }

    // 2. Create Order
    $orderStmt = mysqli_prepare($conn, "INSERT INTO orders (customer_id, total_price, status) VALUES (?, ?, 'Pending')");
    mysqli_stmt_bind_param($orderStmt, "id", $customerId, $totalPrice);
    mysqli_stmt_execute($orderStmt);
    $orderId = mysqli_insert_id($conn);

    // 3. Add Order Items and Update Stock
    $itemStmt = mysqli_prepare($conn, "INSERT INTO order_items (order_id, product_id, size, quantity, price) VALUES (?, ?, ?, ?, ?)");
    $stockStmt = mysqli_prepare($conn, "UPDATE product_sizes SET stock = stock - ? WHERE product_id = ? AND size_name = ?");

    foreach ($items as $item) {
        // Add to order_items
        mysqli_stmt_bind_param($itemStmt, "iisid", $orderId, $item['id'], $item['size'], $item['quantity'], $item['price']);
        mysqli_stmt_execute($itemStmt);

        // Update product_sizes stock
        mysqli_stmt_bind_param($stockStmt, "iis", $item['quantity'], $item['id'], $item['size']);
        mysqli_stmt_execute($stockStmt);

        // Also update main products table stock if needed (total stock)
        $updateTotalStock = mysqli_prepare($conn, "UPDATE products SET stock = stock - ? WHERE id = ?");
        mysqli_stmt_bind_param($updateTotalStock, "ii", $item['quantity'], $item['id']);
        mysqli_stmt_execute($updateTotalStock);
    }

    mysqli_commit($conn);
    echo json_encode(['success' => true, 'message' => 'Order placed successfully', 'orderId' => $orderId]);

} catch (Exception $e) {
    mysqli_rollback($conn);
    echo json_encode(['success' => false, 'message' => 'Error placing order: ' . $e->getMessage()]);
}
?>
