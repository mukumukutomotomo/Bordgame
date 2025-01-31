window.onload = function() {
    console.log("📡 `main-game-system-card-earns.js` で取得した roomID:", roomID);
};

const initialCardTiles = [
    { x: 3, y: 4 }, 
    { x: 7, y: 2 },
    { x: 5, y: 8 }
];

const cardPool = [
    { id: "Card_ID_001", name: "冥府の招待状", points: 10 },
    { id: "Card_ID_002", name: "運命の逆転劇", points: 8 },
    { id: "Card_ID_003", name: "影の召喚儀", points: 5 },
    { id: "Card_ID_004", name: "虚空の加護", points: 12 },
    { id: "Card_ID_005", name: "盤面の亡霊", points: 7 },
    { id: "Card_ID_006", name: "魔王の加護", points: 6 },
    { id: "Card_ID_007", name: "王冠泥棒", points: 15 },
    { id: "Card_ID_008", name: "パンドラ", points: 20 }
];
function isOnInitialCardTile(x, y) {
    return initialCardTiles.some(tile => tile.x === x && tile.y === y);
}

function handleCardPickup(playerToken, roomID, x, y) {
    roomID = roomID || window.roomID;
    playerToken = playerToken || window.playerToken;
    console.log("📡 `handleCardPickup` で取得した roomID:", roomID);
    console.log("📡 `handleCardPickup` で取得した playerToken:", playerToken);

    if (!roomID || roomID === "undefined" || !playerToken || playerToken === "undefined") {
        console.error("❌ `roomID` または `playerToken` が undefined です！処理を中断");
        alert("❌ ルーム情報またはプレイヤー情報が取得できませんでした。ゲームを再起動してください。");
        return;
    }

    if (isOnInitialCardTile(x, y)) {
        let randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        console.log(`🎴 プレイヤーが ${randomCard.name} を獲得！（送信前）`);
        console.log(`📡 送信するデータ - roomID: ${roomID}, playerToken: ${playerToken}, cardID: ${randomCard.id}`);

        fetch("/bordgame/game/cardsystem/save_card_legendary.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                playerToken: playerToken,
                roomID: roomID,  
                cardID: randomCard.id
            })
        })
        .then(response => response.text())
        .then(text => {
            console.log("📡 `save_card.php` からの生レスポンス:", text);
            let data;
            try {
                data = JSON.parse(text);
            } catch (error) {
                console.error("❌ JSON パースエラー:", error);
                alert("❌ サーバーからのレスポンスが無効です: " + text);
                return;
            }

            console.log("📡 `save_card.php` の解析後レスポンス:", data);
            if (data.success) {
                alert(`🎴 あなたは「${randomCard.name}」を獲得しました！`);
            } else {
                console.error("❌ エラー:", data.error);
                alert("❌ カード取得に失敗しました: " + (data.error || "原因不明のエラー"));

                // 🎯 すでに取得済みの場合の特別な処理
                if (data.error.includes("このカードはすでに他のプレイヤーが取得しています")) {
                    alert("🚫 このカードは既に取得されているため、獲得できません！");
                }
            }
        })
        .catch(error => {
            console.error("❌ `save_card.php` との通信エラー:", error);
            alert("❌ サーバーとの通信に失敗しました");
        });

        socket.emit("receiveCard", {
            playerToken: playerToken,
            room: roomID,  
            card: randomCard.id,
            cardName: randomCard.name,
            points: randomCard.points
        });
    }
}
socket.on("playerMoved", (data) => {
    console.log(`📡 プレイヤー移動検知: ID=${data.id}, x=${data.x}, y=${data.y}`);
    
    // 🎯 `window.id` を確実に数値型に統一
    window.userID = Number(window.userID);
    data.id = Number(data.id); // これでどちらも確実に `number` 型になる

    console.log("🔍 `data.id` の値:", data.id, " (型: " + typeof data.id + ")");
    console.log("🔍 `window.id` の値:", window.userID, " (型: " + typeof window.id + ")");

    // 🎯 IDが一致する場合のみ処理
    if (data.id === window.userID) {
        console.log("✅ 自分の移動イベントなので処理を実行");
        handleCardPickup(data.token, data.room, data.x, data.y);
    } else {
        console.log("🚫 他プレイヤーの移動イベントなので処理しない");
    }
});
