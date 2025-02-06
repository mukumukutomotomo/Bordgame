let currentTurn = 0;
let activeRoom = null;
let turnTimerInterval = null; // 🎯 インターバル管理用変数

// 🎮 ゲーム開始
socket.on("startGame", (data) => {
    if (!data.roomID) {
        console.error("❌ startSystem の roomID が undefined");
        return;
    }
    console.log(`🎯 ゲーム開始 - ルーム: ${data.roomID}`);
    activeRoom = data.roomID;
});

// 🎯 ターン開始
socket.on("startTurn", (data) => {
    console.log(`🔄 クライアント側でターン開始を受信: ${data.turn}`);
    document.getElementById("gameStatus").textContent = `🎮 ターン ${data.turn} 開始！`;
    currentTurn = data.turn;
    showTurnTimerBar();
});


// 🎯 タイムバーを表示して 60 秒で減少
function showTurnTimerBar() {
    const timerContainer = document.getElementById("turnTimerContainer");
    const timerBar = document.getElementById("turnTimerBar");
    const timerLabel = document.getElementById("turnTimerLabel");

    if (timerContainer && timerBar && timerLabel) {
        timerContainer.style.display = "block";
        timerBar.style.width = "100%";
        timerLabel.textContent = `残り時間: 60s`;

        setTimeout(() => {
            timerBar.style.transition = "width 60s linear";
            timerBar.style.width = "0%";
        }, 50);

        let remainingTime = 60;

        // 🎯 すでに動作しているタイマーがあればリセット
        if (turnTimerInterval) clearInterval(turnTimerInterval);

        turnTimerInterval = setInterval(() => {
            remainingTime--;
            timerLabel.textContent = `残り時間: ${remainingTime}s`;

            if (remainingTime <= 0) {
                clearInterval(turnTimerInterval);
                timerLabel.textContent = "🛑 ターン終了！";
            }
        }, 1000);
    } else {
        console.error("❌ タイムバー要素が見つかりません");
    }
}

// 🎯 ターン終了処理
socket.on("endTurn", (data) => {
    console.log(`🛑 ターン ${data.turn} 終了`);
    document.getElementById("gameStatus").textContent = "🛑 ターン終了！";

    // 🎯 タイムバーを非表示 & インターバル停止
    const timerContainer = document.getElementById("turnTimerContainer");
    if (timerContainer) timerContainer.style.display = "none";

    if (turnTimerInterval) clearInterval(turnTimerInterval);
});
