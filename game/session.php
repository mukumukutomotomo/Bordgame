<?php
session_start();
header('Content-Type: application/json');

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

    // プレイヤーごとに `token` を発行（ログイン時に 1 回だけ）
    if (!isset($_SESSION["token"])) {
        $_SESSION["token"] = bin2hex(random_bytes(16)); // 16バイトのランダムトークン
    }

    echo json_encode([
        "players" => $players,
        "token" => $_SESSION["token"] // 🎯 各プレイヤーごとにトークンを割り当てる
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(["error" => "データベース接続エラー: " . $e->getMessage()]);
}
?>
