<?php
// ロリポップのデータベース接続情報
$host = 'mysql312.phy.lolipop.lan'; // ロリポップのホスト名
$dbname = 'LAA1538186-login';       // データベース名
$user = 'LAA1538186';              // ユーザー名
$password = 'altair';              // パスワード

// フォームから送信されたデータを取得
$username = $_POST['username'];

try {
    // データベース接続
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // SQL文の準備と実行
    $stmt = $pdo->prepare("INSERT INTO board (username) VALUES (:username)");
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);
    $stmt->execute();

    // 登録完了メッセージと割り当てられたIDを表示
    echo "登録が完了しました。あなたのユーザーIDは: " . $pdo->lastInsertId();
} catch (PDOException $e) {
    echo "エラーが発生しました: " . $e->getMessage();
}
?>
