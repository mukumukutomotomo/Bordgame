const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// ロリポップの `session.php` のURL
const LOLLIPOP_API = "https://tohru-portfolio.secret.jp/bordgame/game/session.php";

let players = {}; // プレイヤーデータ (オブジェクト化)

// 🔹 WebSocket接続時の処理
io.on("connection", async (socket) => {
    console.log(`✅ 新しいプレイヤーが接続: ${socket.id}`);

    try {
        const response = await axios.get(LOLLIPOP_API);
        console.log("📡 `session.php` からのデータ:", response.data);
        
        if (response.data.board) {
            players = response.data.players.reduce((acc, player) => {
                acc[player.id] = { ...player, socketId: null };
                return acc;
            }, {});
        }

        // すべてのクライアントに最新のプレイヤーリストを送信
        io.emit("updatePlayers", Object.values(players));
    } catch (error) {
        console.error("❌ `session.php` からのデータ取得エラー:", error.message);
    }

    socket.on("registerPlayer", (data) => {
        console.log("📌 registerPlayer() 受信:", data);
    
        if (!data.id || !data.token) {
            console.error("❌ `registerPlayer` に ID または Token が不足！");
            return;
        }
    
        players[data.id] = {
            id: data.id,
            username: data.username || `Player${data.id}`,
            token: data.token,
            socketId: socket.id,
            x: data.x || 0,
            y: data.y || 0
        };
    
        console.log(`✅ プレイヤー登録: ID=${data.id}, Token=${data.token}, x=${players[data.id].x}, y=${players[data.id].y}`);
        console.log("📌 現在の players:", JSON.stringify(players, null, 2));
    
        io.emit("updatePlayers", Object.values(players));
    });
    

    socket.on("movePlayer", (data) => {
        console.log("📌 movePlayer() 受信:", data);
        console.log("📌 現在の players:", JSON.stringify(players, null, 2));
    
        if (!data.id || !players[data.id]) {
            console.error("❌ movePlayer() に無効な ID:", data.id);
            return;
        }
    
        // 🎯 サーバー上の `players` データを更新
        players[data.id].x = data.x;
        players[data.id].y = data.y;
    
        console.log(`🔄 プレイヤー ${data.id} が移動: x=${data.x}, y=${data.y}`);
    
        // 🎯 全プレイヤーに移動を通知
        io.emit("playerMoved", { id: data.id, x: data.x, y: data.y });
    });
    
    

    socket.on("startGame", async () => {
        console.log("🎮 ゲーム開始要求を受信");
    
        try {
            // 🎯 `session.php` に `POST` で `token` を送信
            const response = await axios.post(LOLLIPOP_API, new URLSearchParams({
                token: "SERVER_ADMIN_TOKEN" 
            }).toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });
    
            console.log("📡 `session.php` からのデータ:", response.data);
    
            if (response.data.success) {
                players = response.data.players.reduce((acc, player) => {
                    acc[player.id] = { ...player, socketId: null };
                    return acc;
                }, {});
    
                console.log("✅ 最新のプレイヤーリスト:", players);
            } else {
                console.error("❌ `session.php` からプレイヤーデータを取得できませんでした:", response.data.error);
                return;
            }
        } catch (error) {
            console.error("❌ `session.php` からのデータ取得エラー:", error.message);
            return;
        }
    
        // 最新のプレイヤーデータを全員に送信
        io.emit("updatePlayers", Object.values(players));
    
        // 🎯 全プレイヤーを再取得後、ゲーム開始
        console.log("🎮 ゲームを開始します！");
        io.emit("startGame");
    });
    


    // 🔹 ゲーム終了
    socket.on("endGame", () => {
        console.log("🛑 ゲーム終了");
        io.emit("endGame");
    });

    // 🔹 プレイヤーが切断したとき
    socket.on("disconnect", () => {
        console.log(`❌ プレイヤーが切断: ${socket.id}`);

        // players オブジェクトから削除
        for (let id in players) {
            if (players[id].socketId === socket.id) {
                console.log(`🗑️ プレイヤー ${id} を削除`);
                delete players[id];
                break;
            }
        }

        // 最新のプレイヤーリストを全員に送信
        io.emit("updatePlayers", Object.values(players));
    });
});

// 🔹 ポート設定
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 WebSocket サーバーが ${PORT} で起動しました`);
});
