if (!roomID) {
    console.error("❌ ルームIDが見つかりません");
}

function movePlayer(steps) {
    if (!playerToken || !roomID) {
        console.error("❌ プレイヤートークンまたはルームIDが見つかりません");
        return;
    }

    console.log(`📌 movePlayer() 実行: steps=${steps}, roomID=${roomID}`);

    fetch(`https://tohru-portfolio.secret.jp/bordgame/game/session.php?room=${roomID}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: playerToken })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error("❌ session.php から最新データの取得に失敗:", data.error);
            return;
        }

        let newX = data.currentPlayer.x;
        let newY = data.currentPlayer.y;
        let newMapID = data.currentPlayer.mapID || viewingMapID; // ✅ mapID も考慮
        let playerID = data.currentPlayer.username || playerToken;

        console.log(`📌 最新の座標取得: x=${newX}, y=${newY}, mapID=${newMapID}, playerID=${playerID}`);

        for (let i = 0; i < Math.abs(steps); i++) {
            if (steps > 0) {
                if (newY % 2 === 0) {
                    if (newX < 9) newX++;
                    else if (newY < 9) newY++;
                } else {
                    if (newX > 0) newX--;
                    else if (newY < 9) newY++;
                }
            } else {
                if (newY % 2 === 0) {
                    if (newX > 0) newX--;
                    else if (newY > 0) newY--;
                } else {
                    if (newX < 9) newX++;
                    else if (newY > 0) newY--;
                }
            }
        }

        console.log(`📌 新しい座標: x=${newX}, y=${newY}, mapID=${newMapID}`);

        const sendData = new URLSearchParams({
            token: playerToken,
            x: newX,
            y: newY,
            mapID: newMapID, // ✅ mapID も送信
            room: roomID.replace("room_", "")
        });

        fetch(`https://tohru-portfolio.secret.jp/bordgame/game/update_position.php?${sendData.toString()}`, {
            method: "GET"
        })
        .then(response => response.json())
        .then(saveData => {
            console.log("📡 update_position.php のレスポンス:", saveData);
            if (!saveData.success) {
                console.error("❌ データベース更新失敗:", saveData.error);
            } else {
                console.log("✅ データベースにプレイヤー座標を保存:", saveData);

                // 🎯 WebSocket でサーバーにプレイヤーの移動を通知
                console.log("📡 movePlayer 送信データ:", {
                    id: currentPlayer.id,  
                    token: playerToken,
                    x: newX,
                    y: newY,
                    mapID: newMapID,
                    room: roomID
                });
                socket.emit("movePlayer", {
                    id: currentPlayer.id,
                    token: playerToken,
                    x: newX,
                    y: newY,
                    mapID: newMapID, // ✅ mapID をサーバーに送信
                    room: roomID
                });

                updatePlayerData(drawBoard);
            }
        })
        .catch(error => console.error("❌ update_position.php 取得エラー:", error));
    })
    .catch(error => console.error("❌ session.php 取得エラー:", error));
}


// 🎯 WebSocket で `playerMoved` を受け取ったら `session.php` を取得
socket.on("playerMoved", (data) => {
    console.log("🔍 `players` のデータ型:", typeof players);
    console.log("🔍 `players` の内容:", JSON.stringify(players, null, 2));
    console.log("📡 WebSocket 受信: playerMoved", data);
    console.log("👀 `players` の変更前:", JSON.stringify(players, null, 2));
    // IDが正しくあるかチェック
    if (!data.id) {
        console.error("❌ playerMoved のデータに ID がありません:", data);
        return;
    }

    // **ログでデータの変化を詳細に確認**
    console.log(`🔍 players[${data.id}] 変更前:`, JSON.stringify(players[data.id], null, 2));

    const playersArray = Object.values(players);
    const playerData = playersArray.find(p => p.id === data.id);
    if (!playerData) {
        console.error(`❌ players の中に ID ${data.id} のデータが見つかりません！`, players);
    } else {
        playerData.x = data.x;
        playerData.y = data.y;
        playerData.mapID = data.mapID;
    }
    

    console.log("✅ 更新後の players:", JSON.stringify(players, null, 2));
    drawBoard();
});
