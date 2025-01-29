<?php
header("Content-Type: application/json");
require_once __DIR__ . "/db.php";  // `db.php` を読み込む

// 受信データの取得
$token = $_GET['token'] ?? '';
$x = $_GET['x'] ?? '';
$y = $_GET['y'] ?? '';
$room = $_GET['room'] ?? '';

try {
    if (!$token || $x === '' || $y === '' || !$room) {
        throw new Exception("必要なデータが不足しています");
    }

    // ルームのテーブル名を動的に指定（SQLインジェクション防止）
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $room)) {
        throw new Exception("無効なルームIDです");
    }
    $room_table = "room_" . $room;

    // `SHOW TABLES LIKE` はプレースホルダーを使えないため、直接クエリを作成
    $stmt = $pdo->query("SHOW TABLES LIKE '$room_table'");
    if ($stmt->rowCount() === 0) {
        throw new Exception("指定されたルームのテーブルが存在しません: " . $room_table);
    }

    // **プレイヤーの座標を更新**
    $sql = "UPDATE $room_table SET x = :x, y = :y WHERE token = :token";
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':x', $x, PDO::PARAM_INT);
    $stmt->bindParam(':y', $y, PDO::PARAM_INT);
    $stmt->bindParam(':token', $token, PDO::PARAM_STR);
    if (!$stmt->execute()) {
        throw new Exception("データ更新に失敗しました");
    }

    echo json_encode(["success" => true, "message" => "プレイヤー座標を更新しました"], JSON_UNESCAPED_UNICODE);
    exit;

} catch (Exception $e) {
    error_log("❌ PHP エラー: " . $e->getMessage());
    echo json_encode(["success" => false, "error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
}
