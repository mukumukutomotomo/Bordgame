const socket = io("https://bordgame.onrender.com");
function getParamFromURL(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}
const roomID = getParamFromURL("room");  // `roomID` を取得
const token = getParamFromURL("token");  // `token` を取得
const userID = getParamFromURL("user_id");  // `token` を取得
window.roomID = roomID; 
window.playerToken = token;
window.userID = userID;

if (token) {
    console.log("✅ URL から取得した token:", token);
    sessionStorage.setItem("playerToken", token);
} else {
    console.error("❌ トークンが見つかりません");
}
if (roomID) {
    console.log("✅ ルームID取得:", roomID);
} else {
    console.error("❌ ルームIDが見つかりません");
}
socket.on("connect", () => {
    console.log("✅ WebSocket 接続成功");
    if (roomID) {
        console.log(`🔗 WebSocket 経由でルーム ${roomID} に参加`);
        socket.emit("joinRoom", roomID);
    }
});


// 🎯 プレイヤー情報
let players = {};
let playerSizes = {}; 
let currentPlayer = null; 

const board = document.getElementById("board");
const playerToken = sessionStorage.getItem("playerToken");

console.log("📌 送信する token:", playerToken);

// 🎯 `session.php` へルームID付きでリクエストを送る
fetch(`https://tohru-portfolio.secret.jp/bordgame/game/session.php?room=${roomID}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: playerToken })
})
.then(response => response.json())
.then(data => {
    console.log("📌 session.php のレスポンス:", data);

    if (data.success) {
        players = {};
        playerSizes = {}; 

        data.players.forEach(player => {
            players[player.id] = player;
            playerSizes[player.id] = player.size || "normal"; 
        });

        currentPlayer = data.currentPlayer;

        if (!currentPlayer) {
            console.error("❌ currentPlayer が取得できていません");
            return;
        }

        console.log("✅ 自分のプレイヤーデータ:", currentPlayer);
        console.log("✅ 現在の全プレイヤーデータ:", players);
        console.log("✅ プレイヤーサイズデータ:", playerSizes);

        // 🎯 プレイヤー登録をサーバーに送信
        socket.emit("registerPlayer", {
            id: currentPlayer.id,
            username: currentPlayer.username,
            token: playerToken,
            x: currentPlayer.x,
            y: currentPlayer.y,
            size: currentPlayer.size, 
            room: roomID 
        });

        drawBoard();
    } else {
        console.error("❌ プレイヤーデータ取得失敗:", data.error);
    }
});

function drawBoard() {
    board.innerHTML = "";

    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");

            let playerInCell = false;
            Object.values(players).forEach(player => {                
                if (player.x == x && player.y == y) {
                    playerInCell = true;

                    const playerElement = document.createElement("div");
                    playerElement.classList.add("player");

                    let size = playerSizes[player.id] || "normal";
                    playerElement.textContent = "■";

                    if (size === "small") {
                        playerElement.style.transform = "scale(0.5)";
                    } else if (size === "big") {
                        playerElement.style.transform = "scale(1.5)";
                    } else {
                        playerElement.style.transform = "scale(1)";
                    }

                    playerElement.style.color = (player.token == currentPlayer.token) ? "blue" : "red";
                    cell.appendChild(playerElement);
                }
            });

            if (!playerInCell) {
                cell.style.backgroundColor = "#ddd";
            }

            board.appendChild(cell);
        }
    }
}
function updatePlayerData(callback) {
    fetch(`https://tohru-portfolio.secret.jp/bordgame/game/session.php?room=${roomID}`)
    .then(response => response.json())
    .then(data => {
        console.log("📌 最新のプレイヤーデータ取得:", data);

        if (data.success && data.players) {
            players = data.players; 
            console.log("✅ players 更新完了:", players);
            setTimeout(() => {
                if (callback) callback();
            }, 50);
        } else {
            console.error("❌ session.php からのデータ取得に失敗:", data.error);
        }
    })
    .catch(error => console.error("❌ session.php 取得エラー:", error));
}



socket.on("playerMoved", (data) => {
    console.log(`📡 WebSocket 受信: playerMoved -> id=${data.id}, x=${data.x}, y=${data.y}`);
    updatePlayerData(() => {
        console.log(`📌 playerMoved: ID=${data.id} の更新後に drawBoard() を実行`);
        drawBoard();
    });
});

socket.on("updatePlayers", (data) => {
    console.log("📡 updatePlayers 受信:", data);

    if (!Array.isArray(data)) {
        console.error("❌ updatePlayers のデータ形式が不正です:", data);
        return;
    }
    players = {};
    data.forEach(player => {
        if (player && player.id) {
            players[player.id] = player;
        }
    });
    console.log("✅ 更新後の players:", players);
});


// 🎯 ゲーム開始イベント
socket.on("startGame", () => {
    console.log("🎮 ゲームが開始されました！");
    document.getElementById("gameStatus").textContent = "🎮 ゲームが開始されました！";
    board.style.display = "grid";
    drawBoard(); 
});


// 🎯 ゲーム終了
socket.on("endGame", () => {
    document.getElementById("gameStatus").textContent = "🛑 ゲームが終了しました";
    board.style.display = "none";
});

// 🎯 カードやイベント処理
const diceButton = document.getElementById("rollDice");
const moveForwardButton = document.getElementById("moveForward");
const moveBackwardButton = document.getElementById("moveBackward");
const trapButton = document.getElementById("trapButton");
const diceResult = document.getElementById("diceResult");
const statusText = document.getElementById("status");

// 🎲 サイコロを振る処理
diceButton.addEventListener("click", () => {
    const dice = Math.floor(Math.random() * 6) + 1;
    diceResult.textContent = `出目: ${dice}`;
    movePlayer(dice);
});

// 🔹 2マス進む
moveForwardButton.addEventListener("click", () => {
    movePlayer(2);
});

// 🔹 2マス戻る
moveBackwardButton.addEventListener("click", () => {
    movePlayer(-2);
});

// // 🔹 罠（1ターン休み）
// trapButton.addEventListener("click", () => {
//     statusText.textContent = "状態: 1ターン休み中";
//     alert("罠にかかった！次のターンは休み");
// });
