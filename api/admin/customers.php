<?php
require "auth_check.php";
require "../config/db.php";

$res = mysqli_query($conn, "SELECT * FROM customers ORDER BY created_at DESC");
$customers = mysqli_fetch_all($res, MYSQLI_ASSOC);
echo json_encode(['success' => true, 'data' => $customers]);
?>
