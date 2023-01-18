import React, { useState } from 'react';
import './Modal.css';
import ReactDOM from 'react-dom';

const Modal = ({ title, onSubmit, onClose }) => {
    const [userName, setUserName] = useState('');
    const [error, setError] = useState(null)
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        let result = await onSubmit(userName);
        if(result) {
            setError(result);
        }
    };
  
    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content">
                <p>{title}</p>
                {
                    onClose && (
                        <button className="close-button" onClick={onClose}>
                            &times;
                        </button>
                    )

                }
                <form onSubmit={handleSubmit}>
                    <label>
                    Name:
                    <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} />
                    </label>
                    <button className="join-button" type="submit">
                    Confirm
                    </button>
                </form>
                {
                    error && (<p>{error}</p>)
                }
            </div>
        </div>,
        document.body
    );
  };

export default Modal;