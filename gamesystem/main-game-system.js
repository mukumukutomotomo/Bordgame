// Miyai案(Mapの縮小/拡大)
let playerPosition = 0;
let shrinkMode = false;
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const player = document.getElementById('player');
const cellWidth = board.clientWidth / cells.length;

function movePlayer() {
    player.style.left = `${playerPosition * cellWidth}px`;
}

function rollDice() {
    let dice = Math.floor(Math.random() * 6) + 1; // 1-6 のサイコロ
    if (shrinkMode) {
        dice *= 4; // 縮小モードならさらに細かく移動
    }
    playerPosition += dice;
    if (playerPosition >= cells.length) playerPosition = cells.length - 1; // ボード外に出ないように
    movePlayer();
}

function toggleShrinkMode() {
    shrinkMode = !shrinkMode;
    alert(shrinkMode ? "縮小モードON" : "縮小モードOFF");
}

movePlayer();