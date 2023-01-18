import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import './HomePage.css';
import axios from 'axios';
import { useEffect } from 'react';


function HomePage() {
    const [rooms, setRoom] = useState([]);

    const [joinGameModal, setJoinGameModal] = useState(false);
    const [joinClickPort, setJoinClickPort] = useState(8080);

    const [createGameModal, setCreateGameModal] = useState(false);
    
    const navigate = useNavigate();

    const handleJoin = async (userName) => {
        // return if name is invalid or too long
        var message = "Loading..."
        if (userName.length > 10 || userName.length === 0) {
            message = "Invalid name";
        }
        
        await axios.post(`${process.env.REACT_APP_BACKEND}:5000/join-room`, {
            port: joinClickPort,
            playerName: userName,
        })
        .then((response) => {
            console.log(response);
            navigate('/game', { state: { port: joinClickPort, playerName: userName } });
        })
        .catch((error) => {
            console.log(error);
            message = error.response.data.error;
        });
        return message;
    };

    const handleCreate = (userName) => {
        // request localhost:5000/create-game
        // if success, navigate to game page
        // if fail, return error message
        axios.post(`${process.env.REACT_APP_BACKEND}:5000/create-room`, {
            playerName: userName,
        })
        .then((response) => {
            console.log(response);
            navigate('/game', { state: { port: response.data.port, playerName: userName } });
        })
        .catch((error) => {
            console.log(error);
            return error;
        });
    };

    const handleClose = () => {
        setJoinGameModal(false);
        setCreateGameModal(false);
    };

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BACKEND}:5000/get-rooms`)
        .then((response) => {
            console.log(response);
            setRoom(response.data);
        })
        .catch((error) => {
            console.log(error);
        });
    }, []);

    return (
        <div className="home-page">
            <h1>Big Two Game Rooms</h1>
            <button className="create-button" onClick={() => setCreateGameModal(true)}>
                Create room
            </button>
            <div className="game-room-list">
                {
                    rooms.map((room, index) => (
                        <div className="game-room" key={index}>
                            <span className="room-name">Room {room.port}</span>
                            <span className="player-count">{room.players.length}/4 players</span>
                            <span className="game-state">{room.state}</span>
                            {
                                room.state === "waiting" &&
                                <button className="join-button" onClick={() => {
                                        setJoinGameModal(true)
                                        setJoinClickPort(room.port)
                                    }
                                }>
                                    Join
                                </button>
                                
                            }
                        </div>
                    ))
                }
            </div>
            {joinGameModal && <Modal onSubmit={handleJoin} onClose={handleClose} title="Enter your name"/>}
            {createGameModal && <Modal onSubmit={handleCreate} onClose={handleClose} title="Create a new game"/>}
        </div>
    );
}

export default HomePage;