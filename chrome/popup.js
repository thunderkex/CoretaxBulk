const state = {
    settings: {
        parallelDownloads: 5,
        downloadDelay: 650,
        selectedLanguage: 'id'
    },
    history: [],
    langManager: null
};

// Language translations for popup
const POPUP_TRANSLATIONS = {
    id: {
        extensionTitle: 'coretaxbulk download',
        language: 'Bahasa',
        parallelDownloads: 'Jumlah Unduhan Paralel:',
        downloadDelay: 'Penundaan (ms):',
        saveSettings: 'Simpan Pengaturan',
        downloadHistory: 'Riwayat Unduhan:',
        clearHistory: 'Hapus Riwayat',
        settingsSaved: 'Pengaturan disimpan!',
        historyCleared: 'Riwayat dihapus!',
        warning: '⚠️ Peringatan: Otomatisasi ini mungkin melanggar kebijakan Coretax. Gunakan dengan risiko Anda sendiri.',
        safest: 'Paling Aman',
        recommended: 'Disarankan',
        fastest: 'Paling Cepat'
    },
    en: {
        extensionTitle: 'coretaxbulk download',
        language: 'Language',
        parallelDownloads: 'Parallel Downloads:',
        downloadDelay: 'Download Delay (ms):',
        saveSettings: 'Save Settings',
        downloadHistory: 'Download History:',
        clearHistory: 'Clear History',
        settingsSaved: 'Settings saved!',
        historyCleared: 'History cleared!',
        warning: '⚠️ Warning: This automation may violate Coretax policies. Use at your own risk.',
        safest: 'Safest',
        recommended: 'Recommended',
        fastest: 'Fastest'
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeState();
        setupEventListeners();
        updateUI();
        updateLanguage(); // Initialize language
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize. Please try again.');
    }
});

async function initializeState() {
    const result = await chrome.storage.local.get(['parallelDownloads', 'downloadDelay', 'downloadHistory', 'selectedLanguage']);
    state.settings.parallelDownloads = result.parallelDownloads || 5;
    state.settings.downloadDelay = result.downloadDelay || 650;
    state.settings.selectedLanguage = result.selectedLanguage || 'id';
    state.history = result.downloadHistory || [];
}

function setupEventListeners() {
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    document.getElementById('parallelDownloads').addEventListener('change', validateInput);
    document.getElementById('downloadDelay').addEventListener('change', validateInput);
    document.getElementById('languageSelect').addEventListener('change', changeLanguage);
    document.getElementById('exportHistoryBtn').addEventListener('click', exportHistory);
    document.getElementById('importHistoryBtn').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            importHistory(file);
        }
    });
}

function updateUI() {
    document.getElementById('parallelDownloads').value = state.settings.parallelDownloads;
    document.getElementById('downloadDelay').value = state.settings.downloadDelay;
    document.getElementById('languageSelect').value = state.settings.selectedLanguage;
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
    const selectedLanguage = document.getElementById('languageSelect').value;
    
    chrome.storage.local.set({ 
        parallelDownloads, 
        downloadDelay, 
        selectedLanguage 
    }, () => {
        const message = POPUP_TRANSLATIONS[selectedLanguage].settingsSaved;
        alert(message);
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
        const lang = document.getElementById('languageSelect').value;
        const message = POPUP_TRANSLATIONS[lang].historyCleared;
        alert(message);
    });
}

async function changeLanguage() {
    const selectedLang = document.getElementById('languageSelect').value;
    state.settings.selectedLanguage = selectedLang;
    await chrome.storage.local.set({ selectedLanguage: selectedLang });
    updateLanguage();
}

function updateLanguage() {
    const lang = state.settings.selectedLanguage;
    const translations = POPUP_TRANSLATIONS[lang];
    
    // Update text content
    document.getElementById('parallelLabel').textContent = translations.parallelDownloads;
    document.getElementById('delayLabel').textContent = translations.downloadDelay;
    document.getElementById('saveSettingsBtn').textContent = translations.saveSettings;
    document.getElementById('historyTitle').textContent = translations.downloadHistory;
    document.getElementById('clearHistoryBtn').textContent = translations.clearHistory;
    document.getElementById('warningText').textContent = translations.warning;
    
    // Update option labels
    const options = document.querySelectorAll('#parallelDownloads option');
    options.forEach(option => {
        const value = option.value;
        const labelId = option.getAttribute('data-label-id');
        if (labelId) {
            const baseText = option.textContent.split(' (')[0];
            option.textContent = `${baseText} (${translations[labelId]})`;
        }
    });
}

// Added export and import functionality for download history
function exportHistory() {
    chrome.storage.local.get(['downloadHistory'], (result) => {
        const history = result.downloadHistory || [];
        const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'download_history.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

function importHistory(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const history = JSON.parse(event.target.result);
            chrome.storage.local.set({ downloadHistory: history }, () => {
                alert('History imported successfully!');
                loadHistory();
            });
        } catch (error) {
            alert('Failed to import history. Invalid file format.');
        }
    };
    reader.readAsText(file);
}