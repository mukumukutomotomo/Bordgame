<?php
header("Content-Type: application/json");
include('db.php');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $roomID = trim($_POST["roomID"]);
    $username = trim($_POST["username"]);

    if (empty($roomID) || empty($username)) {
        echo json_encode(["success" => false, "error" => "ルームIDまたはユーザーネームが入力されていません"]);
        exit;
    }

    try {
        // 🎯 ユーザー名の重複チェック
        $stmt = $pdo->prepare("SELECT id FROM `$roomID` WHERE username = :username");
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->execute();
        $existingUser = $stmt->fetch();

        if ($existingUser) {
            echo json_encode(["success" => false, "error" => "同じユーザーネームが既に存在します"]);
            exit;
        }

        // 🎯 新しいユーザーを登録
        $token = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare("INSERT INTO `$roomID` (username, token, x, y) VALUES (:username, :token, 0, 0)");
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->bindParam(':token', $token, PDO::PARAM_STR);
        $stmt->execute();

        // 🎯 セッションにユーザー情報を保存
        session_start();
        $_SESSION["user_id"] = $pdo->lastInsertId();
        $_SESSION["username"] = $username;
        $_SESSION["token"] = $token;
        $_SESSION["roomID"] = $roomID;

        echo json_encode([
            "success" => true,
            "token" => $token,
            "redirect" => "https://tohru-portfolio.secret.jp/bordgame/game/index.html?room=$roomID&token=$token"
        ]);

    } catch (PDOException $e) {
        echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
    }
}
?>
