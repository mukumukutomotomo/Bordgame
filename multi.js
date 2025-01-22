const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

// 静的ファイルを提供（index.html, main.js, main.css, multi.js）
app.use(express.static(__dirname));

// プレイヤーの状態を管理
let players = {};

// WebSocket の接続処理
io.on("connection", (socket) => {
    console.log(`プレイヤー接続: ${socket.id}`);

    // 新規プレイヤーを players に追加
    players[socket.id] = { x: 0, y: 0 };

    // 全員にプレイヤーリストを送信
    io.emit("updatePlayers", players);

    // プレイヤー移動処理
    socket.on("move", (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
        }
        io.emit("updatePlayers", players);
    });

    // プレイヤー切断処理
    socket.on("disconnect", () => {
        console.log(`プレイヤー切断: ${socket.id}`);
        delete players[socket.id];
        io.emit("updatePlayers", players);
    });
});

// サーバー起動
server.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
});
