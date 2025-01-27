<?php
header("Content-Type: application/json");
include('db.php');

session_start();

// 🎯 サーバー管理者用の特別なトークンを設定
$serverAdminToken = "SERVER_ADMIN_TOKEN";

// クライアントから `token` を受け取る
$token = isset($_POST["token"]) ? $_POST["token"] : '';

if (empty($token) || $token === $serverAdminToken) {
    try {
        // 🎯 サーバーからのリクエスト（`startGame`）では全プレイヤーを取得
        $stmt = $pdo->query("SELECT id, username, token, x, y FROM board");
        $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "players" => $players
        ], JSON_PRETTY_PRINT);
        exit;
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
        exit;
    }
}

try {
    // 🎯 通常のプレイヤーリクエスト（`token` に対応するプレイヤーを取得）
    $stmt = $pdo->prepare("SELECT id, username, token, x, y FROM board WHERE token = :token");
    $stmt->bindParam(":token", $token, PDO::PARAM_STR);
    $stmt->execute();
    $currentPlayer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentPlayer) {
        echo json_encode(["success" => false, "error" => "認証エラー: トークンが一致するプレイヤーが見つかりません"]);
        exit;
    }

    $stmt = $pdo->query("SELECT id, username, token, x, y FROM board");
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "players" => $players,
        "currentPlayer" => $currentPlayer
    ], JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
}
?>
