<?php
require "auth_check.php";
require "../config/db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $res = mysqli_query($conn, "
        SELECT cs.*, c.name as category_name 
        FROM category_sizes cs 
        JOIN categories c ON cs.category_id = c.id 
        ORDER BY cs.id DESC
    ");
    $sizes = mysqli_fetch_all($res, MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'data' => $sizes]);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = isset($data['id']) && !empty($data['id']) ? intval($data['id']) : null;
    $category_id = intval($data['category_id']);
    $size_name = $data['size_name'];
    $is_enabled = isset($data['is_enabled']) ? intval($data['is_enabled']) : 1;

    if ($id) {
        $stmt = mysqli_prepare($conn, "UPDATE category_sizes SET category_id = ?, size_name = ?, is_enabled = ? WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "isii", $category_id, $size_name, $is_enabled, $id);
    } else {
        $stmt = mysqli_prepare($conn, "INSERT INTO category_sizes (category_id, size_name, is_enabled) VALUES (?, ?, ?)");
        mysqli_stmt_bind_param($stmt, "isi", $category_id, $size_name, $is_enabled);
    }

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true, 'id' => $id ? $id : mysqli_insert_id($conn)]);
    } else {
        echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
    }
} elseif ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        echo json_encode(["success" => false, "message" => "ID is required"]);
        exit;
    }
    $id = intval($_GET['id']);
    $stmt = mysqli_prepare($conn, "DELETE FROM category_sizes WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);
    echo json_encode(['success' => true]);
}
?>
