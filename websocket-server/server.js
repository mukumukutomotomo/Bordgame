const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mysql = require("mysql2");

// Express サーバーの設定
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// データベース接続
const db = mysql.createConnection({
    host: "mysql312.phy.lolipop.lan",
    user: "LAA1538186",
    password: "altair",
    database: "LAA1538186-login"
});

db.connect(err => {
    if (err) {
        console.error("データベース接続エラー: " + err);
    } else {
        console.log("データベース接続成功");
    }
});

// プレイヤーデータをクライアントに送る
io.on("connection", (socket) => {
    console.log("新しいプレイヤーが接続しました:", socket.id);

    // クライアントに最新のプレイヤーデータを送信
    sendPlayerData(socket);

    // プレイヤーが移動したときの処理
    socket.on("movePlayer", (data) => {
        const { id, x, y } = data;
        console.log(`プレイヤー ${id} が移動: x=${x}, y=${y}`);

        // データベースを更新
        db.query("UPDATE board SET x = ?, y = ? WHERE id = ?", [x, y, id], (err) => {
            if (err) {
                console.error("位置更新エラー:", err);
                return;
            }
            // すべてのクライアントに更新情報を送信
            io.emit("playerMoved", { id, x, y });
        });
    });

    // クライアント切断時の処理
    socket.on("disconnect", () => {
        console.log("プレイヤーが切断しました:", socket.id);
    });
});

// すべてのプレイヤーデータを取得し、送信
function sendPlayerData(socket) {
    db.query("SELECT id, username, x, y FROM board", (err, results) => {
        if (err) {
            console.error("データ取得エラー:", err);
            return;
        }
        socket.emit("playersData", results);
    });
}

// サーバーを起動
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`WebSocketサーバーが http://localhost:${PORT} で起動しました`);
});
