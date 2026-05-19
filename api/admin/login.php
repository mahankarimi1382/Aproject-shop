<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require "../config/db.php";

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['username']) || !isset($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

$username = $data['username'];
$password = $data['password'];

$stmt = mysqli_prepare($conn, "SELECT id, password FROM admins WHERE username = ?");
mysqli_stmt_bind_param($stmt, "s", $username);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$admin = mysqli_fetch_assoc($result);

if ($admin && password_verify($password, $admin['password'])) {
    $_SESSION['admin_id'] = $admin['id'];
    $_SESSION['admin_username'] = $username;
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'نام کاربری یا رمز عبور اشتباه است.']);
}
?>
