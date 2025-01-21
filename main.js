// ボードのサイズ
const rows = 10;
const cols = 10;

// プレイヤーの初期位置
let playerX = 0;
let playerY = 0;

// ボードの描画
const board = document.getElementById("board");
const diceButton = document.getElementById("rollDice");
const moveForwardButton = document.getElementById("moveForward");
const moveBackwardButton = document.getElementById("moveBackward");
const diceResult = document.getElementById("diceResult");

function drawBoard() {
    board.innerHTML = ""; // リセット
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            if (x === playerX && y === playerY) {
                cell.classList.add("player");
                cell.textContent = "■"; // プレイヤー
            }
            board.appendChild(cell);
        }
    }
}

drawBoard();

// サイコロを振る処理
diceButton.addEventListener("click", () => {
    const dice = Math.floor(Math.random() * 6) + 1; // 1~6のランダムな数
    diceResult.textContent = `出目: ${dice}`;
    movePlayer(dice);
});

// カード効果（2マス進む）
moveForwardButton.addEventListener("click", () => {
    movePlayer(2);
});

// カード効果（2マス戻る）
moveBackwardButton.addEventListener("click", () => {
    movePlayer(-2);
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
