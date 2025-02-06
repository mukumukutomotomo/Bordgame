const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const axios = require("axios");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const corsOptions = {
    origin: ["https://tohru-portfolio.secret.jp"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
};

// ✅ `app` を定義した後に `cors` を適用
app.use(cors(corsOptions));

const io = socketIo(server, {
    cors: {
        origin: "https://tohru-portfolio.secret.jp",
        methods: ["GET", "POST"]
    }
});

const LOLLIPOP_API = "https://tohru-portfolio.secret.jp/bordgame/game/session.php";
let rooms = {}; // ルームごとのプレイヤーデータ { roomID: { playerID: {...} } }

// 🔹 プレイヤーがサーバーに接続
io.on("connection", async (socket) => {
    console.log(`✅ 新しいプレイヤーが接続: ${socket.id}`);

    socket.handshake.headers["Access-Control-Allow-Origin"] = "https://tohru-portfolio.secret.jp";
    socket.handshake.headers["Access-Control-Allow-Credentials"] = "true";

    // 🎯 クライアントをルームに参加させる
socket.on("joinRoom", (data) => {
    console.log("📡 joinRoom 受信:", data);
    
    if (!data.room || !data.playerID) {
        console.error("❌ joinRoom に無効なデータ:", data);
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

    console.log("✅ 現在の rooms:", JSON.stringify(rooms, null, 2));
    io.to(data.room).emit("updatePlayers", {
        roomID: data.room,
        players: Object.values(rooms[data.room])
    });
});
const TURN_DURATION = 60000; // 60秒
// 🎮 ゲームスタート時に最初のターンを開始
socket.on("startGame", async (data) => {
    const { room } = data;
    if (!room) {
        console.error("❌ ルームIDが指定されていません");
        return;
    }

    console.log(`🎮 ルーム ${room} でゲーム開始`);

    try {
        const response = await axios.get(`https://tohru-portfolio.secret.jp/bordgame/game/session.php?room=${room}&token=SERVER_ADMIN_TOKEN`);
        if (response.data.success) {
            rooms[room] = { // 🎯 session.php のデータ取得成功後にルームを初期化
                players: {},
                turn: 0,
                active: true,
                timer: null,
            };
            response.data.players.forEach(player => {
                rooms[room].players[player.id] = {
                    hasRolledDice: false,
                    username: player.username,
                };
            });

            console.log(`✅ ルーム ${room} のプレイヤーリスト:`, rooms[room].players);
            io.to(room).emit("startGame", { roomID: room });
            startNewTurn(room);
        }
    } catch (error) {
        console.error(`❌ session.php データ取得エラー:`, error.message);
    }
});


// 🎯 新しいターンの開始
function startNewTurn(room) {
    console.log(`🔍 startNewTurn 実行: ルーム = ${room}`);

    // 🎯 ルームの存在チェック
    if (!rooms[room]) {
        console.error(`❌ ルーム ${room} が見つかりません！`);
        return;
    }

    // 🎯 `players` が undefined ならログを出力（復旧処理はしない）
    if (!rooms[room].players) {
        console.error(`❌ ルーム ${room} の players が undefined です`);
    }

    console.log(`✅ ルーム ${room} の現在の状態:`, JSON.stringify(rooms[room], null, 2));

    rooms[room].turn++;
    Object.keys(rooms[room].players).forEach(playerID => {
        rooms[room].players[playerID].hasRolledDice = false;
    });

    console.log(`🔄 ルーム ${room} のターン ${rooms[room].turn} 開始 - startTurn を送信`);
    io.to(room).emit("startTurn", { turn: rooms[room].turn });

    rooms[room].timer = setTimeout(() => {
        endTurn(room);
    }, TURN_DURATION);
}



// 🎲 サイコロを振る処理
socket.on("rollDice", (data) => {
    const { room, playerID } = data;
    
    if (!rooms[room] || !rooms[room].players[playerID]) {
        console.error(`❌ ルーム ${room} にプレイヤー ${playerID} が見つかりません`);
        return;
    }

    if (rooms[room].players[playerID].hasRolledDice) {
        socket.emit("rollDenied", { reason: "このターンではもうサイコロを振れません" });
        return;
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    rooms[room].players[playerID].hasRolledDice = true;

    console.log(`🎲 プレイヤー ${playerID} が ${diceRoll} を出しました`);

    io.to(room).emit("diceRolled", { playerID, roll: diceRoll });
    // すべてのプレイヤーがサイコロを振ったらターン終了
    if (Object.values(rooms[room].players).every(p => p.hasRolledDice)) {
        clearTimeout(rooms[room].timer);
        endTurn(room);
    }
});

// 🎯 ターン終了処理
function endTurn(room) {
    if (!rooms[room]) {
        console.error(`❌ endTurn 実行時にルーム ${room} が見つかりません`);
        return;
    }

    console.log(`🔍 endTurn 実行: ルーム ${room} の状態:`, JSON.stringify(rooms[room], null, 2));

    console.log(`🛑 ルーム ${room} のターン ${rooms[room].turn} 終了`);
    io.to(room).emit("endTurn", { turn: rooms[room].turn });

    // 🎯 5秒後に確実に次のターンを開始
    setTimeout(() => {
        console.log(`🔄 次のターンを開始`);
        startNewTurn(room);
    }, 5000); // 🔄 5秒待ってから次のターン開始
}




// 🎯マップ切り替え
socket.on("viewMap", async (data) => {
    if (!data.room || !data.playerID || !data.mapID) {
        console.error("❌ 無効な viewMap データ:", data);
        return;
    }
    console.log(`👀 プレイヤー ${data.playerID} がマップ ${data.mapID} を閲覧`);
    try {
        console.log("📌 送信する token:", data.token);
        const response = await axios.post(`https://tohru-portfolio.secret.jp/bordgame/game/session.php?room=${data.room}`, 
            new URLSearchParams({ token: data.token }).toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        if (!response.data.success) {
            console.error("❌ session.php からのデータ取得に失敗:", response.data.error);
            return;
        }
        if (!rooms[data.room]) {
            rooms[data.room] = { players: {} }; // ルームが未定義なら新しく作成
        }
        
        response.data.players.forEach(player => {
            if (!rooms[data.room].players[player.id]) {
                rooms[data.room].players[player.id] = {}; // 🎯 既存データがある場合は保持
            }
        
            rooms[data.room].players[player.id].id = player.id;
            rooms[data.room].players[player.id].username = player.username;
            rooms[data.room].players[player.id].x = player.x;
            rooms[data.room].players[player.id].y = player.y;
            rooms[data.room].players[player.id].mapID = player.mapID;
            rooms[data.room].players[player.id].socketId = rooms[data.room].players[player.id].socketId || null; // 既存の socketId を保持
        });
        
        console.log(`✅ サーバーの rooms[${data.room}] を最新データに統合:`, rooms[data.room]);
        

        console.log(`✅ サーバーの rooms[${data.room}] を最新データに更新`, rooms[data.room]);

        // 🎯 指定マップのプレイヤーデータを送信
        const filteredPlayers = Object.values(rooms[data.room]).filter(p => p.mapID === data.mapID);
        socket.emit("updateViewMap", { mapID: data.mapID, players: filteredPlayers });

    } catch (error) {
        console.error("❌ session.php 取得エラー:", error.message);
    }
});
socket.on("playerWarped", (data) => {
    console.log(`🔄 プレイヤー ${data.playerID} が ${data.newMapID} にワープ`);

    // **ルーム全体にプレイヤーのワープを通知**
    io.to(data.room).emit("playerWarped", {
        playerID: data.playerID,
        newMapID: data.newMapID
    });
});

// 🎯 プレイヤー移動処理
socket.on("movePlayer", async (data) => {
    console.log("📡 movePlayer 受信:", data);

    if (!rooms[data.room] || !rooms[data.room][data.id]) {
        console.warn(`⚠️ rooms にプレイヤー ${data.id} が存在しません。session.php から再取得を試みます`);

        try {
            const response = await axios.post(`https://tohru-portfolio.secret.jp/bordgame/game/session.php?room=${data.room}`, 
                new URLSearchParams({ token: data.token }).toString(), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            if (!response.data.success) {
                console.error("❌ session.php からのデータ取得に失敗:", response.data.error);
                return;
            }

            if (!rooms[data.room]) {
                rooms[data.room] = { players: {} }; // 新しくルームを作成する場合
            }
            
            if (!rooms[data.room].players) {
                rooms[data.room].players = {}; // もし `players` が消えていたら空のオブジェクトにする
            }
            
            response.data.players.forEach(player => {
                if (!rooms[data.room].players[player.id]) {
                    rooms[data.room].players[player.id] = {}; // 既存データを保持する
                }
            
                rooms[data.room].players[player.id].id = player.id;
                rooms[data.room].players[player.id].username = player.username;
                rooms[data.room].players[player.id].x = player.x;
                rooms[data.room].players[player.id].y = player.y;
                rooms[data.room].players[player.id].mapID = player.mapID;
                rooms[data.room].players[player.id].socketId = rooms[data.room].players[player.id].socketId || null; // 既存の socketId を維持
            });
            
            console.log(`✅ サーバーの rooms[${data.room}] を最新データに統合:`, JSON.stringify(rooms[data.room], null, 2));
            
            console.log(`✅ サーバーの rooms[${data.room}] を最新データに更新:`, rooms[data.room]);

            // 🔹 再取得後に `movePlayer` の処理を続ける
        } catch (error) {
            console.error("❌ session.php 取得エラー:", error.message);
            return;
        }
    }

    // ✅ `rooms` にプレイヤーが登録されているはず
    let player = rooms[data.room][data.id];
    if (!player) {
        console.error(`❌ movePlayer の処理継続失敗: プレイヤー ${data.id} が rooms に存在しません`);
        return;
    }

    player.x = data.x;
    player.y = data.y;
    player.mapID = data.mapID;

    console.log(`🔄 ルーム ${data.room} - プレイヤー ${data.id} 移動: x=${data.x}, y=${data.y}, mapID=${data.mapID}`);

    // 🎯 WebSocket でクライアントに通知（mapID も含める）
    io.to(data.room).emit("playerMoved", { 
        id: data.id, 
        x: data.x, 
        y: data.y, 
        mapID: data.mapID
    });

    // 🎯 データベースに移動後の座標と mapID を保存
    axios.post("https://tohru-portfolio.secret.jp/bordgame/game/update_position.php", new URLSearchParams({
        token: data.token,
        x: data.x,
        y: data.y,
        mapID: data.mapID,
        room: data.room
    }).toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
    }).then(response => {
        if (!response.data.success) {
            console.error("❌ データベース更新失敗:", response.data.error);
        } else {
            console.log("✅ データベースにプレイヤー座標とマップIDを保存:", response.data);
        }
    }).catch(error => console.error("❌ update_position.php 取得エラー:", error));
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
        // 🎯 `rooms[roomID]` の存在チェック
        if (!rooms[roomID] || !rooms[roomID].players) {
            console.warn(`⚠️ ルーム ${roomID} が存在しない、または players が未定義`);
            return;
        }

        const playerID = Object.keys(rooms[roomID].players).find(id => rooms[roomID].players[id].socketId === socket.id);
        
        if (playerID) {
            console.log(`🗑️ ルーム ${roomID} からプレイヤー ${playerID} を削除`);
            delete rooms[roomID].players[playerID];

            // 🎯 ルームが空になったら削除
            if (Object.keys(rooms[roomID].players).length === 0) {
                console.log(`🗑️ ルーム ${roomID} を削除`);
                delete rooms[roomID];
            }
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
