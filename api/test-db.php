<?php
require "config/db.php";

echo json_encode([
    "success" => true,
    "message" => "Database connected ✅"
]);
