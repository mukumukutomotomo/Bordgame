<?php
session_start();
header('Content-Type: application/json');

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

    echo json_encode(["players" => $players]);
} catch (PDOException $e) {
    echo json_encode(["error" => "データベース接続エラー: " . $e->getMessage()]);
}
?>
