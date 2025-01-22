// ボードのサイズ
const rows = 10;
const cols = 10;


// プレイヤーの初期位置
let playerX = 0;
let playerY = 0;
let skipTurn = false; // 1ターン休みフラグ

// ボードの描画
const board = document.getElementById("board");
const diceButton = document.getElementById("rollDice");
const moveForwardButton = document.getElementById("moveForward");
const moveBackwardButton = document.getElementById("moveBackward");
const trapButton = document.getElementById("trapButton");
const diceResult = document.getElementById("diceResult");
const statusText = document.getElementById("status");
let players = {}; // プレイヤー情報を保持する

// すべてのプレイヤーのデータを取得
fetch("session.php")
    .then(response => response.json())
    .then(data => {
        if (data.players) {
            players = data.players;
            drawBoard();
        }
    })
    .catch(error => {
        console.error("プレイヤーデータの取得に失敗:", error);
    });

function drawBoard() {
    board.innerHTML = "";

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");

            // プレイヤーの位置に名前を表示
            Object.values(players).forEach(player => {
                if (player.x === x && player.y === y) {
                    cell.classList.add("player");
                    cell.innerHTML = `<div class="username-label">${player.username}</div>■`;
                }
            });

            board.appendChild(cell);
        }
    }
}



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

// プレイヤーの移動処理
function movePlayer(steps) {
    for (let i = 0; i < Math.abs(steps); i++) {
        if (steps > 0) {
            // 前進処理
            if (playerY % 2 === 0) {
                // 偶数行 → 右へ
                if (playerX < cols - 1) {
                    playerX++;
                } else {
                    if (playerY < rows - 1) {
                        playerY++;
                    }
                }
            } else {
                // 奇数行 → 左へ
                if (playerX > 0) {
                    playerX--;
                } else {
                    if (playerY < rows - 1) {
                        playerY++;
                    }
                }
            }
        } else {
            // 後退処理
            if (playerY % 2 === 0) {
                // 偶数行 → 左へ
                if (playerX > 0) {
                    playerX--;
                } else {
                    if (playerY > 0) {
                        playerY--;
                    }
                }
            } else {
                // 奇数行 → 右へ
                if (playerX < cols - 1) {
                    playerX++;
                } else {
                    if (playerY > 0) {
                        playerY--;
                    }
                }
            }
        }
    }
    drawBoard();
}
