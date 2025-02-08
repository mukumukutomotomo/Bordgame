<?php
include 'db.php';

// **POST データを取得**
$token = $_POST['token'] ?? null;
$newMapID = $_POST['newMapID'] ?? null;
$room = $_POST['room'] ?? null;

if (!$token || !$newMapID || !$room) {
    echo json_encode(["success" => false, "error" => "必要なデータが不足しています"]);
    exit();
}

// **デバッグ: 送られてきたデータを確認**
error_log("Received data - Room: " . $room . ", Token: " . $token . ", newMapID: " . $newMapID);

// **テーブル名のエスケープ処理（SQLインジェクション対策）**
$roomTable = preg_replace('/[^a-zA-Z0-9_]/', '', $room); // `room_xxx` 形式を強制

// **プレイヤーの `mapID` を更新**
$sql = "UPDATE `$roomTable` SET mapID = :newMapID WHERE token = :token";
$stmt = $pdo->prepare($sql);
$stmt->execute(['newMapID' => $newMapID, 'token' => $token]);

if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => true]);
} else {
    // **デバッグ: SQL のエラー情報を表示**
    $errorInfo = $stmt->errorInfo();
    echo json_encode(["success" => false, "error" => "更新失敗", "sql_error" => $errorInfo]);
}
?>
