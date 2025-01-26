<?php
// データベース接続情報
$host = 'mysql312.phy.lolipop.lan';
$dbname = 'LAA1538186-login';
$user = 'LAA1538186';
$password = 'altair';

try {
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // エラーモードを例外に設定
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // デフォルトのフェッチモード
        PDO::ATTR_EMULATE_PREPARES => false // プリペアドステートメントのエミュレーションを無効化
    ]);
} catch (PDOException $e) {
    die(json_encode(["success" => false, "error" => "データベース接続エラー: " . $e->getMessage()]));
}
?>
