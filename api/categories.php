<?php
header('Content-Type: application/json; charset=utf-8');
require "config/db.php";

try {
    $res = mysqli_query($conn, "SELECT * FROM categories ORDER BY name ASC");
    if ($res) {
        $categories = mysqli_fetch_all($res, MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'data' => $categories]);
    } else {
        echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
