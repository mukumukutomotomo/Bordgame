<?php
header("Content-Type: application/json");
error_reporting(0);  // 🎯 PHP の警告を抑制
ini_set('display_errors', 0);  // 🎯 画面上にエラーを表示しない
include('db.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        // 🎯 ランダムなルームIDを生成
        $roomID = "room_" . bin2hex(random_bytes(4));

        // 🎯 ルーム専用のテーブルを作成（プレイヤーデータを保存）
        $sql = "CREATE TABLE `$roomID` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL,
            x INT DEFAULT 0,
            y INT DEFAULT 0,
            mapID VARCHAR(20) NOT NULL DEFAULT 'map-01', -- ✅ 追加: プレイヤーのいるマップを記録
            hp INT DEFAULT 10 CHECK (hp BETWEEN 0 AND 10),
            token VARCHAR(32) UNIQUE NOT NULL,
            playersize ENUM('small', 'normal', 'big') DEFAULT 'normal',
            Card_ID_001 BOOLEAN DEFAULT FALSE,
            Card_ID_002 BOOLEAN DEFAULT FALSE,
            Card_ID_003 BOOLEAN DEFAULT FALSE,
            Card_ID_004 BOOLEAN DEFAULT FALSE,
            Card_ID_005 BOOLEAN DEFAULT FALSE,
            Card_ID_006 BOOLEAN DEFAULT FALSE,
            Card_ID_007 BOOLEAN DEFAULT FALSE,
            Card_ID_008 BOOLEAN DEFAULT FALSE
        )";        
        $pdo->exec($sql);

        echo json_encode(["success" => true, "roomID" => $roomID]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "error" => "データベースエラー"]);
    }
}
?>
