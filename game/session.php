<?php
header("Content-Type: application/json");
include('db.php');

session_start();

// クライアントから `token` を受け取る
$token = isset($_POST["token"]) ? $_POST["token"] : '';

if (empty($token)) {
    echo json_encode(["success" => false, "error" => "トークンが送信されていません"]);
    exit;
}

try {
    // `token` に一致するプレイヤーを取得
    $stmt = $pdo->prepare("SELECT id, username, token, x, y FROM board WHERE token = :token");
    $stmt->bindParam(":token", $token, PDO::PARAM_STR);
    $stmt->execute();
    $currentPlayer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentPlayer) {
        echo json_encode(["success" => false, "error" => "認証エラー: トークンが一致するプレイヤーが見つかりません"]);
        exit;
    }

    // 全プレイヤー情報を取得
    $stmt = $pdo->query("SELECT id, username, token, x, y FROM board");
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "players" => $players,
        "currentPlayer" => $currentPlayer
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
}
?>
