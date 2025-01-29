const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors()); // CORS 設定

// 🎯 `session.php` のURL
const LOLLIPOP_API = "https://tohru-portfolio.secret.jp/bordgame/game/session.php";

let rooms = {}; // ルームごとのプレイヤーデータ { roomID: { playerID: {...} } }

// 🔹 WebSocket接続時の処理
io.on("connection", async (socket) => {
    console.log(`✅ 新しいプレイヤーが接続: ${socket.id}`);

    // 🎯 プレイヤー登録
    socket.on("registerPlayer", (data) => {
        if (!data.id || !data.token || !data.room) {
            console.error("❌ registerPlayer に必要なデータが不足！");
            return;
        }

        if (!rooms[data.room]) {
            rooms[data.room] = {}; // ルームごとにプレイヤーを管理
        }

        rooms[data.room][data.id] = {
            id: data.id,
            username: data.username || `Player${data.id}`,
            token: data.token,
            socketId: socket.id,
            x: data.x || 0,
            y: data.y || 0
        };

        console.log(`✅ ルーム ${data.room} にプレイヤー登録: ID=${data.id}`);
        io.to(data.room).emit("updatePlayers", Object.values(rooms[data.room]));
    });

    // 🎯 プレイヤー移動処理
    socket.on("movePlayer", (data) => {
        if (!data.id || !data.room || !rooms[data.room] || !rooms[data.room][data.id]) {
            console.error("❌ movePlayer に無効なデータ:", data);
            return;
        }

        rooms[data.room][data.id].x = data.x;
        rooms[data.room][data.id].y = data.y;

        console.log(`🔄 ルーム ${data.room} でプレイヤー ${data.id} が移動: x=${data.x}, y=${data.y}`);
        io.to(data.room).emit("playerMoved", { id: data.id, x: data.x, y: data.y });
    });

    // 🎯 ゲーム開始処理
    socket.on("startGame", async (data) => {
        console.log("📡 startGame イベント受信:", data);

        if (!data.room) {
            console.error("❌ ルームIDが指定されていません");
            return;
        }

        console.log(`🎮 ルーム ${data.room} でゲーム開始`);

        try {
            console.log(`📡 session.php へ送信するデータ: { token: "SERVER_ADMIN_TOKEN", room: "${data.room}" }`);

            const response = await axios.post(LOLLIPOP_API, {
                token: "SERVER_ADMIN_TOKEN",
                room: data.room
            }, {
                headers: { "Content-Type": "application/json" } // JSON に変更
            });

            console.log("📡 session.php のレスポンス:", response.data);

            if (response.data.success) {
                rooms[data.room] = response.data.players.reduce((acc, player) => {
                    acc[player.id] = { ...player, socketId: null };
                    return acc;
                }, {});

                console.log(`✅ ルーム ${data.room} の最新プレイヤーリスト更新`);
                io.to(data.room).emit("updatePlayers", Object.values(rooms[data.room]));
                io.to(data.room).emit("startGame");
            } else {
                console.error(`❌ ルーム ${data.room} のプレイヤーデータ取得失敗:`, response.data.error);
            }
        } catch (error) {
            console.error(`❌ session.php データ取得エラー:`, error.message);
        }
    });

    // 🎯 ゲーム終了処理
    socket.on("endGame", (data) => {
        if (!data.room) {
            console.error("❌ ルームIDが指定されていません");
            return;
        }

        console.log(`🛑 ルーム ${data.room} のゲーム終了`);
        io.to(data.room).emit("endGame");
    });

    // 🎯 プレイヤー勝利処理
    socket.on("playerWon", (data) => {
        if (!data.room) {
            console.error("❌ ルームIDが指定されていません");
            return;
        }

        console.log(`🏆 ルーム ${data.room} でプレイヤー ${data.winnerId} が勝利！`);
        io.to(data.room).emit("gameOver", { winnerId: data.winnerId });
    });

    // 🎯 プレイヤー切断処理
    socket.on("disconnect", () => {
        console.log(`❌ プレイヤーが切断: ${socket.id}`);

        Object.keys(rooms).forEach((roomID) => {
            for (let id in rooms[roomID]) {
                if (rooms[roomID][id].socketId === socket.id) {
                    console.log(`🗑️ ルーム ${roomID} からプレイヤー ${id} を削除`);
                    delete rooms[roomID][id];
                    break;
                }
            }
            io.to(roomID).emit("updatePlayers", Object.values(rooms[roomID]));
        });
    });
});

// 🔹 サーバー起動
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 WebSocket サーバーが ${PORT} で起動しました`);
});
