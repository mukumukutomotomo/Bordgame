let currentTurn = 0;
let turnTime = 60; // 1ターン60秒
let activeRoom = null;

// 🎮 ゲーム開始
socket.on("startGame", (data) => {
    if (!data.roomID) {
        console.error("❌ startGame の roomID が undefined");
        return;
    }
    
    console.log(`🎯 ゲーム開始 - ルーム: ${data.roomID}`);
    activeRoom = data.roomID;
    
    setTimeout(() => {
        showTurnTimerBar(data.roomID);
    }, 1000);
});

// 🎯 タイムバーを表示
function showTurnTimerBar(roomID) {
    if (roomID !== activeRoom) return; // ルームが一致しているか確認
    const timerContainer = document.getElementById("turnTimerContainer");
    if (timerContainer) {
        timerContainer.style.display = "block";
        console.log("🕒 タイムバー表示 - ルーム: " + roomID);
    }
}
