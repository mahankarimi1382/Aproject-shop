<?php
header('Content-Type: application/json; charset=utf-8');
require "config/db.php";

try {
    $sql = "SELECT id, name, price, image, stock
            FROM products
            WHERE is_featured = 1";

    $result = mysqli_query($conn, $sql);

    if ($result) {
        $products = mysqli_fetch_all($result, MYSQLI_ASSOC);
        echo json_encode([
            "success" => true,
            "data" => $products
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => mysqli_error($conn)
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>
