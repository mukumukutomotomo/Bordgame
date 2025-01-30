const specialTiles = [
    { x: 3, y: 4 }, 
    { x: 7, y: 2 },
    { x: 5, y: 8 }
];

const cardPool = [
    { name: "攻撃カード 🗡️", points: 10 },
    { name: "防御カード 🛡️", points: 8 },
    { name: "回復カード ❤️", points: 5 },
    { name: "瞬間移動カード ✨", points: 12 },
    { name: "サイコロ追加 🎲+1", points: 7 },
    { name: "罠カード ⚠️", points: 6 }
];

// 🎯 プレイヤーがカード取得マスに止まった時の処理
function checkForCard(x, y, playerID) {
    let isSpecialTile = specialTiles.some(tile => tile.x === x && tile.y === y);
    if (isSpecialTile) {
        let randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        console.log(`🎴 カード獲得: ${randomCard.name} (ポイント: ${randomCard.points})`);

        // サーバーにカード取得を通知＆データベースに保存
        socket.emit("receiveCard", {
            playerID: playerID,
            room: roomID,
            card: randomCard.name,
            points: randomCard.points
        });

        // UI通知
        alert(`🎴 あなたは「${randomCard.name}」を獲得しました！`);
    }
}

// 🎯 サーバーからカード取得通知を受け取る
socket.on("cardReceived", (data) => {
    console.log(`📡 他プレイヤーがカード取得: ${data.playerID} が ${data.card} を取得 (ポイント: ${data.points})`);

    if (data.playerID !== currentPlayer.id) {
        alert(`📢 他のプレイヤー (${data.playerID}) が「${data.card}」を獲得しました！`);
    }
});
