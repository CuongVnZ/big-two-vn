// setup protocol for websocket

const setupProtocol = (wss, port, game, rooms) => {
    wss.on('connection', function connection(ws) {
        ws.on('message', function incoming(message) {
            // parse message and determine what action to take
            var data = JSON.parse(message);
            console.log("message", data)
            if (data.action === 'start') {
                try {
                    game.start();
                } catch (error) {
                    ws.send(JSON.stringify({...game.getGameState(), error: error.message}));
                }
            } else if (data.action === 'play') {
                try {
                    game.play(data.player, data.cards);
                } catch (error) {
                    ws.send(JSON.stringify({...game.getGameState(), error: error.message}));
                }
            } else if (data.action === 'pass') {
                try {
                    game.play(data.player, null);
                } catch (error) {
                    ws.send(JSON.stringify({...game.getGameState(), error: error.message}));
                }
            } else if (data.action === 'disconnect') {
                if (game == null) return
                game.removePlayer(data.playerName);
                if (game.players.length === 0) {
                    rooms = rooms.filter(room => room.port !== port);
                    game = null;
                    ws.close();
                }
            } else if (data.action === 'chat') {
                try {
                    game.addChatLog(data.playerName, data.message);
                } catch (error) {
                    ws.send(JSON.stringify({...game.getGameState(), error: error.message}));
                }
            } else if (data.action === 'join') {
                try {
                    // Avoid add player if he refresh the page
                    if (!game.players.find(player => player.name === data.playerName)) {
                        game.addPlayer(data.playerName, ws);
                    } else { // update websocket 
                        game.players.find(player => player.name === data.playerName).ws = ws;
                        game.sendUpdate();
                    }
                } catch (error) {
                    game && game.sendUpdate(error.message);
                }
            }
        });

        // on disconnect
        ws.on('close', function close() {
            console.log('Game', port, 'clients:', wss.clients.size);
            // remove player
            if (game == null) return
            for (let i = 0; i < game.players.length; i++) {
                if (game.players[i].ws === ws) {
                    game.removePlayer(game.players[i].name);
                    break;
                }
            }
            // if no more clients, delete the game
            if (wss.clients.size === 0) {
                rooms = rooms.filter(room => room.port !== port);
                game = null;
            }
        });

        // on connect
        console.log('Game', port, 'clients:', wss.clients.size);
        // send the current game state to the client
        game && game.sendUpdate();
    });

    return wss;
}

module.exports = {setupProtocol};