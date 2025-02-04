let currentMapID = "map-01"; // 実際に自分がいるマップ
let viewingMapID = "map-01"; // 表示しているマップ（変更可能）

// マップの背景変更関数
function changeMap(mapID) {
    console.log("🗺️ マップ切り替え:", mapID);

    // 現在のアクティブなマップとボードを取得
    const currentMap = document.querySelector(".map.active");
    const newMap = document.getElementById(mapID);
    const board = document.getElementById("board"); // ボードの取得

    if (!newMap) {
        console.warn("⚠️ 指定されたマップIDが存在しません:", mapID);
        return;
    }

    if (currentMap === newMap) {
        console.log("🔄 すでに選択されているマップです:", mapID);
        return;
    }

    // 🎯 ボードのマップを変更 (WebSocket 経由でサーバーに通知)
    viewingMapID = mapID;
    console.log(`📌 ボード切り替え: ${mapID} (現在地: ${currentMapID})`);

    socket.emit("viewMap", {
        room: roomID,
        playerID: userID,
        mapID: mapID,
        token: playerToken,
    });

    console.log(`🛠️ マップ切り替え発動: ${mapID}`);

    // ① マップとボードを同時にフェードアウト (0.5秒かけて透明に)
    let opacity = 1;
    let fadeOut = setInterval(() => {
        opacity -= 0.05;
        currentMap.style.opacity = opacity;
        board.style.opacity = opacity; // ボードもフェードアウト

        if (opacity <= 0) {
            clearInterval(fadeOut);
            currentMap.classList.remove("active");
            currentMap.style.display = "none";
            board.style.display = "none"; // ボードも非表示

            // ② 次のマップとボードを準備
            newMap.style.display = "block";
            newMap.style.opacity = 0; // 最初は透明
            board.style.display = "block"; // ボードも表示
            board.style.opacity = 0; // 透明で開始

            // ③ フェードイン (0.5秒かけて徐々に表示)
            let fadeIn = setInterval(() => {
                opacity += 0.05;
                newMap.style.opacity = opacity;
                board.style.opacity = opacity; // ボードもフェードイン

                if (opacity >= 1) {
                    clearInterval(fadeIn);
                    newMap.classList.add("active");
                    console.log("✅ マップ & ボード変更完了:", mapID);
                }
            }, 50);
        }
    }, 50);
}


// 🎯 サーバーから指定マップのプレイヤーデータを受信
socket.on("updateViewMap", (data) => {
    console.log(`📡 WebSocket 受信: マップ ${data.mapID} のプレイヤー情報を更新`);

    players = {}; // 初期化
    data.players.forEach(player => {
        players[player.id] = {
            id: player.id,
            username: player.username,
            x: player.x,   // ✅ 追加
            y: player.y,   // ✅ 追加
            mapID: player.mapID
        };
    });

    // 🎯 `currentMapID` を更新（実際にいるマップを正しく保持）
    if (players[userID]) {
        currentMapID = players[userID].mapID;
    }

    console.log(`📌 マップ ${data.mapID} 内のプレイヤー:`);
    Object.values(players).forEach(player => {
        console.log(`   🧑‍💻 ${player.username} (ID: ${player.id}) → x: ${player.x}, y: ${player.y}, mapID: ${player.mapID}`);
    });

    drawBoard(); // ✅ 変更後のプレイヤー情報で再描画
});




document.addEventListener("DOMContentLoaded", function () {
    const mapContainer = document.getElementById("map-container");
    const board = document.getElementById("board");

    if (!mapContainer || !board) {
        console.error("❌ mapContainer または board が見つかりません");
        return;
    }

    let scale = 1; // 初期ズーム
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;
    let zoomFactor = 0.05; // ズームの感度

    // **ズーム処理（マップ＆ボードを拡大縮小）**
    window.addEventListener("wheel", (e) => {
        e.preventDefault();

        let newScale = scale;
        if (e.deltaY < 0) {
            newScale = Math.min(scale + zoomFactor, 3); // 最大3倍まで
        } else {
            newScale = Math.max(scale - zoomFactor, 1); // 最小1倍まで
        }

        // ズームの中心補正
        const rect = mapContainer.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const offsetX = (centerX - rect.left - rect.width / 2) * (newScale / scale - 1);
        const offsetY = (centerY - rect.top - rect.height / 2) * (newScale / scale - 1);

        translateX -= offsetX;
        translateY -= offsetY;
        scale = newScale;

        updateTransform();
    }, { passive: false });

    // **ドラッグでマップ＆ボードを移動**
    mapContainer.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
    });

    // **ウィンドウリサイズ時にマップとボードを調整**
    window.addEventListener("resize", updateTransform);

    // **マップとボードを画面内に収める**
    function updateTransform() {
        const mapWidth = mapContainer.offsetWidth * scale;
        const mapHeight = mapContainer.offsetHeight * scale;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        if (mapWidth <= screenWidth) {
            translateX = 0;
        } else {
            const maxTranslateX = (mapWidth - screenWidth) / 2;
            translateX = Math.min(Math.max(translateX, -maxTranslateX), maxTranslateX);
        }

        if (mapHeight <= screenHeight) {
            translateY = 0;
        } else {
            const maxTranslateY = (mapHeight - screenHeight) / 2;
            translateY = Math.min(Math.max(translateY, -maxTranslateY), maxTranslateY);
        }

        // **マップの位置を適用**
        mapContainer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
});


