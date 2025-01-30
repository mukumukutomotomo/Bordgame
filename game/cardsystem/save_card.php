<?php
require_once '../db.php';

header("Content-Type: application/json");
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', '../logs/php_error.log'); // エラーログを確実に記録

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $playerToken = $_POST["playerToken"] ?? null;
    $roomID = $_POST["roomID"] ?? null;
    $cardID = $_POST["cardID"] ?? null;

    // 🎯 デバッグ用レスポンスを追加
    error_log("📡 [save_card.php] 受信データ: Token={$playerToken}, Room={$roomID}, Card={$cardID}");

    if (!$playerToken || !$roomID || !$cardID) {
        error_log("❌ [save_card.php] 必須データが不足");
        echo json_encode(["success" => false, "error" => "プレイヤーToken、ルームIDまたはカードIDが不足"]);
        exit;
    }

    try {
        $roomTable = "room_" . $roomID;
        error_log("📡 [save_card.php] 対象テーブル: {$roomTable}");

        // 🎯 クエリの実行結果を取得
        $stmt = $pdo->prepare("UPDATE `$roomTable` SET `$cardID` = TRUE WHERE token = ?");
        $result = $stmt->execute([$playerToken]);

        if ($result) {
            error_log("✅ [save_card.php] カード {$cardID} をプレイヤー（Token: {$playerToken}）に付与成功");
            echo json_encode(["success" => true]);
        } else {
            error_log("❌ [save_card.php] クエリ実行失敗");
            echo json_encode(["success" => false, "error" => "データベースの更新に失敗しました"]);
        }
    } catch (Exception $e) {
        error_log("❌ [save_card.php] 例外発生: " . $e->getMessage());
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
?>
