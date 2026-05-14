<?php
require "config/db.php";

if (!isset($_GET['ids'])) {
    echo json_encode([
        "success" => false,
        "message" => "ids parameter required"
    ]);
    exit;
}

$ids = $_GET['ids']; 

// مثال: 1,2,3
$idArray = explode(",", $ids);

$cleanIds = [];

foreach ($idArray as $id) {
    $cleanIds[] = intval($id);
}

$idList = implode(",", $cleanIds);

$sql = "SELECT id, name, price, image, stock FROM products WHERE id IN ($idList)";
$result = mysqli_query($conn, $sql);

$products = [];

while ($row = mysqli_fetch_assoc($result)) {
    $products[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $products
]);
