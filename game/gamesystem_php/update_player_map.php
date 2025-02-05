<?php
include 'db.php';

$token = $_POST['token'];
$newMapID = $_POST['newMapID'];
$room = $_POST['room'];

// **プレイヤーの `mapID` を更新**
$stmt = $pdo->prepare("UPDATE players SET mapID = :newMapID WHERE token = :token");
$stmt->execute(['newMapID' => $newMapID, 'token' => $token]);

if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => "更新失敗"]);
}
?>
