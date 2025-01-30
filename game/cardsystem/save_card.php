<?php
require_once 'db.php';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $playerID = $_POST["playerID"];
    $cardID = $_POST["cardID"];

    if (!$playerID || !$cardID) {
        echo json_encode(["success" => false, "error" => "プレイヤーIDまたはカードIDが不足"]);
        exit;
    }

    try {
        // 🎯 カードを `TRUE` に更新
        $stmt = $pdo->prepare("UPDATE players SET $cardID = TRUE WHERE id = ?");
        $stmt->execute([$playerID]);

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
?>
