const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let tokens = {};
let currentMap = ""; // Здесь сервер будет хранить текущую карту в виде текста (Base64)

app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

io.on('connection', (socket) => {
    // Отправляем зашедшему игроку все фишки
    socket.emit('init-tokens', tokens);
    
    // Если карта уже загружена кем-то, отправляем её новому игроку
    if (currentMap) {
        socket.emit('update-map', currentMap);
    }

    // Слушаем изменение карты
    socket.on('change-map', (mapDataUrl) => {
        currentMap = mapDataUrl; // Запоминаем на сервере
        socket.broadcast.emit('update-map', mapDataUrl); // Пересылаем всем остальным
    });

    socket.on('create-token', (tokenData) => {
        tokens[tokenData.id] = tokenData;
        io.emit('token-created', tokenData);
    });

    socket.on('move-token', (moveData) => {
        if (tokens[moveData.id]) {
            tokens[moveData.id].top = moveData.top;
            tokens[moveData.id].left = moveData.left;
            socket.broadcast.emit('token-moved', moveData);
        }
    });

    socket.on('delete-token', (tokenId) => {
        if (tokens[tokenId]) {
            delete tokens[tokenId];
            io.emit('token-deleted', tokenId);
        }
    });

    socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
