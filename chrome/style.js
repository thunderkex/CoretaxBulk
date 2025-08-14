.download-panel {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 10000;
    background-color: #1a3c5e;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.download-btn, .select-all-btn, .filter-btn {
    background-color: #1a3c5e;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.download-btn:hover, .select-all-btn:hover, .filter-btn:hover {
    background-color: #15324b;
}

.progress-bar {
    width: 200px;
    height: 10px;
    background-color: #ddd;
    border-radius: 5px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background-color: #28a745;
    width: 0;
    transition: width 0.3s ease;
}

.filter-modal, .summary-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.filter-modal-content, .summary-modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
    text-align: center;
}

.filter-modal-content input {
    width: 100%;
    padding: 5px;
    margin: 5px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.filter-modal-content button, .summary-modal-content button {
    background-color: #1a3c5e;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    margin: 5px;
}

.filter-modal-content button:hover, .summary-modal-content button:hover {
    background-color: #15324b;
}