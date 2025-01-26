const rows = 10;
const cols = 10;
const board = document.getElementById("board");

// WebSocket 接続
if (!window.socket) {
    window.socket = io("https://bordgame.onrender.com");
}
const socket = window.socket;

let players = {}; // すべてのプレイヤー情報
let currentId = null; // 自分のID
let currentPlayer = null; // 自分のプレイヤーデータ

// 🎯 初回ロード時に `session.php` からプレイヤー情報を取得
fetch("session.php")
    .then(response => response.json())
    .then(data => {
        console.log("プレイヤーデータ取得:", data);

        if (data.success) {
            players = data.players;
            currentId = data.id; // 自分のID
            sessionStorage.setItem("playerID", currentId);
            sessionStorage.setItem("token", data.token);

            // 🎯 WebSocket にプレイヤー登録
            socket.emit("registerPlayer", {
                id: currentId,
                token: data.token
            });

            currentPlayer = players.find(p => p.id == currentId);
            if (!currentPlayer) {
                console.error("自分のプレイヤー情報が見つかりません");
            } else {
                console.log("自分のプレイヤーデータ:", currentPlayer);
            }

            drawBoard();
        } else {
            console.error("プレイヤーデータの取得に失敗:", data.error);
        }
    })
    .catch(error => {
        console.error("サーバーエラー:", error);
    });

// 🔹 WebSocket でプレイヤーデータを受信
socket.on("updatePlayers", (updatedPlayers) => {
    console.log("🆕 プレイヤーリスト更新:", updatedPlayers);
    players = updatedPlayers;
    drawBoard();
});

// 🎯 他のプレイヤーの移動をリアルタイムで反映
socket.on("playerMoved", (data) => {
    console.log(`プレイヤー ${data.id} が移動: x=${data.x}, y=${data.y}`);
    const player = players.find(p => p.id == data.id);
    if (player) {
        player.x = data.x;
        player.y = data.y;
        drawBoard();
    }
});

// 🎯 ゲーム開始処理
socket.on("startGame", () => {
    document.getElementById("gameStatus").textContent = "🎮 ゲームが開始されました！";
    document.getElementById("board").style.display = "grid";
});

// 🎯 ゲーム終了処理
socket.on("endGame", () => {
    document.getElementById("gameStatus").textContent = "🛑 ゲームが終了しました";
    document.getElementById("board").style.display = "none";
});

// 🔹 盤面を描画
function drawBoard() {
    board.innerHTML = "";

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");

            players.forEach(player => {
                if (player.x == x && player.y == y) {
                    let color = (player.id == currentId) ? "blue" : "red";
                    cell.innerHTML = `<div class="username-label" style="color: ${color}">${player.username}</div>■`;
                }
            });

            board.appendChild(cell);
        }
    }
}

// 🔹 プレイヤーの移動処理
function movePlayer(steps) {
    if (!currentPlayer) {
        alert("エラー: 自分のプレイヤーデータが見つかりません");
        return;
    }

    let newX = currentPlayer.x;
    let newY = currentPlayer.y;

    for (let i = 0; i < Math.abs(steps); i++) {
        if (steps > 0) {
            if (newY % 2 === 0) {
                if (newX < cols - 1) {
                    newX++;
                } else if (newY < rows - 1) {
                    newY++;
                }
            } else {
                if (newX > 0) {
                    newX--;
                } else if (newY < rows - 1) {
                    newY++;
                }
            }
        }
    }

    console.log(`📡 movePlayer() 実行: id=${currentId}, x=${newX}, y=${newY}`);

    // 🎯 WebSocket でサーバーに移動を通知
    socket.emit("movePlayer", { id: currentId, x: newX, y: newY });
}

// 🔹 カードやイベント処理
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

// 🔹 罠（1ターン休み）
trapButton.addEventListener("click", () => {
    statusText.textContent = "状態: 1ターン休み中";
    alert("罠にかかった！次のターンは休み");
});
