const rows = 10;
const cols = 10;
const board = document.getElementById("board");

// WebSocket 接続
const socket = io("http://localhost:3000");

let skipTurn = false; // 1ターン休みフラグ
let players = {}; // すべてのプレイヤー情報
let currentId = null; // 自分のID
let currentPlayer = null; // 自分のプレイヤーデータ

// 初回ロード時にプレイヤーデータを取得
fetch("session.php")
    .then(response => response.json())
    .then(data => {
        console.log("プレイヤーデータ取得:", data);

        if (data.players) {
            players = data.players;
            currentId = data.currentId; // 自分のIDを取得

            // 自分のプレイヤーデータを探す
            currentPlayer = players.find(p => p.id == currentId);

            if (!currentPlayer) {
                console.error("自分のプレイヤー情報が見つかりません");
            } else {
                console.log("自分のプレイヤーデータ:", currentPlayer);
            }

            drawBoard();
        }
    })
    .catch(error => {
        console.error("プレイヤーデータの取得に失敗:", error);
    });

// サーバーから全プレイヤーの最新情報を受信
socket.on("playersData", (data) => {
    console.log("リアルタイムプレイヤーデータ取得:", data);
    players = data;
    drawBoard();
});

// 他のプレイヤーの移動をリアルタイムで受信
socket.on("playerMoved", (data) => {
    console.log(`プレイヤー ${data.id} が移動: x=${data.x}, y=${data.y}`);

    const player = players.find(p => p.id == data.id);
    if (player) {
        player.x = data.x;
        player.y = data.y;
        drawBoard();
    }
});

// 盤面を描画
function drawBoard() {
    board.innerHTML = "";

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");

            // プレイヤーの位置に名前を表示
            players.forEach(player => {
                if (player.x == x && player.y == y) {
                    cell.classList.add("player");
                    let color = (player.id == currentId) ? "blue" : "red";
                    cell.innerHTML = `<div class="username-label" style="color: ${color}">${player.username}</div>■`;
                }
            });

            board.appendChild(cell);
        }
    }
}

// プレイヤーの移動処理
function movePlayer(steps) {
    if (!currentPlayer) {
        alert("エラー: 自分のプレイヤーデータが見つかりません");
        return;
    }

    let newX = currentPlayer.x;
    let newY = currentPlayer.y;

    for (let i = 0; i < Math.abs(steps); i++) {
        if (steps > 0) {
            // 前進処理
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
        } else {
            // 後退処理
            if (newY % 2 === 0) {
                if (newX > 0) {
                    newX--;
                } else if (newY > 0) {
                    newY--;
                }
            } else {
                if (newX < cols - 1) {
                    newX++;
                } else if (newY > 0) {
                    newY--;
                }
            }
        }
    }

    // WebSocket でサーバーに移動データを送信
    socket.emit("movePlayer", { id: currentId, x: newX, y: newY });

    // データベースも更新
    updatePlayerPosition(currentId, newX, newY);
}

// プレイヤーの位置をデータベースに更新
function updatePlayerPosition(id, newX, newY) {
    fetch("update_position.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: id, x: newX, y: newY })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("位置更新成功:", data);
            currentPlayer.x = newX;
            currentPlayer.y = newY;
            drawBoard();
        } else {
            console.error("位置更新エラー:", data.error);
        }
    })
    .catch(error => console.error("サーバーエラー:", error));
}

//試しに作ったカード効果やバフ
const diceButton = document.getElementById("rollDice");
const moveForwardButton = document.getElementById("moveForward");
const moveBackwardButton = document.getElementById("moveBackward");
const trapButton = document.getElementById("trapButton");
const diceResult = document.getElementById("diceResult");
const statusText = document.getElementById("status");
// サイコロを振る処理
diceButton.addEventListener("click", () => {
    if (skipTurn) {
        alert("1ターン休み中！行動できません");
        skipTurn = false; // 次のターンから通常行動可
        statusText.textContent = "状態: 通常";
        return;
    }
    
    const dice = Math.floor(Math.random() * 6) + 1; // 1~6のランダムな数
    diceResult.textContent = `出目: ${dice}`;
    movePlayer(dice);
});

// カード効果（2マス進む）
moveForwardButton.addEventListener("click", () => {
    if (skipTurn) {
        alert("1ターン休み中！行動できません");
        skipTurn = false;
        statusText.textContent = "状態: 通常";
        return;
    }
    
    movePlayer(2);
});

// カード効果（2マス戻る）
moveBackwardButton.addEventListener("click", () => {
    if (skipTurn) {
        alert("1ターン休み中！行動できません");
        skipTurn = false;
        statusText.textContent = "状態: 通常";
        return;
    }
    
    movePlayer(-2);
});

// 罠効果（1ターン休み）
trapButton.addEventListener("click", () => {
    skipTurn = true;
    statusText.textContent = "状態: 1ターン休み中";
    alert("罠にかかった！次のターンは休み");
});