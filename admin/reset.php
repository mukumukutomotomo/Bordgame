<?php
header("Content-Type: application/json");
include('db.php');

$roomID = $_POST["room"] ?? '';

if (empty($roomID)) {
    echo json_encode(["success" => false, "error" => "ルームIDが指定されていません"]);
    exit;
}

try {
    // 🎯 ルームのテーブルを削除
    $stmt = $pdo->prepare("DROP TABLE IF EXISTS `$roomID`");
    $stmt->execute();

    echo json_encode(["success" => true, "message" => "ルーム $roomID のデータが削除されました"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
}
?>
