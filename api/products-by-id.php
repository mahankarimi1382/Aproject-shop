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

        // Fetch sizes for these products
        $sqlSizes = "SELECT * FROM product_sizes WHERE product_id IN ($placeholders) AND is_enabled = 1 ORDER BY id ASC";
        $stmtSizes = mysqli_prepare($conn, $sqlSizes);
        if ($stmtSizes) {
            mysqli_stmt_bind_param($stmtSizes, $types, ...$cleanIds);
            mysqli_stmt_execute($stmtSizes);
            $resultSizes = mysqli_stmt_get_result($stmtSizes);
            $allSizes = mysqli_fetch_all($resultSizes, MYSQLI_ASSOC);

            // Group sizes by product_id
            $sizesByProduct = [];
            foreach ($allSizes as $size) {
                $sizesByProduct[$size['product_id']][] = [
                    'id' => $size['id'],
                    'size_name' => $size['size_name'],
                    'stock' => (int)$size['stock']
                ];
            }

            // Attach sizes to products
            foreach ($products as &$product) {
                $product['sizes'] = isset($sizesByProduct[$product['id']]) ? $sizesByProduct[$product['id']] : [];
            }
        }

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
