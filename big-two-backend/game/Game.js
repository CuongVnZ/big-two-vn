const Player = require('./Player');
const Deck = require('./Deck');
const WebSocket = require('ws');

let wss;

class Game {
    constructor(players, websocket, port) {
        console.log(players)
        this.players = players.map(player => new Player(player));
        this.deck = new Deck();
        this.board = [];
        this.chatLog = [{
            playerName: 'System',
            message: 'Game created!'
        }];

        this.currentPlayer = 0;
        this.lastPlayer = 0;

        this.state = 'waiting';

        this.host = null;
        this.lastWinner = null;
        
        this.port = port;
        this.sound = 'none';
        
        wss = websocket;
    }

    addPlayer(name, ws) {
        this.players.push(new Player(name, ws));
        // add chat log
        this.chatLog.push({playerName: 'System', message: name + ' joined the game!'});
        this.sendUpdate();
        // return the new player's index
        return this.players.length - 1;
    }

    removePlayer(name) {
        this.players = this.players.filter(player => player.name !== name);
        // if there are no players left, close the game
        if (this.players.length === 0) {
            wss.close();
            // Log the console
            console.log('Game', this.port,'closed');
        }
        // add chat log
        this.chatLog.push({playerName: 'System', message: name + ' left the game!'});
        // if only one player is left, end the game
        if (this.players.length === 1 && this.state === 'playing') {
            this.end(this.players[0].name);
        }
        // send the updated game state to all clients
        this.sendUpdate();
    }

    addChatLog(playerName, message) {
        this.chatLog.push({
            date: new Date(),
            playerName, 
            message
        });
        this.sendUpdate();
    }

    start() {
        // cannot start a game with less than 2 players
        if (this.players.length < 2) {
            throw new Error('Cannot start a game with less than 2 players');
        }
        this.state = 'playing';
        this.deck.createDeck();
        this.deck.shuffle();
        for (const player of this.players) {
            player.hand = this.deck.deal(13);
        }
        this.board = [];
        this.currentPlayer = this.getFirstPlayer();
        // add chat log
        this.chatLog.push({playerName: 'System', message: '[Game started!]'});
        this.sendUpdate();
    }

    play(player, cards) {
        if (cards != undefined) { // if the player passes, do not check if it is their turn
            if (player !== this.currentPlayer) {
                throw new Error('It is not your turn');
            }
            var currentTurnCards = this.board[this.board.length - 1];

            if (this.currentPlayer === this.lastPlayer) { // if it is the first turn
                currentTurnCards = undefined; // if it is the first turn, there is no previous turn
            }

            if (!this.players[player].isValidPlay(cards, currentTurnCards)) { // if the player's play is invalid
                throw new Error('Invalid play');
            } 
            this.board.push(cards);
            this.players[player].removeCard(cards);
            this.lastPlayer = this.currentPlayer;

            
            if (this.players[player].hand.length === 0) { // if the player has no cards left
                this.players[player].score++;
                this.end(this.players[player].name);
            } else {
                // add chat log about new turn
                this.chatLog.push({playerName: 'System', message: `[${this.players[this.currentPlayer].name} played]`});
            }
        } else {
            if (this.currentPlayer === this.lastPlayer) { // if it is the first turn
                throw new Error('Cannot pass on first turn');
            }
            // add chat log
            this.chatLog.push({playerName: this.players[player].name, message: '[passed]'});
        }

        this.currentPlayer = (this.currentPlayer + 1) % this.players.length; // next player's turn
        this.sendUpdate();
    }

    end(winnerName) {
        this.state = 'waiting';
        var winnerId = this.players.findIndex(player => player.name === winnerName)
        this.lastWinner = winnerId;
        // add chat log winner
        this.chatLog.push({playerName: 'System', message: `[${winnerName} won the game!]`});

        this.sendUpdate();

        // return to waiting state after 3 seconds
        // setTimeout(() => {
        //     this.start();
        //     this.sendUpdate();
        // }, 3000);
    }

    getFirstPlayer() {
        if (this.lastWinner != undefined) return this.lastWinner
        let firstPlayer = 0;
        for (let i = 1; i < this.players.length; i++) {
            if (this.players[i].hand.some(card => (card.rank === '3') && (card.suit === 'clubs'))) { // if player has 3 of spades
                firstPlayer = i;
            }
        }
        return firstPlayer;
    }

    sendUpdate(message) {
        // send game state to all clients
        this.players.forEach((player, index) => {
            var client = player.ws;
            if (client.readyState === WebSocket.OPEN) {
                var gameState = this.getGameState();
                // Hide other players' hands
                gameState.players.forEach(player => {
                    player.hand = player.hand.map(card => {
                        return {}
                    });
                });
                gameState.players[index].hand = this.players[index].hand;

                // send game state to client
                client.send(JSON.stringify({...gameState, error: message}));
            }
        });
    }

    getGameState() {
        // Avoid websocket in players
        // Clone players array
        var playersClone = []
        this.players.forEach(player => {
            playersClone.push({
                name: player.name,
                hand: player.hand,
                score: player.score
            });
        });
        // Clone game object
        var gameClone = {...this};

        // Replace players array with playersClone
        gameClone.players = playersClone;
        return gameClone;
    }
}

module.exports = Game;