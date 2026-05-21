<?php
header('Content-Type: application/json; charset=utf-8');
require "config/db.php";

if (!isset($_GET['ids'])) {
    echo json_encode([
        "success" => false,
        "message" => "ids parameter required"
    ]);
    exit;
}

try {
    $ids = $_GET['ids'];
    $idArray = explode(",", $ids);
    $cleanIds = array_map('intval', $idArray);

    if (empty($cleanIds)) {
        echo json_encode(["success" => true, "data" => []]);
        exit;
    }

    $placeholders = implode(',', array_fill(0, count($cleanIds), '?'));
    // Assuming description might be added or we just fetch everything available
    $sql = "SELECT * FROM products WHERE id IN ($placeholders)";

    $stmt = mysqli_prepare($conn, $sql);
    if ($stmt) {
        $types = str_repeat('i', count($cleanIds));
        mysqli_stmt_bind_param($stmt, $types, ...$cleanIds);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $products = mysqli_fetch_all($result, MYSQLI_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $products
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "خطا در اجرای کوئری."
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>
