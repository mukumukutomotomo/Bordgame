<?php
header("Content-Type: application/json");
include('db.php');

session_start();

// クライアントから `token` を受け取る
$token = isset($_POST["token"]) ? $_POST["token"] : '';

try {
    // すべてのプレイヤー情報を取得
    $stmt = $pdo->query("SELECT id, username, token, x, y FROM board");
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 🎯 `token` に一致するプレイヤーを見つける
    $currentPlayer = null;
    foreach ($players as $player) {
        if ($player["token"] == $token) {
            $currentPlayer = $player;
            break;
        }
    }

    if (!$currentPlayer) {
        echo json_encode(["success" => false, "error" => "認証エラー: プレイヤーが見つかりません"]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "players" => $players,  // 全プレイヤーの情報
        "currentPlayer" => $currentPlayer  // 自分の情報
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
}
?>
