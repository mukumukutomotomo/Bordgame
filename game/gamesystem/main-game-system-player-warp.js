document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 ワープシステム起動");

    // 各マップのワープゾーン設定 (座標ごとに移動可能なマップを設定)
    const warpZones = {
        "map-01": [{ x: 5, y: 2, destinations: ["map-02", "map-03"] }],
        "map-02": [{ x: 10, y: 1, destinations: ["map-01", "map-04"] }],
        "map-03": [{ x: 3, y: 6, destinations: ["map-05"] }],
        "map-04": [{ x: 7, y: 3, destinations: ["map-06", "map-07"] }],
        "map-05": [{ x: 2, y: 9, destinations: ["map-01"] }],
        "map-06": [{ x: 8, y: 4, destinations: ["map-02"] }],
        "map-07": [{ x: 6, y: 6, destinations: ["map-08", "map-09"] }],
        "map-08": [{ x: 1, y: 1, destinations: ["map-07"] }],
        "map-09": [{ x: 4, y: 5, destinations: ["map-03"] }]
    };

    // **ワープ可能な座標に到達したかチェック**
    function checkPlayerWarp(player) {
        const mapID = viewingMapID;
        if (!warpZones[mapID]) return;

        warpZones[mapID].forEach(zone => {
            if (player.x === zone.x && player.y === zone.y) {
                console.log(`🌟 ワープゾーン到達: (${zone.x}, ${zone.y})`);
                showWarpOptions(zone.destinations);
            }
        });
    }

    // **ワープ先選択UIを表示**
    function showWarpOptions(destinations) {
        let warpMenu = document.createElement("div");
        warpMenu.id = "warpMenu";
        warpMenu.style.position = "absolute";
        warpMenu.style.top = "50%";
        warpMenu.style.left = "50%";
        warpMenu.style.transform = "translate(-50%, -50%)";
        warpMenu.style.padding = "10px";
        warpMenu.style.background = "rgba(0,0,0,0.8)";
        warpMenu.style.border = "1px solid white";
        warpMenu.style.zIndex = "100";
        warpMenu.style.color = "white";
        warpMenu.innerHTML = "<p>ワープ先を選んでください:</p>";

        destinations.forEach(dest => {
            let button = document.createElement("button");
            button.innerText = dest;
            button.style.margin = "5px";
            button.onclick = function () {
                warpMenu.remove();
                warpToMap(dest);
            };
            warpMenu.appendChild(button);
        });

        let cancelButton = document.createElement("button");
        cancelButton.innerText = "キャンセル";
        cancelButton.style.margin = "5px";
        cancelButton.onclick = function () {
            warpMenu.remove();
        };
        warpMenu.appendChild(cancelButton);

        document.body.appendChild(warpMenu);
    }

    // **ワープ処理**
    function warpToMap(targetMap) {
        // **データベースを更新**
        fetch("https://tohru-portfolio.secret.jp/bordgame/game/gamesystem_php/update_player_map.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                token: playerToken,
                newMapID: targetMap,
                room: roomID
            }).toString()
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("warp_playerから❌ データベース更新失敗:", data.error);
                return;
            }

            // **WebSocketで他プレイヤーに通知**
            socket.emit("playerWarped", {
                room: roomID,
                playerID: userID,
                newMapID: targetMap,
                token: playerToken
            });

            // **プレイヤーのマップを変更**
            changeMap(targetMap);
        })
        .catch(error => console.error("❌ update_map.php エラー:", error));
    }

    // **他プレイヤーのワープを適用**
    socket.on("playerWarped", function (data) {
        console.log(`🔄 他プレイヤー (${data.playerID}) がワープ: ${data.newMapID}`);

        // **自分がワープした場合のみ盤面を変更**
        if (data.playerID === userID) {
            console.log("✅ 自分のワープなので盤面を変更");
            changeMap(data.newMapID);
        } else {
            console.log("🚫 他プレイヤーのワープなので盤面は変更しない");
        }
    });


    // **プレイヤー移動を監視**
    socket.on("playerMoved", (data) => {
        console.log(`📡 プレイヤー移動検知: ID=${data.id}, x=${data.x}, y=${data.y}`);

        // 🎯 `window.userID` を確実に数値型に統一
        window.userID = Number(window.userID);
        data.id = Number(data.id);

        console.log("🔍 `data.id` の値:", data.id, " (型: " + typeof data.id + ")");
        console.log("🔍 `window.userID` の値:", window.userID, " (型: " + typeof window.userID + ")");

        // 🎯 自分の移動だけチェック
        if (data.id === window.userID) {
            console.log("✅ 自分の移動イベントなので処理を実行");
            checkPlayerWarp(data);
        } else {
            console.log("🚫 他プレイヤーの移動イベントなので処理しない");
        }
    });
});
