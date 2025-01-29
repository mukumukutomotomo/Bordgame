document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 login.js ロード完了");

    const newGameBtn = document.getElementById("newGame");
    const joinGameBtn = document.getElementById("joinGame");
    const copyLinkBtn = document.getElementById("copyLink");
    const roomSection = document.getElementById("roomSection");
    const usernameSection = document.getElementById("usernameSection");
    const playerList = document.getElementById("playerList");

    // 🎯 ボタンの存在を確認（nullチェック）
    if (!newGameBtn || !joinGameBtn || !copyLinkBtn) {
        console.error("❌ 必要なボタンが見つかりません");
        return;
    }

    let roomID = new URLSearchParams(window.location.search).get("room");
    let token = sessionStorage.getItem("playerToken");

    if (roomID) {
        console.log(`✅ ルームID取得: ${roomID}`);
        document.getElementById("roomID").textContent = roomID;
        document.getElementById("inviteLink").href = `https://tohru-portfolio.secret.jp/bordgame/user/login.html?room=${roomID}`;
        roomSection.style.display = "block";
        usernameSection.style.display = "block";

        // 🎯 ルーム内のプレイヤー一覧を取得
        fetch(`https://tohru-portfolio.secret.jp/bordgame/game/session.php?room=${roomID}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ token: token || "" })  // トークンがある場合は送信
        })
        .then(response => response.json())
        .then(data => {
            console.log("📡 session.php のレスポンス:", data);
            if (data.success) {
                playerList.innerHTML = "";
                data.players.forEach(player => {
                    const li = document.createElement("li");
                    li.textContent = player.username;
                    playerList.appendChild(li);
                });

                // 🎯 自分の情報を sessionStorage に保存
                if (data.currentPlayer) {
                    sessionStorage.setItem("playerToken", data.currentPlayer.token);
                }
            } else {
                console.error("❌ session.php のエラー:", data.error);
            }
        })
        .catch(error => console.error("❌ session.php 取得エラー:", error));
    }

    // 🎯 NewGame（新しいゲームルームを作成）
    newGameBtn.addEventListener("click", () => {
        console.log("🎮 NewGame ボタンが押されました");
        fetch("newgame.php", {
            method: "POST"
        })
        .then(response => response.json())
        .then(data => {
            console.log("📡 newgame.php のレスポンス:", data);
            if (data.success) {
                console.log(`✅ 新しいルームID: ${data.roomID}`);
                const inviteURL = `https://tohru-portfolio.secret.jp/bordgame/user/login.html?room=${data.roomID}`;
                navigator.clipboard.writeText(inviteURL).then(() => {
                    console.log("招待リンクがクリップボードにコピーされました: " + inviteURL);
                }).catch(err => {
                    console.error("❌ クリップボードへのコピーに失敗しました:", err);
                });

                // 🎯 ルームIDとセクションを表示
                roomID = data.roomID;
                document.getElementById("roomID").textContent = roomID;
                document.getElementById("inviteLink").href = inviteURL;
                roomSection.style.display = "block";
                usernameSection.style.display = "block";
            } else {
                console.error("エラー: " + data.error);
            }
        })
        .catch(error => console.error("❌ newgame.php 取得エラー:", error));
    });

    // 🎯 ゲームに参加
    joinGameBtn.addEventListener("click", () => {
        const username = document.getElementById("username").value.trim();
        if (!username) {
            alert("ユーザーネームを入力してください");
            return;
        }

        console.log(`✅ ${username} がゲームに参加`);

        fetch("join_game.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ roomID: roomID, username: username })
        })
        .then(response => response.json())
        .then(data => {
            console.log("📡 join_game.php のレスポンス:", data);
            if (data.success) {
                console.log(`✅ ${username} がルーム ${roomID} に登録完了`);
                sessionStorage.setItem("playerToken", data.token);  // 🎯 トークンを保存
                window.location.href = data.redirect;
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error("❌ join_game.php 取得エラー:", error));
    });

    // 🎯 招待リンクをコピー
    copyLinkBtn.addEventListener("click", () => {
        if (roomID) {
            const inviteURL = `https://tohru-portfolio.secret.jp/bordgame/user/login.html?room=${roomID}`;
            navigator.clipboard.writeText(inviteURL).then(() => {
                alert("招待リンクがクリップボードにコピーされました: " + inviteURL);
            }).catch(err => {
                console.error("❌ クリップボードへのコピーに失敗しました:", err);
            });
        } else {
            alert("ルームIDがありません");
        }
    });
});
