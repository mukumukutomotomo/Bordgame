<?php
session_start(); // セッション開始

// データベース接続情報
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

            // ユーザーをデータベースに追加（初期位置: x=0, y=0）
            $stmt = $pdo->prepare("INSERT INTO board (username, x, y) VALUES (:username, 0, 0)");
            $stmt->bindParam(':username', $username, PDO::PARAM_STR);
            $stmt->execute();

            // 新しく作成されたユーザーの ID を取得
            $id = $pdo->lastInsertId();

            // セッションにユーザー情報を保存
            $_SESSION["id"] = $id;
            $_SESSION["username"] = $username;

            // デバッグ用ログ
            error_log("ログイン成功: ID = $id, ユーザー名 = $username");

            // ゲームボードへ移動
            header("Location: /bordgame/game/index.html");
            exit();
        } catch (PDOException $e) {
            error_log("データベースエラー: " . $e->getMessage());
            echo "エラーが発生しました: " . $e->getMessage();
        }
    } else {
        echo "ユーザーネームを入力してください。";
    }
} else {
    echo "不正なリクエストです。";
}
?>
