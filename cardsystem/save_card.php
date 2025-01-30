
<?php
require_once 'db.php'; // データベース接続

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $playerID = $_POST["playerID"];
    $card = $_POST["card"];
    $points = intval($_POST["points"]);

    if (!$playerID || !$card || $points === null) {
        echo json_encode(["success" => false, "error" => "必要なデータが不足"]);
        exit;
    }

    // プレイヤーのカードデータをデータベースに保存
    $stmt = $pdo->prepare("INSERT INTO player_cards (player_id, card_name, points) VALUES (?, ?, ?)");
    if ($stmt->execute([$playerID, $card, $points])) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "データベース保存エラー"]);
    }
}
?>
