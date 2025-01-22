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

// CORSを有効化
app.use(cors());

// ロリポップの `session.php` のURL
const LOLLIPOP_API = "https://tohru-portfolio.secret.jp/bordgame/game/session.php"; 

// WebSocket接続処理
io.on("connection", async (socket) => {
    console.log("新しいプレイヤーが接続しました:", socket.id);

    try {
        // ロリポップの `session.php` からデータを取得
        const response = await axios.get(LOLLIPOP_API, { withCredentials: true });

        // 取得したプレイヤーデータをクライアントに送信
        socket.emit("playersData", response.data);
    } catch (error) {
        console.error("データ取得エラー:", error.message);
    }

    // プレイヤー移動処理
    socket.on("movePlayer", async (data) => {
        console.log(`プレイヤー ${data.id} が移動: x=${data.x}, y=${data.y}`);

        try {
            // ロリポップの `update_position.php` にデータを送信
            await axios.post("https://tohru-portfolio.secret.jp/bordgame/game/update_position.php", data);
            io.emit("playerMoved", data);
        } catch (error) {
            console.error("位置更新エラー:", error.message);
        }
    });

    // 切断処理
    socket.on("disconnect", () => {
        console.log("プレイヤーが切断しました:", socket.id);
    });
});

// ポート設定
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`WebSocket サーバーが ${PORT} で起動しました`);
});
