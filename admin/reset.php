<?php
// データベース接続情報
$servername = 'mysql312.phy.lolipop.lan';  // データベースのホスト名
$username = 'LAA1538186'; // データベースのユーザー名
$password = 'altair';
$dbname = 'LAA1538186-login';

// MySQLに接続
$conn = new mysqli($servername, $username, $password, $dbname);

// 接続チェック
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// SQLコマンド実行（データを全削除 & IDリセット）
$sql = "TRUNCATE TABLE board";

if ($conn->query($sql) === TRUE) {
    echo "success";
} else {
    echo "error: " . $conn->error;
}

// 接続を閉じる
$conn->close();
?>
