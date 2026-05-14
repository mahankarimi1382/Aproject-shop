<?php
require "config/db.php";

$sql = "SELECT id, name, price, image, stock FROM products";
$result = mysqli_query($conn, $sql);

$products = [];

while ($row = mysqli_fetch_assoc($result)) {
    $products[] = $row;
}

echo json_encode([
    "success" => true,
    "data" => $products
]);
