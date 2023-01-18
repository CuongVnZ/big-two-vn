const express = require('express');
const app = express();
const Game = require('./game/Game');
const WebSocket = require('ws');
const cors = require('cors');
const { setupProtocol } = require('./protocol');

app.use(cors())
app.use(express.json());

let rooms = [];

app.post('/create-room', (req, res) => {
    // random port between 1000 and 9999
    var port = Math.floor(Math.random() * 9000) + 1000;
    var wss = new WebSocket.Server({ port: port });
    console.log(`Listening on port ${wss.options.port}`);

    var game = new Game([], wss, port);

    setupProtocol(wss, port, game, rooms)

    // add game to room list
    var room = {
        game: game,
        websocket: wss,
        port: port
    }
    rooms.push(room);
    res.send(room);
});

// join room
app.post('/join-room', (req, res) => {
    const { port, playerName } = req.body;
    var room = rooms.find(room => room.port === port);
    if (!room) {
        res.status(400).send({ error: 'Room not found' });
        return;
    // check if game is full
    } 
    if (room.game.players.length === 4) {
        res.status(400).send({ error: 'Room is full' });
        return;
    }
    // check name taken
    if (room.game.players.find(player => player.name === playerName)) {
        // throw new Error('Name taken') // Express will catch this on its own.
        res.status(400).send({ error: 'Name taken' });
        return;
    }
    res.send({port: port});
});

app.get("/get-rooms", (req, res) => {
    // Return list of games but except the game variable
    res.send(rooms.map(room => {
        return {
            id: room.id,
            players: room.game.players,
            port: room.port,
            state: room.game.state
        }
    }));
});

// render home page
app.get("/", (req, res) => {
    res.send("index");
});

app.listen(process.env.PORT || 5000, () => {
    console.log('Server listening on port', process.env.PORT || 5000);
});