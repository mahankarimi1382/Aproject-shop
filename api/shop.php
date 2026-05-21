<?php
header('Content-Type: application/json; charset=utf-8');
require "config/db.php";

$response = ['success' => false, 'data' => []];

try {
    $q = isset($_GET['q']) ? $_GET['q'] : '';
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'newest';
    $category_id = isset($_GET['category_id']) ? intval($_GET['category_id']) : 0;

    $sql = "SELECT id, name, price, image, stock, created_at FROM products WHERE 1=1";
    $params = [];
    $types = "";

    if (!empty($q)) {
        $sql .= " AND name LIKE ?";
        $params[] = "%$q%";
        $types .= "s";
    }

    if ($category_id > 0) {
        $sql .= " AND category_id = ?";
        $params[] = $category_id;
        $types .= "i";
    }

    switch ($sort) {
        case 'price_asc':
            $sql .= " ORDER BY price ASC";
            break;
        case 'price_desc':
            $sql .= " ORDER BY price DESC";
            break;
        case 'newest':
        default:
            $sql .= " ORDER BY created_at DESC";
            break;
    }

    $stmt = mysqli_prepare($conn, $sql);
    if ($stmt) {
        if (!empty($params)) {
            mysqli_stmt_bind_param($stmt, $types, ...$params);
        }
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $products = mysqli_fetch_all($result, MYSQLI_ASSOC);

        $response['success'] = true;
        $response['data'] = $products;
    } else {
        $response['message'] = 'خطا در اجرای کوئری.';
    }

} catch (Exception $e) {
    $response['message'] = 'خطای سرور: ' . $e->getMessage();
}

echo json_encode($response);
?>
