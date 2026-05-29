<?php

require "auth_check.php";
require "../config/db.php";

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];


/* IMAGE UPLOAD */

function uploadProductImage($file)
{

    $uploadDir = "../../assets/pics/";

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    if ($file["size"] > 5 * 1024 * 1024) {
        return null;
    }

    $tmp = $file["tmp_name"];

    $info = getimagesize($tmp);

    if (!$info) {
        return null;
    }

    $width = $info[0];
    $height = $info[1];
    $mime = $info["mime"];

    switch ($mime) {

        case "image/jpeg":
            $image = imagecreatefromjpeg($tmp);
            break;

        case "image/png":
            $image = imagecreatefrompng($tmp);
            break;

        case "image/webp":
            $image = imagecreatefromwebp($tmp);
            break;

        default:
            return null;
    }

    $max = 1000;

    if ($width > $max || $height > $max) {

        if ($width > $height) {

            $newWidth = $max;
            $newHeight = ($height / $width) * $max;
        } else {

            $newHeight = $max;
            $newWidth = ($width / $height) * $max;
        }
    } else {

        $newWidth = $width;
        $newHeight = $height;
    }

    $newImage = imagecreatetruecolor($newWidth, $newHeight);

    imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

    $fileName = time() . "_" . rand(1000, 9999) . ".webp";

    $path = $uploadDir . $fileName;

    imagewebp($newImage, $path, 80);

    imagedestroy($image);
    imagedestroy($newImage);

    return "../assets/pics/" . $fileName;
}


/* GET */

if ($method === 'GET') {

    if (isset($_GET['id'])) {

        $id = intval($_GET['id']);

        $stmt = mysqli_prepare($conn, "SELECT * FROM products WHERE id=?");
        mysqli_stmt_bind_param($stmt, "i", $id);
        mysqli_stmt_execute($stmt);

        $res = mysqli_stmt_get_result($stmt);

        $product = mysqli_fetch_assoc($res);

        echo json_encode(["success" => true, "data" => $product]);
    } else {

        $res = mysqli_query($conn, "
SELECT p.*,c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id=c.id
ORDER BY p.created_at DESC
");

        $products = mysqli_fetch_all($res, MYSQLI_ASSOC);

        echo json_encode(["success" => true, "data" => $products]);
    }
}


/* POST */

elseif ($method === 'POST') {

    $id = isset($_POST['id']) && !empty($_POST['id']) ? intval($_POST['id']) : null;

    $name = $_POST['name'] ?? '';
    $price = $_POST['price'] ?? 0;
    $stock = $_POST['stock'] ?? 0;
    $category_id = !empty($_POST['category_id']) ? intval($_POST['category_id']) : null;
    $is_featured = intval($_POST['is_featured'] ?? 0);

    if (empty($name)) {
        echo json_encode(["success" => false, "message" => "Name is required"]);
        exit;
    }

    $imagePath = null;

    if (isset($_FILES["image"]) && $_FILES["image"]["error"] === 0) {

        $imagePath = uploadProductImage($_FILES["image"]);
    }


    /* UPDATE */

    if ($id) {

        if ($imagePath) {

            $stmtOld = mysqli_prepare($conn, "SELECT image FROM products WHERE id=?");
            mysqli_stmt_bind_param($stmtOld, "i", $id);
            mysqli_stmt_execute($stmtOld);

            $resOld = mysqli_stmt_get_result($stmtOld);

            $old = mysqli_fetch_assoc($resOld);

            if ($old && $old['image']) {

                $file = "../../" . str_replace("../", "", $old['image']);

                if (file_exists($file)) {
                    unlink($file);
                }
            }

            $stmt = mysqli_prepare($conn, "
UPDATE products
SET name=?,price=?,image=?,stock=?,category_id=?,is_featured=?
WHERE id=?
");

            mysqli_stmt_bind_param($stmt, "sdsiiii", $name, $price, $imagePath, $stock, $category_id, $is_featured, $id);
        } else {

            $stmt = mysqli_prepare($conn, "
UPDATE products
SET name=?,price=?,stock=?,category_id=?,is_featured=?
WHERE id=?
");

            mysqli_stmt_bind_param($stmt, "sdiiii", $name, $price, $stock, $category_id, $is_featured, $id);
        }
    }


    /* INSERT */

    else {

        if ($imagePath) {
            $stmt = mysqli_prepare($conn, "
INSERT INTO products
(name,price,image,stock,category_id,is_featured)
VALUES (?,?,?,?,?,?)
");
            mysqli_stmt_bind_param($stmt, "sdsiii", $name, $price, $imagePath, $stock, $category_id, $is_featured);
        } else {
            $stmt = mysqli_prepare($conn, "
INSERT INTO products
(name,price,stock,category_id,is_featured)
VALUES (?,?,?,?,?)
");
            mysqli_stmt_bind_param($stmt, "sdiii", $name, $price, $stock, $category_id, $is_featured);
        }
    }


    if (mysqli_stmt_execute($stmt)) {

        $productId = $id ? $id : mysqli_insert_id($conn);

        echo json_encode(["success" => true, "id" => $productId]);
    } else {

        echo json_encode(["success" => false, "message" => mysqli_error($conn)]);
    }
}


/* DELETE */

elseif ($method === 'DELETE') {

    if (!isset($_GET['id'])) {
        echo json_encode(["success" => false, "message" => "ID is required"]);
        exit;
    }
    $id = intval($_GET['id']);

    $stmt = mysqli_prepare($conn, "SELECT image FROM products WHERE id=?");
    mysqli_stmt_bind_param($stmt, "i", $id);
    mysqli_stmt_execute($stmt);

    $res = mysqli_stmt_get_result($stmt);

    $row = mysqli_fetch_assoc($res);

    if ($row && $row['image']) {

        $file = "../../" . str_replace("../", "", $row['image']);

        if (file_exists($file)) {
            unlink($file);
        }
    }

    $stmt2 = mysqli_prepare($conn, "DELETE FROM products WHERE id=?");
    mysqli_stmt_bind_param($stmt2, "i", $id);
    mysqli_stmt_execute($stmt2);

    echo json_encode(["success" => true]);
}
?>
