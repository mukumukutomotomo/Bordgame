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
        let playerID = data.currentPlayer.id || playerToken;  // ← ここで `id` がなければ `token` を使う

        console.log(`📌 最新の座標取得: x=${newX}, y=${newY}, playerID=${playerID}`);

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

        console.log(`📌 新しい座標: x=${newX}, y=${newY}`);

        const sendData = new URLSearchParams({
            token: playerToken,
            x: newX,
            y: newY,
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
                console.log(`📡 WebSocket 送信: movePlayer -> id=${playerID}, x=${newX}, y=${newY}, room=${roomID}`);
                socket.emit("movePlayer", {
                    id: playerID,
                    x: newX,
                    y: newY,
                    room: roomID
                });

                // 🎯 `session.php` から最新のプレイヤーデータを取得してから `drawBoard()`
                updatePlayerData(drawBoard);
            }
        })
        .catch(error => console.error("❌ update_position.php 取得エラー:", error));
    })
    .catch(error => console.error("❌ session.php 取得エラー:", error));
}
