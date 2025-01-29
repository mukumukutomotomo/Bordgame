<?php
header("Content-Type: application/json");
include('db.php');

try {
    // 🎯 すべてのルームテーブルを取得
    $stmt = $pdo->query("SHOW TABLES LIKE 'room_%'");
    $rooms = [];

    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $rooms[] = $row[0]; // テーブル名（ルームID）を配列に追加
    }

    echo json_encode(["success" => true, "rooms" => $rooms]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
}
?>
