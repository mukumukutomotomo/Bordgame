<?php
header("Content-Type: application/json"); // JSONのヘッダーを明示的に指定
include('db.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST["username"]);

    if (empty($username)) {
        echo json_encode(["success" => false, "error" => "ユーザーネームを入力してください"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("SELECT id FROM board WHERE username = :username");
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->execute();
        $existingUser = $stmt->fetch();

        if ($existingUser) {
            echo json_encode(["success" => false, "error" => "同じユーザーネームが既に存在します"]);
            exit;
        }

        $token = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare("INSERT INTO board (username, token, x, y) VALUES (:username, :token, 0, 0)");
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->bindParam(':token', $token, PDO::PARAM_STR);
        $stmt->execute();

        $userId = $pdo->lastInsertId();
        session_start();
        $_SESSION["user_id"] = $userId;
        $_SESSION["username"] = $username;
        $_SESSION["token"] = $token;

        echo json_encode([
            "success" => true,
            "token" => $token,  // ✅ `token` を返す
            "redirect" => "https://tohru-portfolio.secret.jp/bordgame/game/index.html"
        ]);        
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
    }
}
?>
