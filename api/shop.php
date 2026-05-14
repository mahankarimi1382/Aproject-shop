<?php
header('Content-Type: application/json; charset=utf-8');
require "config/db.php"; // مسیر فایل کانفیگ دیتابیس

$response = ['success' => false, 'data' => []];

try {
    // دریافت پارامترها
    $q = isset($_GET['q']) ? mysqli_real_escape_string($conn, $_GET['q']) : '';
    $sort = isset($_GET['sort']) ? $_GET['sort'] : 'newest';

    // کوئری پایه
    $sql = "SELECT id, name, price, image, stock, created_at FROM products WHERE 1=1";

    // اعمال جستجو
    if (!empty($q)) {
        $sql .= " AND name LIKE '%$q%'";
    }

    // اعمال مرتب‌سازی
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

    // اجرای کوئری
    $result = mysqli_query($conn, $sql);

    if ($result) {
        $products = mysqli_fetch_all($result, MYSQLI_ASSOC);
        $response['success'] = true;
        $response['data'] = $products;
    } else {
        $response['message'] = 'خطا در دریافت اطلاعات از دیتابیس.';
    }

} catch (Exception $e) {
    $response['message'] = 'خطای سرور: ' . $e->getMessage();
}

echo json_encode($response);
?>
