const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors()); // CORS 設定

const LOLLIPOP_API = "https://tohru-portfolio.secret.jp/bordgame/game/session.php";
let rooms = {}; // ルームごとのプレイヤーデータ { roomID: { playerID: {...} } }

// 🔹 WebSocket接続時の処理
io.on("connection", async (socket) => {
    console.log(`✅ 新しいプレイヤーが接続: ${socket.id}`);

    // 🎯 クライアントをルームに参加させる
    socket.on("joinRoom", (roomID) => {
        console.log(`🔗 クライアント ${socket.id} がルーム ${roomID} に参加`);
        socket.join(roomID);

        // ルームのプレイヤーデータを初期化
        if (!rooms[roomID]) {
            rooms[roomID] = {};
        }

        rooms[roomID][socket.id] = { id: socket.id, username: `Player${socket.id}`, x: 0, y: 0 };

        console.log(`📡 現在の rooms:`, io.sockets.adapter.rooms);
    });

    // 🎯 プレイヤー登録
    socket.on("registerPlayer", (data) => {
        if (!data.id || !data.token || !data.room) {
            console.error("❌ registerPlayer に必要なデータが不足！");
            return;
        }

        if (!rooms[data.room]) {
            rooms[data.room] = {};
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

        // 🎲 移動ロジックを適用
        let player = rooms[data.room][data.id];
        player.x = data.x;
        player.y = data.y;

        console.log(`🔄 ルーム ${data.room} でプレイヤー ${data.id} が移動: x=${data.x}, y=${data.y}`);

        // 🎯 WebSocket で移動を通知
        io.to(data.room).emit("playerMoved", { id: data.id, x: data.x, y: data.y });

        // 🎯 データベースに移動後の座標を保存
        axios.post("https://tohru-portfolio.secret.jp/bordgame/game/update_position.php", new URLSearchParams({
            token: player.token,
            x: data.x,
            y: data.y,
            room: data.room
        }).toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        }).then(response => {
            if (!response.data.success) {
                console.error("❌ データベース更新失敗:", response.data.error);
            } else {
                console.log("✅ データベースにプレイヤー座標を保存:", response.data);
            }
        }).catch(error => console.error("❌ update_position.php 取得エラー:", error));
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

            const response = await axios.get(`${LOLLIPOP_API}?room=${data.room}&token=SERVER_ADMIN_TOKEN`);

            console.log("📡 session.php のレスポンス:", response.data);

            if (response.data.success) {
                rooms[data.room] = response.data.players.reduce((acc, player) => {
                    acc[player.id] = { ...player, socketId: null };
                    return acc;
                }, {});

                console.log(`✅ ルーム ${data.room} の最新プレイヤーリスト更新`);
                console.log(`Sending updatePlayers to room: ${data.room}`);
                io.to(data.room).emit("updatePlayers", Object.values(rooms[data.room]));
                console.log(`Sending startGame to room: ${data.room}`);
                console.log(`📡 現在のルーム情報:`, io.sockets.adapter.rooms);
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

    // 🎯 クライアント切断処理
    socket.on("disconnect", () => {
        console.log(`❌ プレイヤーが切断: ${socket.id}`);

        Object.keys(rooms).forEach((roomID) => {
            if (rooms[roomID] && rooms[roomID][socket.id]) {
                console.log(`🗑️ ルーム ${roomID} からプレイヤー ${socket.id} を削除`);
                delete rooms[roomID][socket.id];
            }
        });

        io.emit("updatePlayers", rooms);
    });
});

// 🔹 サーバー起動
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 WebSocket サーバーが ${PORT} で起動しました`);
});
