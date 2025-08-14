const state = {
    settings: {
        parallelDownloads: 5,
        downloadDelay: 650
    },
    history: []
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeState();
        setupEventListeners();
        updateUI();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize. Please try again.');
    }
});

async function initializeState() {
    const result = await chrome.storage.local.get(['parallelDownloads', 'downloadDelay', 'downloadHistory']);
    state.settings.parallelDownloads = result.parallelDownloads || 5;
    state.settings.downloadDelay = result.downloadDelay || 650;
    state.history = result.downloadHistory || [];
}

function setupEventListeners() {
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    document.getElementById('parallelDownloads').addEventListener('change', validateInput);
    document.getElementById('downloadDelay').addEventListener('change', validateInput);
}

function updateUI() {
    document.getElementById('parallelDownloads').value = state.settings.parallelDownloads;
    document.getElementById('downloadDelay').value = state.settings.downloadDelay;
    loadHistory();
}

function validateInput(event) {
    const input = event.target;
    const value = parseInt(input.value);
    
    if (input.id === 'parallelDownloads') {
        if (value < 1 || value > 10) {
            input.setCustomValidity('Value must be between 1 and 10');
        } else {
            input.setCustomValidity('');
        }
    } else if (input.id === 'downloadDelay') {
        if (value < 100 || value > 10000) {
            input.setCustomValidity('Value must be between 100 and 10000 ms');
        } else {
            input.setCustomValidity('');
        }
    }
}

function saveSettings() {
    const parallelDownloads = parseInt(document.getElementById('parallelDownloads').value);
    const downloadDelay = parseInt(document.getElementById('downloadDelay').value);
    chrome.storage.local.set({ parallelDownloads, downloadDelay }, () => {
        alert('Pengaturan disimpan!');
    });
}

function loadHistory() {
    chrome.storage.local.get(['downloadHistory'], (result) => {
        const history = result.downloadHistory || [];
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        history.forEach((entry, index) => {
            const p = document.createElement('p');
            p.textContent = `${new Date(entry.timestamp).toLocaleString()}: Berhasil ${entry.success}, Gagal ${entry.failed}`;
            historyList.appendChild(p);
        });
    });
}

function clearHistory() {
    chrome.storage.local.set({ downloadHistory: [] }, () => {
        loadHistory();
        alert('Riwayat dihapus!');
    });
}