<?php
session_start();
header('Content-Type: application/json');

// デバッグ用ログ出力
error_log("セッションデータ: " . json_encode($_SESSION));

// データベース接続
$host = 'mysql312.phy.lolipop.lan';
$dbname = 'LAA1538186-login';
$user = 'LAA1538186';
$password = 'altair';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // すべてのプレイヤーの情報を取得
    $stmt = $pdo->query("SELECT id, username, x, y FROM board");
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 現在のセッションのユーザーID
    $currentId = isset($_SESSION["id"]) ? $_SESSION["id"] : null;

    // デバッグ用ログ
    error_log("現在のセッション ID: " . ($currentId ?: "未設定"));

    echo json_encode([
        "players" => $players,
        "currentId" => $currentId
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["error" => "データベース接続エラー: " . $e->getMessage()]);
}
?>
