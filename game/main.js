const socket = io("https://bordgame.onrender.com");
// Token取得関数
function getTokenFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
}

// 🎯 URL から `token` を取得し、`sessionStorage` に保存
const token = getTokenFromURL();

if (token) {
    console.log("✅ URL から取得した token:", token);
    sessionStorage.setItem("playerToken", token);
} else {
    console.error("❌ トークンが見つかりません");
}


let players = {};  // 全プレイヤー情報
let playerSizes = {}; // プレイヤーのサイズ情報
let currentPlayer = null;  // 自分のプレイヤーデータ

const board = document.getElementById("board");
const playerToken = sessionStorage.getItem("playerToken");

console.log("📌 送信する token:", playerToken);

fetch("session.php", {
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ token: playerToken })
})
.then(response => response.json())
.then(data => {
    console.log("📌 session.php のレスポンス:", data);

    if (data.success) {
        players = {};
        playerSizes = {}; // 初期化

        data.players.forEach(player => {
            players[player.id] = player;
            playerSizes[player.id] = player.size || "normal"; // 🎯 サイズ情報をセット
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
            size: currentPlayer.size // 🎯 サイズ情報も送信
        });

        drawBoard();
    } else {
        console.error("❌ プレイヤーデータ取得失敗:", data.error);
    }
});


function drawBoard() {
    console.log("📌 drawBoard() 実行");
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

                    playerElement.textContent = "■"; // 通常の四角
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



socket.on("playerMoved", (data) => {
    console.log(`📌 playerMoved 受信: id=${data.id}, x=${data.x}, y=${data.y}`);

    if (players[data.id]) {
        players[data.id].x = data.x;
        players[data.id].y = data.y;
        drawBoard();
    } else {
        console.error(`❌ players に ID=${data.id} のプレイヤーが存在しません`);
    }
});


// ゲームに勝利
const winButton = document.getElementById("winButton");

winButton.addEventListener("click", () => {
    if (!currentPlayer) {
        console.error("❌ プレイヤーデータが取得できていません");
        return;
    }

    console.log(`🏆 ${currentPlayer.username} が勝利を宣言！`);
    socket.emit("playerWon", { winnerId: currentPlayer.id });
});

// 勝利メッセージ受信
socket.on("gameOver", (data) => {
    if (currentPlayer.id === data.winnerId) {
        document.getElementById("winScreen").style.display = "block";
    } else {
        document.getElementById("loseScreen").style.display = "block";
    }
});

// ゲーム開始
socket.on("startGame", () => {
    console.log("🎮 ゲームが開始されました！");

    // 🎯 ゲーム開始時に盤面を表示
    const boardElement = document.getElementById("board");
    if (boardElement) {
        boardElement.style.display = "grid"; // 盤面を表示
    } else {
        console.error("❌ `#board` が見つかりません");
    }

    document.getElementById("gameStatus").textContent = "🎮 ゲームが開始されました！";

    drawBoard(); 
});

// ゲーム開始前に全プレイヤーのデータ取得
socket.on("updatePlayers", (data) => {
    console.log("📡 updatePlayers 受信:", data);
    players = {};
    data.forEach(player => {
        players[player.id] = player;
    });

    console.log("✅ 更新後の players:", players);
});

// ゲーム終了
socket.on("endGame", () => {
    document.getElementById("gameStatus").textContent = "🛑 ゲームが終了しました";
    document.getElementById("board").style.display = "none";
});

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

// // 🔹 罠（1ターン休み）
// trapButton.addEventListener("click", () => {
//     statusText.textContent = "状態: 1ターン休み中";
//     alert("罠にかかった！次のターンは休み");
// });
