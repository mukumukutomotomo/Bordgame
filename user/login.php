<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json");

include "db.php"; // データベース接続

$username = $_POST["username"] ?? null;
if (!$username) {
    echo json_encode(["success" => false, "error" => "ユーザーネームが空です"]);
    exit;
}

try {
    // 既存ユーザーがいるかチェック
    $stmt = $pdo->prepare("SELECT id FROM players WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // 新規ユーザーを作成
        $stmt = $pdo->prepare("INSERT INTO players (username) VALUES (?)");
        $stmt->execute([$username]);
        $userId = $pdo->lastInsertId();
    } else {
        $userId = $user["id"];
    }

    // トークンを生成
    $token = bin2hex(random_bytes(16));

    // セッションに保存
    $_SESSION["currentId"] = $userId;
    $_SESSION["token"] = $token;

    // JSON レスポンスを返す
    echo json_encode([
        "success" => true,
        "id" => $userId,
        "username" => $username,
        "token" => $token
    ]);
    exit;
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
    exit;
}
?>
