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

    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data["id"], $data["x"], $data["y"])) {
        throw new Exception("無効なデータ");
    }

    // プレイヤーの位置を更新
    $stmt = $pdo->prepare("UPDATE board SET x = :x, y = :y WHERE id = :id");
    $stmt->execute([
        ":x" => $data["x"],
        ":y" => $data["y"],
        ":id" => $data["id"]
    ]);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
