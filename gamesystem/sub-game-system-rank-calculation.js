const winButton = document.getElementById("winButton");

if (winButton) {
    winButton.addEventListener("click", () => {
        if (!roomID || !playerToken || !currentPlayer) {
            console.error("❌ ルームIDまたはプレイヤーデータが取得できません");
            return;
        }

        console.log(`🏆 勝利ボタンが押されました: Player ${currentPlayer.id}`);
        socket.emit("declareWinner", {
            winnerId: currentPlayer.id,
            room: roomID
        });
    });
}

// 🎯 サーバーから勝敗通知を受信
socket.on("gameOver", (data) => {
    console.log(`📡 ゲーム終了: Winner=${data.winnerId}`);

    // 自分が勝者かどうかを判定
    if (currentPlayer.id === data.winnerId) {
        document.getElementById("winScreen").style.display = "block";
    } else {
        document.getElementById("loseScreen").style.display = "block";
    }

    // コントロールを無効化（プレイヤーの移動を禁止）
    document.getElementById("controls").style.display = "none";
});
