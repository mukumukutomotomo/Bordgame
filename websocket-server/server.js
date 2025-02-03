const corsOptions = {
    origin: ["https://tohru-portfolio.secret.jp"], // ✅ 許可するドメインを指定
    methods: ["GET", "POST"], // ✅ 許可する HTTP メソッド
    allowedHeaders: ["Content-Type"], // ✅ 許可するヘッダー
    credentials: true // ✅ Cookie や認証情報を許可
};

app.use(cors(corsOptions));

const io = socketIo(server, {
    cors: {
        origin: "https://tohru-portfolio.secret.jp", // ✅ WebSocket の CORS 設定
        methods: ["GET", "POST"]
    }
});

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const app = express();
const server = http.createServer(app);

const LOLLIPOP_API = "https://tohru-portfolio.secret.jp/bordgame/game/session.php";
let rooms = {}; // ルームごとのプレイヤーデータ { roomID: { playerID: {...} } }

// 🔹 WebSocket接続時の処理
io.on("connection", async (socket) => {
    console.log(`✅ 新しいプレイヤーが接続: ${socket.id}`);

    socket.handshake.headers["Access-Control-Allow-Origin"] = "https://tohru-portfolio.secret.jp";
    socket.handshake.headers["Access-Control-Allow-Credentials"] = "true";

    // 🎯 クライアントをルームに参加させる
    socket.on("joinRoom", (data) => {
        console.log("📡 joinRoom 受信:", data);
    
        if (!data.room || !data.playerID || !data.mapID) {
            console.error("❌ 無効な joinRoom データ:", data);
            return;
        }
    
        socket.join(data.room);
    
        if (!rooms[data.room]) {
            rooms[data.room] = {};
        }
    
        rooms[data.room][data.playerID] = {
            id: data.playerID,
            username: data.username || `Player${data.playerID}`,
            x: 0,
            y: 0,
            mapID: data.mapID,
            socketId: socket.id,
        };
    
        console.log(`✅ ルーム ${data.room} にプレイヤー ${data.playerID} を登録 (マップ: ${data.mapID})`);
        io.to(data.room).emit("updatePlayers", Object.values(rooms[data.room]));
    });    

    // 🎯 プレイヤーがマップの表示を変更（ただし移動はしない）
    socket.on("viewMap", (data) => {
        if (!data.room || !data.playerID || !data.mapID) {
            console.error("❌ 無効な viewMap データ:", data);
            return;
        }

        console.log(`👀 プレイヤー ${data.playerID} がマップ ${data.mapID} を閲覧`);
        
        // 🎯 指定マップのプレイヤーデータを送信
        const filteredPlayers = Object.values(rooms[data.room]).filter(p => p.mapID === data.mapID);
        socket.emit("updateViewMap", { mapID: data.mapID, players: filteredPlayers });
    });

    // 🎯 プレイヤー移動処理
    socket.on("movePlayer", (data) => {
        if (!data.room || !data.playerID || !rooms[data.room] || !rooms[data.room][data.playerID]) {
            console.error("❌ movePlayer に無効なデータ:", data);
            return;
        }
        let player = rooms[data.room][data.playerID];
        player.x = data.x;
        player.y = data.y;

        console.log(`🔄 ルーム ${data.room} - プレイヤー ${data.playerID} 移動: x=${data.x}, y=${data.y}`);
        io.to(data.room).emit("playerMoved", { id: data.playerID, x: data.x, y: data.y });

        // 🎯 データベースに移動後の座標を保存
        axios.post("https://tohru-portfolio.secret.jp/bordgame/game/update_position.php", new URLSearchParams({
            token: data.token,
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
        if (!data.room) {
            console.error("❌ ルームIDが指定されていません");
            return;
        }

        console.log(`🎮 ルーム ${data.room} でゲーム開始`);

        try {
            const response = await axios.get(`${LOLLIPOP_API}?room=${data.room}&token=SERVER_ADMIN_TOKEN`);

            if (response.data.success) {
                rooms[data.room] = response.data.players.reduce((acc, player) => {
                    acc[player.id] = { ...player, socketId: null };
                    return acc;
                }, {});

                console.log(`✅ ルーム ${data.room} の最新プレイヤーリスト更新`);
                io.to(data.room).emit("updatePlayers", { roomID: data.room, players: Object.values(rooms[data.room]) });
                io.to(data.room).emit("startGame");
            } else {
                console.error(`❌ ルーム ${data.room} のプレイヤーデータ取得失敗:`, response.data.error);
            }
        } catch (error) {
            console.error(`❌ session.php データ取得エラー:`, error.message);
        }
    });

    // 🎯 カード取得処理
    socket.on("receiveCard", async (data) => {
        if (!data.room || !data.playerID || !data.card) {
            console.error("❌ receiveCard のデータが不正:", data);
            return;
        }

        console.log(`🎴 プレイヤー ${data.playerID} が ${data.cardName} を取得 (ポイント: ${data.points})`);
        io.to(data.room).emit("cardReceived", {
            playerID: data.playerID,
            card: data.card,
            cardName: data.cardName,
            points: data.points
        });
    });

    // 🎯 勝者決定処理
    socket.on("declareWinner", (data) => {
        if (!data.room || !data.winnerId || !rooms[data.room]) {
            console.error("❌ 無効な勝利通知:", data);
            return;
        }

        console.log(`🏆 ルーム ${data.room} でプレイヤー ${data.winnerId} が勝利`);
        io.to(data.room).emit("gameOver", { winnerId: data.winnerId });

        delete rooms[data.room];
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
