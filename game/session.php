<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
error_reporting(0);
ini_set('display_errors', 0);

include('db.php');
session_start();

// 🎯 サーバー管理者用の特別なトークンを設定
$serverAdminToken = "SERVER_ADMIN_TOKEN";

// クライアントから `token` と `roomID` を受け取る
$token = isset($_POST["token"]) ? $_POST["token"] : '';
$roomID = isset($_GET["room"]) ? $_GET["room"] : '';

// 🎯 ルームIDが指定されているかチェック
if (empty($roomID)) {
    echo json_encode(["success" => false, "error" => "ルームIDが指定されていません"]);
    exit;
}

// 🎯 ルームIDの形式を検証（例: room_xxxxxx）
if (!preg_match('/^room_[a-f0-9]{8}$/', $roomID)) {
    echo json_encode(["success" => false, "error" => "不正なルームIDです"]);
    exit;
}

// 🎯 ルームが存在するかチェック
$stmt = $pdo->query("SHOW TABLES LIKE '$roomID'");
if ($stmt->rowCount() === 0) {
    echo json_encode(["success" => false, "error" => "指定されたルームは存在しません"]);
    exit;
}

try {
    if (empty($token) || $token === $serverAdminToken) {
        // 🎯 サーバーからのリクエスト（`startGame`）：全プレイヤーを取得
        $stmt = $pdo->query("SELECT id, username, token, x, y, mapID FROM `$roomID`"); // ✅ mapID を追加
        $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "players" => $players
        ], JSON_PRETTY_PRINT);
        exit;
    }

    // 🎯 通常のプレイヤーリクエスト（`token` に対応するプレイヤーを取得）
    $stmt = $pdo->prepare("SELECT id, username, token, x, y, mapID FROM `$roomID` WHERE token = :token"); // ✅ mapID を追加
    $stmt->bindParam(":token", $token, PDO::PARAM_STR);
    $stmt->execute();
    $currentPlayer = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentPlayer) {
        echo json_encode(["success" => false, "error" => "認証エラー: トークンが一致するプレイヤーが見つかりません"]);
        // `token` の状態をログに出力
        if (!isset($_POST['token'])) {
            error_log("❌ token が送信されていない（未定義）");
        } elseif (empty($_POST['token'])) { // `false`, `""`, `0`, `null` も含める
            error_log("⚠️ token が空または無効（false / 空文字 / 0 / null）: " . var_export($_POST['token'], true));
        } else {
            error_log("📌 受け取った token: " . $_POST['token']);
        }
    
        exit;
    }
    

    // 🎯 ルーム内の全プレイヤーを取得
    $stmt = $pdo->query("SELECT id, username, token, x, y, mapID FROM `$roomID`"); // ✅ mapID を追加
    $players = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "players" => $players,
        "currentPlayer" => $currentPlayer
    ], JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => "データベースエラー: " . $e->getMessage()]);
}
?>
