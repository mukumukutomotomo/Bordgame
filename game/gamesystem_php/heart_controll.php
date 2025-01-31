<?php
header("Content-Type: application/json");
include('db.php');

if (!isset($_GET['id']) || !isset($_GET['roomID'])) {
    echo json_encode(["status" => "error", "message" => "Missing parameters"]);
    exit();
}

$userID = $_GET['id'];
$roomID = $_GET['roomID'];

try {
    // ✅ `id` を使って自分のHPを取得
    $stmt = $pdo->prepare("SELECT hp FROM `$roomID` WHERE id = ?");
    $stmt->execute([$userID]);
    $hp = $stmt->fetchColumn();

    if ($hp === false) {
        echo json_encode(["status" => "error", "message" => "Player not found"]);
    } else {
        echo json_encode(["status" => "success", "hp" => $hp, "playerID" => $userID]);
    }
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "SQL error", "error" => $e->getMessage()]);
}
?>
