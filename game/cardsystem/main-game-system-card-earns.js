const specialTiles = [
    { x: 3, y: 4 }, 
    { x: 7, y: 2 },
    { x: 5, y: 8 }
];

const cardPool = [
    { id: "Card_ID_001", name: "攻撃カード 🗡️", points: 10 },
    { id: "Card_ID_002", name: "防御カード 🛡️", points: 8 },
    { id: "Card_ID_003", name: "回復カード ❤️", points: 5 },
    { id: "Card_ID_004", name: "瞬間移動カード ✨", points: 12 },
    { id: "Card_ID_005", name: "サイコロ追加 🎲+1", points: 7 },
    { id: "Card_ID_006", name: "罠カード ⚠️", points: 6 },
    { id: "Card_ID_007", name: "特殊カード 🔥", points: 15 },
    { id: "Card_ID_008", name: "レジェンドカード 🏆", points: 20 }
];

// 🎯 プレイヤーがカード取得マスに止まった時の処理
function checkForCard(x, y, playerID) {
    let isSpecialTile = specialTiles.some(tile => tile.x === x && tile.y === y);
    if (isSpecialTile) {
        let randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        console.log(`🎴 カード獲得: ${randomCard.name} (ポイント: ${randomCard.points})`);

        // 🎯 サーバーにカード取得を通知 & データベースに保存
        fetch("save_card.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                playerID: playerID,
                cardID: randomCard.id
            })
        }).then(() => {
            alert(`🎴 あなたは「${randomCard.name}」を獲得しました！`);
        });

        // 🎯 WebSocket 経由で他プレイヤーに通知
        socket.emit("receiveCard", {
            playerID: playerID,
            room: roomID,
            card: randomCard.id,
            cardName: randomCard.name,
            points: randomCard.points
        });
    }
}

// 🎯 サーバーからカード取得通知を受け取る
socket.on("cardReceived", (data) => {
    console.log(`📡 他プレイヤーがカード取得: ${data.playerID} が ${data.cardName} を取得 (ポイント: ${data.points})`);

    if (data.playerID !== currentPlayer.id) {
        alert(`📢 他のプレイヤー (${data.playerID}) が「${data.cardName}」を獲得しました！`);
    }
});
