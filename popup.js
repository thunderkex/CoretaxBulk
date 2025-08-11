document.addEventListener('DOMContentLoaded', () => {
    // Muat pengaturan
    chrome.storage.local.get(['parallelDownloads', 'downloadDelay'], (result) => {
        document.getElementById('parallelDownloads').value = result.parallelDownloads || 3;
        document.getElementById('downloadDelay').value = result.downloadDelay || 1000;
    });

    // Add event listeners
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

    // Muat riwayat
    loadHistory();
});

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