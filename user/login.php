<?php
session_start();
header("Content-Type: application/json");
include "db.php"; // データベース接続（PDO）

$username = $_POST["username"] ?? null;
if (!$username) {
    echo json_encode(["success" => false, "error" => "ユーザーネームが空です"]);
    exit;
}

try {
    // 既存ユーザーを検索
    $stmt = $pdo->prepare("SELECT id FROM players WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // ユーザーがいなければ新規登録
        $stmt = $pdo->prepare("INSERT INTO players (username) VALUES (?)");
        $stmt->execute([$username]);
        $userId = $pdo->lastInsertId();
    } else {
        // 既に存在するユーザーなら ID を取得
        $userId = $user["id"];
    }

    // ランダムなトークンを生成
    $token = bin2hex(random_bytes(16));

    // セッションに `currentId` と `token` を保存
    $_SESSION["currentId"] = $userId;
    $_SESSION["token"] = $token;

    // JSON レスポンスを返す
    echo json_encode([
        "success" => true,
        "id" => $userId,
        "username" => $username,
        "token" => $token
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
}
?>
