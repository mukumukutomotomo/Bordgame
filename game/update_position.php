<?php
session_start();
header("Content-Type: application/json");

// データベース接続をインクルード
include 'db.php'; // 必要な接続情報は db.php に既に存在

// クライアントからのデータ取得
$token = $_POST['token'] ?? null;
$newX = isset($_POST['x']) ? (int)$_POST['x'] : null;
$newY = isset($_POST['y']) ? (int)$_POST['y'] : null;

// 入力チェック
if (!$token || $newX === null || $newY === null) {
    echo json_encode(["success" => false, "error" => "無効なデータ"]);
    exit;
}

// プレイヤーの `x, y` を更新
$stmt = $pdo->prepare("UPDATE players SET x = ?, y = ? WHERE token = ?");
$updated = $stmt->execute([$newX, $newY, $token]);

// 更新結果を返す
if ($updated) {
    echo json_encode(["success" => true, "x" => $newX, "y" => $newY]);
} else {
    echo json_encode(["success" => false, "error" => "座標更新に失敗"]);
}
?>
