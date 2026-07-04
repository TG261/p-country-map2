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

// Хранилище для фишек в оперативной памяти сервера
let tokens = {};

// Отдаем статические файлы (наш интерфейс)
app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Логика работы мультиплеера
io.on('connection', (socket) => {
    // Отправляем новому игроку все текущие фишки на карте
    socket.emit('init-tokens', tokens);

    // Кто-то создал новую фишку
    socket.on('create-token', (tokenData) => {
        tokens[tokenData.id] = tokenData;
        io.emit('token-created', tokenData);
    });

    // Кто-то передвинул фишку
    socket.on('move-token', (moveData) => {
        if (tokens[moveData.id]) {
            tokens[moveData.id].top = moveData.top;
            tokens[moveData.id].left = moveData.left;
            // Пересылаем новые координаты всем остальным игрокам
            socket.broadcast.emit('token-moved', moveData);
        }
    });

    // Кто-то удалил фишку
    socket.on('delete-token', (tokenId) => {
        if (tokens[tokenId]) {
            delete tokens[tokenId];
            io.emit('token-deleted', tokenId);
        }
    });

    socket.on('disconnect', () => {
        // Игрок отключился, фишки сохраняются на сервере
    });
});

// Порт для Vercel или локального запуска
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
