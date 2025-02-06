const socket = io("https://bordgame.onrender.com");

let currentTurn = 0;
let turnTime = 60; // 1ターン60秒
let hasRolledDice = false;
let hasUsedCard = false;
let playersInRoom = {};

// ターン開始
socket.on("startTurn", (data) => {
    console.log(`🎯 ターン ${data.turn} 開始`);
    currentTurn = data.turn;
    hasRolledDice = false;
    hasUsedCard = false;
    playersInRoom = data.players;
    document.getElementById("gameStatus").textContent = `ターン ${currentTurn}`;

    startTurnTimer(turnTime);
});

// ターンの制限時間をカウントダウン
function startTurnTimer(seconds) {
    let remainingTime = seconds;
    const timerElement = document.getElementById("turnTimer");
    timerElement.textContent = `残り時間: ${remainingTime}s`;

    const interval = setInterval(() => {
        remainingTime--;
        timerElement.textContent = `残り時間: ${remainingTime}s`;

        if (remainingTime <= 0) {
            clearInterval(interval);
            socket.emit("endTurn", { room: roomID, turn: currentTurn });
        }
    }, 1000);
}

// 🎲 サイコロを振る処理
const diceButton = document.getElementById("rollDice");
diceButton.addEventListener("click", () => {
    if (hasRolledDice) {
        alert("すでにサイコロを振っています！");
        return;
    }
    hasRolledDice = true;
    hasUsedCard = true; // サイコロを振ったらカード使用不可

    socket.emit("turnAction", { room: roomID, playerID: userID, action: "rollDice" });
});

// 🎴 カードを使う処理
const cardButton = document.getElementById("useCard");
cardButton.addEventListener("click", () => {
    if (hasUsedCard) {
        alert("このターンではすでに行動済みです！");
        return;
    }
    hasUsedCard = true;
    alert("カードを使用しました！");
    
    socket.emit("turnAction", { room: roomID, playerID: userID, action: "useCard" });
});

// サーバーからターン終了の通知を受け取る
socket.on("endTurn", (data) => {
    console.log(`🛑 ターン ${data.turn} 終了`);
    document.getElementById("gameStatus").textContent = `ターン ${data.turn} 終了`;
});
