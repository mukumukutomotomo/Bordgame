<?php
session_start();

// データベース接続情報（ロリポップ）
$host = 'mysql312.phy.lolipop.lan';
$dbname = 'LAA1538186-login';
$user = 'LAA1538186';
$password = 'altair';

// フォームから送信されたデータを取得
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['username'])) {
    $username = trim($_POST['username']);

    if (!empty($username)) {
        try {
            // データベース接続
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // 新しいプレイヤーを登録（初期位置: x=0, y=0）
            $stmt = $pdo->prepare("INSERT INTO board (username, x, y) VALUES (:username, 0, 0)");
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->execute();

            // ユーザーIDを取得
            $userId = $pdo->lastInsertId();

            // セッションにユーザー情報を保存
            $_SESSION["user_id"] = $userId;
            $_SESSION["username"] = $username;

            // ゲームボードへ移動
            header("Location: /bordgame/game/index.html");
            exit();
        } catch (PDOException $e) {
            echo "エラーが発生しました: " . $e->getMessage();
        }
    } else {
        echo "ユーザーネームを入力してください。";
    }
} else {
    echo "不正なリクエストです。";
}
?>
