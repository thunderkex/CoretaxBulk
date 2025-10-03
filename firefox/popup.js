const state = {
    settings: {
        parallelDownloads: 5,
        downloadDelay: 650,
        selectedLanguage: 'id'
    },
    history: []
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
        fastest: 'Paling Cepat',
        keyboardShortcuts: 'Pintasan Keyboard',
        shortcutDownload: 'Ctrl+D: Mulai Unduh',
        shortcutSelectAll: 'Ctrl+Shift+A: Pilih Semua',
        shortcutFilter: 'Ctrl+Shift+F: Buka Filter',
        shortcutMinimize: 'Ctrl+Shift+M: Minimalkan Panel',
        shortcutExportErrors: 'Ctrl+Shift+E: Ekspor Kesalahan',
        shortcutCloseModal: 'Esc: Tutup Modal'
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
        fastest: 'Fastest',
        keyboardShortcuts: 'Keyboard Shortcuts',
        shortcutDownload: 'Ctrl+D: Start Download',
        shortcutSelectAll: 'Ctrl+Shift+A: Select All',
        shortcutFilter: 'Ctrl+Shift+F: Open Filter',
        shortcutMinimize: 'Ctrl+Shift+M: Minimize Panel',
        shortcutExportErrors: 'Ctrl+Shift+E: Export Errors',
        shortcutCloseModal: 'Esc: Close Modal'
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
    const result = await browser.storage.local.get(['parallelDownloads', 'downloadDelay', 'downloadHistory', 'selectedLanguage']);
    state.settings.parallelDownloads = result.parallelDownloads || 5;
    state.settings.downloadDelay = result.downloadDelay || 650;
    state.settings.selectedLanguage = result.selectedLanguage || 'id';
    state.history = result.downloadHistory || [];
}

function saveSettings() {
    const parallelDownloads = parseInt(document.getElementById('parallelDownloads').value);
    const downloadDelay = parseInt(document.getElementById('downloadDelay').value);
    const selectedLanguage = document.getElementById('languageSelect').value;
    
    browser.storage.local.set({ 
        parallelDownloads, 
        downloadDelay, 
        selectedLanguage 
    }, () => {
        const message = POPUP_TRANSLATIONS[selectedLanguage].settingsSaved;
        alert(message);
    });
}

function loadHistory() {
    browser.storage.local.get(['downloadHistory'], (result) => {
        const history = result.downloadHistory || [];
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        history.forEach((entry, index) => {
            const p = document.createElement('p');
            const lang = state.settings.selectedLanguage;
            const translations = POPUP_TRANSLATIONS[lang];
            p.textContent = `${new Date(entry.timestamp).toLocaleString()}: ${translations.successful || 'Berhasil'} ${entry.success}, ${translations.failed || 'Gagal'} ${entry.failed}`;
            historyList.appendChild(p);
        });
    });
}

function clearHistory() {
    browser.storage.local.set({ downloadHistory: [] }, () => {
        loadHistory();
        const lang = document.getElementById('languageSelect').value;
        const message = POPUP_TRANSLATIONS[lang].historyCleared;
        alert(message);
    });
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
    
    // Add help button listener
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', showKeyboardShortcuts);
    }
}

function updateUI() {
    document.getElementById('parallelDownloads').value = state.settings.parallelDownloads;
    document.getElementById('downloadDelay').value = state.settings.downloadDelay;
    document.getElementById('languageSelect').value = state.settings.selectedLanguage;
    loadHistory();
}

async function changeLanguage() {
    const selectedLang = document.getElementById('languageSelect').value;
    state.settings.selectedLanguage = selectedLang;
    await browser.storage.local.set({ selectedLanguage: selectedLang });
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
    
    // Reload history with new language
    loadHistory();
}

function validateInput(event) {
    const input = event.target;
    const value = parseInt(input.value);
    
    if (input.id === 'parallelDownloads') {
        if (value < 1 || value > 10 || isNaN(value)) {
            input.setCustomValidity('Value must be between 1 and 10');
            input.reportValidity();
        } else {
            input.setCustomValidity('');
        }
    } else if (input.id === 'downloadDelay') {
        if (value < 100 || value > 10000 || isNaN(value)) {
            input.setCustomValidity('Value must be between 100 and 10000 ms');
            input.reportValidity();
        } else {
            input.setCustomValidity('');
        }
    }
}

function saveSettings() {
    const parallelInput = document.getElementById('parallelDownloads');
    const delayInput = document.getElementById('downloadDelay');
    
    // Validate before saving
    parallelInput.dispatchEvent(new Event('change'));
    delayInput.dispatchEvent(new Event('change'));
    
    if (!parallelInput.checkValidity() || !delayInput.checkValidity()) {
        return;
    }
    
    const parallelDownloads = parseInt(parallelInput.value);
    const downloadDelay = parseInt(delayInput.value);
    const selectedLanguage = document.getElementById('languageSelect').value;
    
    browser.storage.local.set({ 
        parallelDownloads, 
        downloadDelay, 
        selectedLanguage 
    }, () => {
        const message = POPUP_TRANSLATIONS[selectedLanguage].settingsSaved;
        showNotification(message, 'success');
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function showKeyboardShortcuts() {
    const lang = state.settings.selectedLanguage;
    const t = POPUP_TRANSLATIONS[lang];
    
    alert(`${t.keyboardShortcuts || 'Keyboard Shortcuts'}:\n\n` +
          `${t.shortcutDownload || 'Ctrl+D: Start Download'}\n` +
          `${t.shortcutSelectAll || 'Ctrl+Shift+A: Select All'}\n` +
          `${t.shortcutFilter || 'Ctrl+Shift+F: Open Filter'}\n` +
          `${t.shortcutMinimize || 'Ctrl+Shift+M: Minimize Panel'}\n` +
          `${t.shortcutExportErrors || 'Ctrl+Shift+E: Export Errors'}\n` +
          `${t.shortcutCloseModal || 'Esc: Close Modal'}`);
}

function loadHistory() {
    browser.storage.local.get(['downloadHistory'], (result) => {
        const history = result.downloadHistory || [];
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No history yet';
            p.style.color = '#9ca3af';
            historyList.appendChild(p);
            return;
        }
        
        history.forEach((entry, index) => {
            const p = document.createElement('p');
            const lang = state.settings.selectedLanguage;
            const translations = POPUP_TRANSLATIONS[lang];
            const date = new Date(entry.timestamp).toLocaleString();
            const duration = entry.duration ? ` (${entry.duration}ms)` : '';
            p.textContent = `${date}: ✓${entry.success} ✗${entry.failed}${duration}`;
            p.style.fontSize = '12px';
            historyList.appendChild(p);
        });
    });
}

function exportHistory() {
    browser.storage.local.get(['downloadHistory'], (result) => {
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
    if (file.size > 1024 * 1024) { // 1MB limit
        alert('File too large. Maximum 1MB allowed.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const history = JSON.parse(event.target.result);
            
            // Validate history structure
            if (!Array.isArray(history)) {
                throw new Error('Invalid format: expected array');
            }
            
            history.forEach(entry => {
                if (!entry.timestamp || entry.success === undefined) {
                    throw new Error('Invalid entry structure');
                }
            });
            
            browser.storage.local.set({ downloadHistory: history }, () => {
                const lang = state.settings.selectedLanguage;
                showNotification('History imported successfully!', 'success');
                loadHistory();
            });
        } catch (error) {
            alert('Failed to import history. Invalid file format: ' + error.message);
        }
    };
    reader.readAsText(file);
}