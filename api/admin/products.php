<?php
require "auth_check.php";
require "../config/db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = mysqli_prepare($conn, "SELECT * FROM products WHERE id = ?");
        mysqli_stmt_bind_param($stmt, "i", $id);
        mysqli_stmt_execute($stmt);
        $res = mysqli_stmt_get_result($stmt);
        $product = mysqli_fetch_assoc($res);

        // Get sizes
        $stmtSizes = mysqli_prepare($conn, "SELECT * FROM product_sizes WHERE product_id = ?");
        mysqli_stmt_bind_param($stmtSizes, "i", $id);
        mysqli_stmt_execute($stmtSizes);
        $resSizes = mysqli_stmt_get_result($stmtSizes);
        $product['sizes'] = mysqli_fetch_all($resSizes, MYSQLI_ASSOC);

        echo json_encode(['success' => true, 'data' => $product]);
    } else {
        $res = mysqli_query($conn, "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC");
        $products = mysqli_fetch_all($res, MYSQLI_ASSOC);
        echo json_encode(['success' => true, 'data' => $products]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $name = $data['name'];
    $price = $data['price'];
    $image = $data['image'];
    $stock = $data['stock'];
    $category_id = !empty($data['category_id']) ? intval($data['category_id']) : null;
    $is_featured = intval($data['is_featured'] ?? 0);

    if (!empty($data['id'])) {
        // Update
        $id = intval($data['id']);
        $stmt = mysqli_prepare($conn, "UPDATE products SET name=?, price=?, image=?, stock=?, category_id=?, is_featured=? WHERE id=?");
        mysqli_stmt_bind_param($stmt, "sdsiiii", $name, $price, $image, $stock, $category_id, $is_featured, $id);
    } else {
        // Insert
        $stmt = mysqli_prepare($conn, "INSERT INTO products (name, price, image, stock, category_id, is_featured) VALUES (?, ?, ?, ?, ?, ?)");
        mysqli_stmt_bind_param($stmt, "sdsiii", $name, $price, $image, $stock, $category_id, $is_featured);
    }

    if (mysqli_stmt_execute($stmt)) {
        $productId = !empty($data['id']) ? intval($data['id']) : mysqli_insert_id($conn);

        // Update sizes if provided
        if (isset($data['sizes'])) {
            // Simple approach: delete and re-insert
            $delSizeStmt = mysqli_prepare($conn, "DELETE FROM product_sizes WHERE product_id = ?");
            mysqli_stmt_bind_param($delSizeStmt, "i", $productId);
            mysqli_stmt_execute($delSizeStmt);

            $sizeStmt = mysqli_prepare($conn, "INSERT INTO product_sizes (product_id, size_name, stock, is_enabled) VALUES (?, ?, ?, ?)");
            foreach ($data['sizes'] as $size) {
                $stockVal = intval($size['stock']);
                $enabledVal = intval($size['is_enabled']);
                mysqli_stmt_bind_param($sizeStmt, "isii", $productId, $size['size_name'], $stockVal, $enabledVal);
                mysqli_stmt_execute($sizeStmt);
            }
        }

        echo json_encode(['success' => true, 'id' => $productId]);
    } else {
        echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
    }
} elseif ($method === 'DELETE') {
    $id = intval($_GET['id']);

    $stmt1 = mysqli_prepare($conn, "DELETE FROM product_sizes WHERE product_id = ?");
    mysqli_stmt_bind_param($stmt1, "i", $id);
    mysqli_stmt_execute($stmt1);

    $stmt2 = mysqli_prepare($conn, "DELETE FROM products WHERE id = ?");
    mysqli_stmt_bind_param($stmt2, "i", $id);
    mysqli_stmt_execute($stmt2);

    echo json_encode(['success' => true]);
}
?>
