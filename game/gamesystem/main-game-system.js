let currentTurn = 0;
let turnTime = 60; // 1ターン60秒
let activeRoom = null;

// 🎮 ゲーム開始
socket.on("startGame", (data) => {
    if (!data.roomID) {
        console.error("❌ startSystem の roomID が undefined");
        return;
    }
    console.log(`🎯 ゲーム開始 - ルーム: ${data.roomID}`);
    activeRoom = data.roomID;
    
    setTimeout(() => {
        showTurnTimerBar(data.roomID);
    }, 1000);
});

// 🎯 タイムバーを表示して 60 秒で減少
function showTurnTimerBar(roomID) {
    if (roomID !== activeRoom) return;
    
    const timerContainer = document.getElementById("turnTimerContainer");
    const timerBar = document.getElementById("turnTimerBar");
    const timerLabel = document.getElementById("turnTimerLabel");

    if (timerContainer && timerBar && timerLabel) {
        timerContainer.style.display = "block";  // タイムバーを表示
        timerBar.style.width = "100%";  // 初期状態を100%に
        timerLabel.textContent = `残り時間: 60s`;

        // **CSSの `transition` を適用してバーを縮小**
        setTimeout(() => {
            timerBar.style.transition = "width 60s linear";  // 60秒かけて縮小
            timerBar.style.width = "0%";
        }, 50); // **少し遅延を加えないと初回のwidth変更が効かないことがある**

        let remainingTime = 60;
        const interval = setInterval(() => {
            remainingTime--;
            timerLabel.textContent = `残り時間: ${remainingTime}s`;

            if (remainingTime <= 0) {
                clearInterval(interval);
                timerLabel.textContent = "ターン終了！";
            }
        }, 1000);
    } else {
        console.error("❌ タイムバー要素が見つかりません");
    }
}
