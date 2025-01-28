function movePlayer(steps) {
    if (!playerToken) {
        console.error("❌ プレイヤートークンが見つかりません");
        return;
    }

    // 🎯 まず session.php から最新のプレイヤーデータを取得
    fetch("session.php", {
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

        // 🎯 最新の x, y を取得
        let newX = data.currentPlayer.x;
        let newY = data.currentPlayer.y;

        console.log(`📌 最新の座標取得: x=${newX}, y=${newY}`);

        // 🎲 サイコロの出目を加算
        for (let i = 0; i < Math.abs(steps); i++) {
            if (steps > 0) {
                if (newY % 2 === 0) {  // 偶数行なら右へ
                    if (newX < 9) {
                        newX++;
                    } else if (newY < 9) {  // 端に達したら次の行へ
                        newY++;
                    }
                } else {  // 奇数行なら左へ
                    if (newX > 0) {
                        newX--;
                    } else if (newY < 9) {  // 端に達したら次の行へ
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
        socket.emit("movePlayer", { id: data.currentPlayer.id, x: newX, y: newY });

        // 🎯 データベースに移動後の座標を保存
        fetch("update_position.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                token: playerToken,
                x: newX,
                y: newY
            })
        })
        .then(response => response.json())
        .then(saveData => {
            if (!saveData.success) {
                console.error("❌ データベース更新失敗:", saveData.error);
            } else {
                console.log("✅ データベースにプレイヤー座標を保存:", saveData);
                // 🎯 盤面を更新
                drawBoard();
            }
        });
    });
}
