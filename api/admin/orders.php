<?php
require "auth_check.php";
require "../config/db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = mysqli_prepare($conn, "SELECT o.*, c.full_name, c.phone_number, c.address
                                    FROM orders o
                                    JOIN customers c ON o.customer_id = c.id
                                    WHERE o.id = ?");
        mysqli_stmt_bind_param($stmt, "i", $id);
        mysqli_stmt_execute($stmt);
        $res = mysqli_stmt_get_result($stmt);
        $order = mysqli_fetch_assoc($res);

        $stmtItems = mysqli_prepare($conn, "SELECT oi.*, p.name as product_name
                                         FROM order_items oi
                                         JOIN products p ON oi.product_id = p.id
                                         WHERE oi.order_id = ?");
        mysqli_stmt_bind_param($stmtItems, "i", $id);
        mysqli_stmt_execute($stmtItems);
        $resItems = mysqli_stmt_get_result($stmtItems);
        $order['items'] = mysqli_fetch_all($resItems, MYSQLI_ASSOC);

        echo json_encode(['success' => true, 'data' => $order]);
    } else {
        $res = mysqli_query($conn, "SELECT o.*, c.full_name FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.created_at DESC");
        $orders = mysqli_fetch_all($res, MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'data' => $orders]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'];
    $status = $data['status'];

    $stmt = mysqli_prepare($conn, "UPDATE orders SET status = ? WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "si", $status, $id);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
    }
}
?>
