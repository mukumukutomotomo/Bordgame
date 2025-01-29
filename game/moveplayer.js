if (!roomID) {
    console.error("❌ ルームIDが見つかりません");
}

function movePlayer(steps) {
    if (!playerToken || !roomID) {
        console.error("❌ プレイヤートークンまたはルームIDが見つかりません");
        return;
    }

    console.log(`📌 movePlayer() 実行: steps=${steps}, roomID=${roomID}`);

    // 🎯 `session.php` から最新のプレイヤーデータを取得
    fetch(`https://tohru-portfolio.secret.jp/bordgame/game/session.php?room=${roomID}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
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

        console.log(`📌 最新の座標取得: x=${newX}, y=${newY}`);

        // 🎲 サイコロの出目を加算
        for (let i = 0; i < Math.abs(steps); i++) {
            if (steps > 0) {
                if (newY % 2 === 0) {  // 偶数行なら右へ
                    if (newX < 9) {
                        newX++;
                    } else if (newY < 9) {  
                        newY++;
                    }
                } else {  // 奇数行なら左へ
                    if (newX > 0) {
                        newX--;
                    } else if (newY < 9) {  
                        newY++;
                    }
                }
            } else {  // 後退する場合
                if (newY % 2 === 0) {
                    if (newX > 0) {
                        newX--;
                    } else if (newY > 0) {
                        newY--;
                    }
                } else {
                    if (newX < 9) {
                        newX++;
                    } else if (newY > 0) {
                        newY--;
                    }
                }
            }
        }

        console.log(`📌 新しい座標: x=${newX}, y=${newY}`);

        // 🎯 WebSocket でサーバーに移動を通知
        socket.emit("movePlayer", {
            id: data.currentPlayer.id,
            x: newX,
            y: newY,
            room: roomID
        });

        // 🎯 データベースに移動後の座標を保存
        fetch(`https://tohru-portfolio.secret.jp/bordgame/game/update_position.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                token: playerToken,
                x: newX,
                y: newY,
                room: roomID
            })
        })
        .then(response => response.json())
        .then(saveData => {
            if (!saveData.success) {
                console.error("❌ データベース更新失敗:", saveData.error);
            } else {
                console.log("✅ データベースにプレイヤー座標を保存:", saveData);
                drawBoard();
            }
        })
        .catch(error => console.error("❌ update_position.php 取得エラー:", error));
    })
    .catch(error => console.error("❌ session.php 取得エラー:", error));
}
