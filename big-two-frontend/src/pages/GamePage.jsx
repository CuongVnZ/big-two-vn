import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './GamePage.css';
import example from './example.json';

var W3CWebSocket = require('websocket').w3cwebsocket;

const GamePage = () => {
    const [webSocket, setWebSocket] = useState(example);
    const [error, setError] = useState("Error");

    
    const [gameState, setGameState] = useState(null);
    const [playerData, setPlayerData] = useState(null);
    const [sortedCards, setSortedCards] = useState(false); 
    const [selectedCards, setSelectedCards] = useState([]);

    const location = useLocation();
    const navigate = useNavigate();
    
    const rankValues = {
        3: 3,
        4: 4,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        9: 9,
        10: 10,
        J: 11,
        Q: 12,
        K: 13,
        A: 14,
        2: 15,
        'black joker': 16,
        'red joker': 17
    };
    const suitValues = {
        spades: 1,
        clubs: 2,
        diamonds: 3,
        hearts: 4,
    };

    useEffect(() => {
        if (location.state == null) return 

        // Get the port and player name from the location state
        const { port, playerName } = location.state;

        // Connect to the WebSocket server
        const ws = new W3CWebSocket(`${process.env.REACT_APP_WEBSOCKET}:${port}`);


        // on connect message log
        ws.onopen = () => {
            console.log("Connected to server");
            // send back the player name to the server
            ws.send(JSON.stringify({ action: "join", playerName: playerName }));
        };

        // on close message log
        ws.onclose = () => {
            console.log("Disconnected from server");
            navigate('/'); // go back to home page
            window.location.reload(false);
        };      

        // Set up the WebSocket event handlers
        ws.onmessage = (event) => {
            // Update the game state when a message is received from the server
            console.log(JSON.parse(event.data))
            var data = JSON.parse(event.data);
            if (data.error) {
                setError(data.error);
            } else {
                // Find the player's index in the players array
                const player = data.players.find((player) => player.name === playerName);
                const playerIndex = data.players.indexOf(player);
                setPlayerData({...player, index: playerIndex});
                // Update the game state

                setGameState(data);
                setError(null);

                // Scroll to the bottom of the chat logs
                const chatMessages = document.getElementsByClassName("chat-messages");
                // console.log(chatMessages)
                if (chatMessages.length > 0) {
                    chatMessages[0].scrollTop = chatMessages[0].scrollHeight;
                }
            }
        };      

        setWebSocket(ws);

        return () => {
            // Disconnect from the WebSocket server when the component unmounts
            // This is important to prevent memory leaks
            // Does not need to close if no connection was made
            console.log("HA")
            if (ws && ws.readyState === ws.OPEN) {
                // Send message to remove player from game before closing
                ws.send(JSON.stringify({
                    action: "disconnect",
                    playerName: playerName
                }));
                setWebSocket(null)
                ws.close();
                console.log("YO")
            }
        };
    }, [location, navigate]);

    // Toggle the selected state of a card
    const toggleCardSelected = (cardIndex) => {
        if (selectedCards.includes(cardIndex)) {
            setSelectedCards(selectedCards.filter((index) => index !== cardIndex));
        } else {
            setSelectedCards([...selectedCards, cardIndex]);
        }
    };

    // Toggle sort
    const toggleSort = () => {
        if (sortedCards) {
            setSortedCards(false)
        } else {
            setSortedCards(true)
        }
    };

    // Sort the cards in the player's hand
    const sortCards = () => {
        const newSorted = playerData.hand.sort((a, b) => {
            if (rankValues[a.rank] === rankValues[b.rank]) {
                return suitValues[a.suit] - suitValues[b.suit];
            } else {
                return rankValues[a.rank] - rankValues[b.rank];
            }
        });
        return newSorted.map((card, index) => (
            <div className={`card ${selectedCards.includes(index) ? 'card-selected' : ''}`} onClick={() => toggleCardSelected(index)}>
                <img src={`/images/origin/${card.suit}_${card.rank}.png`} alt={`${card.rank} of ${card.suit}`} />
            </div>
        ))
    };

    // Handle chat message submission
    const handleChatSubmit = (event) => {
        event.preventDefault();
        const chatInput = document.getElementById("chat-input");
        const message = chatInput.value;
        console.log(message)
        if (message) {
            webSocket.send(JSON.stringify({
                action: "chat",
                playerName: playerData.name,
                message: message
            }));
            chatInput.value = "";
        }
    };

    // Render the game state if it has been received, or a loading message if it has not
    if (gameState && location.state) {
        return (
        <div className="game-page">
            {/* Render the game board only state = playing*/}
            <div className="left-side">
            {gameState.state === "playing" && 
                <div className="left-side-container">
                    {/* Render the board */}
                    <div className="board">
                        <div className="board-header"> 
                            <h2>Board ({playerData.name})</h2>
                            <p style={{color: "red"}}>{error}</p>
                            <p>Current turn: {gameState.players[gameState.currentPlayer].name}</p>
                        </div>
                        {gameState.board[gameState.board.length-1] &&
                            <div className="board-row" key={gameState.board[gameState.board.length-1]}>
                                {gameState.board[gameState.board.length-1].map((card, cardIndex) => (
                                    <div className="board-cell" key={cardIndex}>
                                        <img src={`/images/origin/${card.suit}_${card.rank}.png`} alt={`${card.rank} of ${card.suit}`} />
                                    </div>
                                ))}
                            </div>
                        }
                    </div>

                    {/* Render the player hand */}
                    <div className="player-hand">
                        <div className="player-hand-header">
                            <h2>Your hand: {gameState.players[playerData.index].hand.length}</h2>
                            <button onClick={() => {
                                // Send the selected cards to the server
                                if (webSocket.readyState === webSocket.OPEN && gameState.currentPlayer === playerData.index) {
                                    webSocket.send(JSON.stringify({
                                        action: 'pass',
                                        player: playerData.index,
                                    }));
                                    console.log("SENT PASS")
                                }
                            }}>Pass</button>

                            <button onClick={() => {
                                // Send the selected cards to the server
                                if (selectedCards.length > 0 && webSocket.readyState === webSocket.OPEN && gameState.currentPlayer === playerData.index) {
                                    webSocket.send(JSON.stringify({
                                        action: 'play',
                                        player: playerData.index,
                                        cards: selectedCards.map((index) => playerData.hand[index])
                                    }));
                                    console.log("SENT PLAY")
                                }
                                // Clear the selected cards
                                setSelectedCards([]);
                            }}>Play cards</button>

                            <button onClick={toggleSort}>Sort cards</button>

                        </div>
                        <div className="player-hand-cards">
                            {
                            sortedCards && sortCards()
                            }
                            {
                            !sortedCards && playerData.hand.map((card, index) => (
                                <div className={`card ${selectedCards.includes(index) ? 'card-selected' : ''}`} key={index} onClick={() => toggleCardSelected(index)}>
                                    <img src={`/images/origin/${card.suit}_${card.rank}.png`} alt={`${card.rank} of ${card.suit}`} />
                                </div>
                            ))
                            }
                        </div>
                </div>
                </div>
            }
            {
                // Check if player is host
                // If player is host, display start game button
                // If player is not host, display waiting for host to start game
                
                playerData.index === 0 && gameState.state === "waiting" &&
                <>
                    <button onClick={() => {
                        // Send the selected cards to the server
                        if (webSocket.readyState === webSocket.OPEN) {
                            webSocket.send(JSON.stringify({
                                action: 'start',
                                player: playerData.name,
                            }));
                            console.log("SENT START GAME")
                        }
                    }}>Start game</button>

                </>

            }
            {gameState.state === "waiting" && <p>Waiting for players...</p>}
            </div>

            {/* Render the player list */}
            <div className="right-side">
                <div className="right-side-container">
                    {/* Players list */}
                    <div className="player-list">
                        <div className="player-list-header">
                            <h2>Room {gameState.port} ({gameState.players.length}/4)</h2>
                            <button onClick={() => {
                                navigate("/");
                            }}>Leave</button>
                        </div>
                        {gameState.players.map((player, index) => (
                            <div className="player" key={player.name}>
                                {index === 0 && "(Host)"} {player.name}: {player.hand.length}
                            </div>
                        ))}
                    </div>

                    {/* Chat component bottom */}
                    <div className="chat">
                        <div className="chat-header">
                            <h2>Chat</h2>
                        </div>
                        <div className="chat-messages">
                            {/* List game chat logs */}
                            {gameState.chatLog.map((data, index) => (
                                <div className="chat-message" key={index}>
                                    <span className="chat-message-name" title={data.date}>{data.playerName}:</span>
                                    <span className="chat-message-text">{data.message}</span>
                                </div>
                            ))}
                        </div>
                        <div className="chat-input">
                            <form>                            
                                <input type="text" id="chat-input" placeholder="Type a message..."/>
                                <button onClick={handleChatSubmit} type="submit">Send</button>
                            </form>
                        </div>
                    </div>
                </div> 
            </div>
        </div>
        );
    } else {
        return <p>Loading game state...</p>;
    }
};

export default GamePage;