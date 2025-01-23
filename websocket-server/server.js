const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ロリポップの `session.php` のURL
const LOLLIPOP_API = "https://tohru-portfolio.secret.jp/bordgame/game/session.php"; 

let players = []; // 現在のプレイヤーリスト

    io.on("connection", async (socket) => {
    console.log("✅ 新しいプレイヤーが接続しました:", socket.id);

    try {
        const response = await axios.get(LOLLIPOP_API);
        console.log("📡 `session.php` からのデータ:", response.data);
        players = response.data.players;

        // すべてのクライアントにプレイヤーリストを送信 (新規接続者を含む)
        io.emit("updatePlayers", players);

        // 新しく接続したプレイヤーに現在のプレイヤーデータを送信
        socket.emit("playersData", players);
    } catch (error) {
        console.error("❌ `session.php` からのデータ取得エラー:", error.message);
    }

    socket.on("playersData", (data) => {
        console.log("📡 WebSocket からのプレイヤーデータ:", data);
    
        if (!data || !data.players) {
            console.error("❌ `playersData` のデータが不正です！", data);
            return;
        }
    
        players = data.players;
    
        if (data.currentId !== null) {
            currentId = data.currentId;
        }
    
        currentPlayer = players.find(p => p.id == currentId);
    
        if (!currentPlayer) {
            console.error("❌ `currentPlayer` が見つかりません！ID:", currentId);
        } else {
            console.log(`✅ 'currentPlayer' を取得: ${currentPlayer.username} (ID: ${currentPlayer.id})`);
        }
    
        drawBoard();
    });

    // プレイヤー識別
    socket.on("connect", () => {
    let token = sessionStorage.getItem("token");
    if (!token) {
        console.error("❌ `token` が見つかりません！");
        return;
    }

    console.log(`📡 WebSocket に自分のトークンを登録: ${token}`);
    socket.emit("registerPlayer", token);
});

    

    // 🔹 ゲーム開始処理
    socket.on("startGame", () => {
        console.log("🎮 ゲーム開始");
        io.emit("startGame");
    });

    // 🔹 ゲーム終了処理
    socket.on("endGame", () => {
        console.log("🛑 ゲーム終了");
        io.emit("endGame");
    });

    const playerTokens = {}; // 🎯 `token` と `socket.id` を紐付ける
    
    io.on("connection", (socket) => {
        console.log(`✅ プレイヤーが接続: ${socket.id}`);
    
        socket.on("registerPlayer", (token) => {
            console.log(`🎯 プレイヤー登録: Token=${token}`);
            playerTokens[socket.id] = token; // 🎯 WebSocket に `token` を紐づける
        });
    
        // プレイヤー移動
        socket.on("movePlayer", (data) => {
            const token = playerTokens[socket.id]; // 🎯 `token` を取得
            if (!token) {
                console.error("❌ movePlayer() に Token が渡されていません！");
                return;
            }
    
            console.log(`🔄 プレイヤー (Token=${token}) が移動: x=${data.x}, y=${data.y}`);
            io.emit("playerMoved", { token: token, x: data.x, y: data.y });
        });
    
        socket.on("disconnect", () => {
            console.log(`❌ プレイヤーが切断: ${socket.id}`);
            delete playerTokens[socket.id]; // 🎯 切断時に `token` を削除
        });
    });
    

    // 🔹 プレイヤー切断時の処理
    socket.on("disconnect", async () => {
        console.log("❌ プレイヤーが切断しました:", socket.id);

        try {
            const response = await axios.get(LOLLIPOP_API);
            players = response.data.players;
            io.emit("updatePlayers", players); // 切断後のプレイヤーリスト更新
        } catch (error) {
            console.error("❌ `session.php` からのデータ取得エラー:", error.message);
        }
    });
});

// 🔹 ポート設定
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`🚀 WebSocket サーバーが ${PORT} で起動しました`);
});
