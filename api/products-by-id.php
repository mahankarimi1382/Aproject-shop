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
    $sql = "SELECT * FROM products WHERE id IN ($placeholders)";

    $stmt = mysqli_prepare($conn, $sql);
    if ($stmt) {
        $types = str_repeat('i', count($cleanIds));
        mysqli_stmt_bind_param($stmt, $types, ...$cleanIds);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $products = mysqli_fetch_all($result, MYSQLI_ASSOC);

        // Fetch category_id for these products
        $categoryIds = array_unique(array_filter(array_map(function($p) { return $p['category_id']; }, $products)));

        if (!empty($categoryIds)) {
            $catPlaceholders = implode(',', array_fill(0, count($categoryIds), '?'));
            $sqlSizes = "SELECT id, category_id, size_name FROM category_sizes WHERE category_id IN ($catPlaceholders) AND is_enabled = 1 ORDER BY id ASC";
            $stmtSizes = mysqli_prepare($conn, $sqlSizes);
            if ($stmtSizes) {
                $catTypes = str_repeat('i', count($categoryIds));
                mysqli_stmt_bind_param($stmtSizes, $catTypes, ...$categoryIds);
                mysqli_stmt_execute($stmtSizes);
                $resultSizes = mysqli_stmt_get_result($stmtSizes);
                $allSizes = mysqli_fetch_all($resultSizes, MYSQLI_ASSOC);

                // Group sizes by category_id
                $sizesByCategory = [];
                foreach ($allSizes as $size) {
                    $sizesByCategory[$size['category_id']][] = [
                        'id' => $size['id'],
                        'size_name' => $size['size_name'],
                        'stock' => null
                    ];
                }

                // Attach sizes to products based on their category_id
                foreach ($products as &$product) {
                    $product['sizes'] = isset($sizesByCategory[$product['category_id']]) ? $sizesByCategory[$product['category_id']] : [];
                }
            }
        } else {
             foreach ($products as &$product) {
                $product['sizes'] = [];
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
