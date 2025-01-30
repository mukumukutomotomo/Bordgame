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

// 🎯 プレイヤーが特定のマスに着いたらランダムにカードを獲得
function handleCardPickup(playerToken, roomID, x, y) {
    console.log("📡 取得した roomID:", roomID);  // 🔥 roomID をログに出力
    if (!roomID || roomID === "undefined") {
        console.error("❌ `roomID` が undefined です！処理を中断");
        alert("❌ ルーム情報が取得できませんでした。ゲームを再起動してください。");
        return;
    }

    if (isOnInitialCardTile(x, y)) {
        let randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        console.log(`🎴 プレイヤーが ${randomCard.name} を獲得！（送信前）`);

        fetch("/bordgame/game/cardsystem/save_card.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                playerToken: playerToken,
                roomID: roomID,  // 🔥 `roomID` を送信
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



// 🎯 プレイヤー移動を監視し、カード取得処理を実行
socket.on("playerMoved", (data) => {
    console.log(`📡 プレイヤー移動検知: ID=${data.id}, x=${data.x}, y=${data.y}`);

    handleCardPickup(data.token, data.room, data.x, data.y);
});
