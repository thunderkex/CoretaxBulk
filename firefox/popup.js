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
    const result = await browser.storage.local.get(['parallelDownloads', 'downloadDelay', 'downloadHistory']);
    state.settings.parallelDownloads = result.parallelDownloads || 5;
    state.settings.downloadDelay = result.downloadDelay || 650;
    state.history = result.downloadHistory || [];
}

function saveSettings() {
    const parallelDownloads = parseInt(document.getElementById('parallelDownloads').value);
    const downloadDelay = parseInt(document.getElementById('downloadDelay').value);
    browser.storage.local.set({ parallelDownloads, downloadDelay }, () => {
        alert('Pengaturan disimpan!');
    });
}

function loadHistory() {
    browser.storage.local.get(['downloadHistory'], (result) => {
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
    browser.storage.local.set({ downloadHistory: [] }, () => {
        loadHistory();
        alert('Riwayat dihapus!');
    });
}