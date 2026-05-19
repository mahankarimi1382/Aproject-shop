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

    // 3. Add Order Items
    $itemStmt = mysqli_prepare($conn, "INSERT INTO order_items (order_id, product_id, size, quantity, price) VALUES (?, ?, ?, ?, ?)");
    foreach ($items as $item) {
        mysqli_stmt_bind_param($itemStmt, "iisid", $orderId, $item['id'], $item['size'], $item['quantity'], $item['price']);
        mysqli_stmt_execute($itemStmt);

        // Optional: Reduce stock in product_sizes or products table
        // For simplicity, we just reduce from products table here if you want
        // mysqli_query($conn, "UPDATE products SET stock = stock - {$item['quantity']} WHERE id = {$item['id']}");
    }

    mysqli_commit($conn);
    echo json_encode(['success' => true, 'message' => 'Order placed successfully', 'orderId' => $orderId]);

} catch (Exception $e) {
    mysqli_rollback($conn);
    echo json_encode(['success' => false, 'message' => 'Error placing order: ' . $e->getMessage()]);
}
?>
