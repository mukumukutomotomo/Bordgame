<?php
header("Content-Type: application/json");
error_reporting(0);  // 🎯 PHP の警告を抑制
ini_set('display_errors', 0);  // 🎯 画面上にエラーを表示しない
include('db.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        $roomID = "room_" . bin2hex(random_bytes(4));

        $sql = "CREATE TABLE `$roomID` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            x INT DEFAULT 0,
            y INT DEFAULT 0,
            token VARCHAR(32) UNIQUE NOT NULL,
            playersize ENUM('small', 'normal', 'big') DEFAULT 'normal'
        )";
        $pdo->exec($sql);

        echo json_encode(["success" => true, "roomID" => $roomID]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
    }
}
?>
