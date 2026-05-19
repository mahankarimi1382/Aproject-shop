<?php
header("Content-Type: application/json; charset=UTF-8");

$conn = mysqli_connect("127.0.0.1", "root", "", "shop_db");
mysqli_set_charset($conn, "utf8");

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit;
}
