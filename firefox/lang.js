// Language configuration for CoretaxBulk - Firefox version
const LANGUAGES = {
    id: {
        code: 'id',
        name: 'Bahasa Indonesia',
        flag: '🇮🇩',
        translations: {
            // UI Elements
            selectAll: 'Pilih Semua',
            deselectAll: 'Batal Pilih',
            filter: 'Filter',
            downloadDocuments: 'Unduh Dokumen',
            minimizePanel: 'Minimalkan panel',
            maximizePanel: 'Maksimalkan panel',
            
            // Filter Modal
            filterDocuments: 'Filter Dokumen',
            enterSearchText: 'Masukkan teks pencarian...',
            allTypes: 'Semua Jenis',
            close: 'Tutup',
            apply: 'Terapkan',
            clear: 'Hapus',
            
            // Document Types
            invoice: 'Faktur',
            receipt: 'Kwitansi',
            taxSlip: 'Slip Pajak',
            document: 'Dokumen',
            
            // Progress and Status
            progress: 'Progres',
            completed: 'Selesai',
            failed: 'Gagal',
            total: 'Total',
            downloading: 'Mengunduh',
            
            // Summary Modal
            downloadSummary: 'Ringkasan Unduhan',
            successful: 'Berhasil',
            
            // Error Messages
            noDocumentsSelected: 'Silakan pilih setidaknya satu dokumen untuk diunduh',
            downloadButtonNotFound: 'Tombol unduh tidak ditemukan',
            errorDownloadingDocument: 'Error mengunduh dokumen',
            
            // Popup Settings
            extensionTitle: 'coretaxbulk download',
            parallelDownloads: 'Jumlah Unduhan Paralel:',
            downloadDelay: 'Penundaan (ms):',
            saveSettings: 'Simpan Pengaturan',
            downloadHistory: 'Riwayat Unduhan:',
            clearHistory: 'Hapus Riwayat',
            settingsSaved: 'Pengaturan disimpan!',
            historyCleared: 'Riwayat dihapus!',
            warning: '⚠️ Peringatan: Otomatisasi ini mungkin melanggar kebijakan Coretax. Gunakan dengan risiko Anda sendiri.',
            
            // Safety Options
            safest: 'Paling Aman',
            recommended: 'Disarankan',
            fastest: 'Paling Cepat',
            
            // Language Switch
            language: 'Bahasa',
            switchLanguage: 'Ganti Bahasa',
            
            // Add missing keys
            duration: 'Durasi',
            exportErrors: 'Ekspor Error',
            avgTime: 'Waktu Rata-rata',
            performance: 'Performa',
            
            // Keyboard shortcuts help
            keyboardShortcuts: 'Pintasan Keyboard',
            shortcutDownload: 'Ctrl+D: Mulai Unduh',
            shortcutSelectAll: 'Ctrl+Shift+A: Pilih Semua',
            shortcutFilter: 'Ctrl+Shift+F: Buka Filter',
            shortcutMinimize: 'Ctrl+Shift+M: Minimalkan Panel',
            shortcutExportErrors: 'Ctrl+Shift+E: Ekspor Error',
            shortcutCloseModal: 'Esc: Tutup Modal'
        }
    },
    en: {
        code: 'en',
        name: 'English',
        flag: '🇺🇸',
        translations: {
            // UI Elements
            selectAll: 'Select All',
            deselectAll: 'Deselect All',
            filter: 'Filter',
            downloadDocuments: 'Download Documents',
            minimizePanel: 'Minimize panel',
            maximizePanel: 'Maximize panel',
            
            // Filter Modal
            filterDocuments: 'Filter Documents',
            enterSearchText: 'Enter search text...',
            allTypes: 'All Types',
            close: 'Close',
            apply: 'Apply',
            clear: 'Clear',
            
            // Document Types
            invoice: 'Invoice',
            receipt: 'Receipt',
            taxSlip: 'Tax Slip',
            document: 'Document',
            
            // Progress and Status
            progress: 'Progress',
            completed: 'Completed',
            failed: 'Failed',
            total: 'Total',
            downloading: 'Downloading',
            
            // Summary Modal
            downloadSummary: 'Download Summary',
            successful: 'Successful',
            
            // Error Messages
            noDocumentsSelected: 'Please select at least one document to download',
            downloadButtonNotFound: 'Download button not found',
            errorDownloadingDocument: 'Error downloading document',
            
            // Popup Settings
            extensionTitle: 'coretaxbulk download',
            parallelDownloads: 'Parallel Downloads:',
            downloadDelay: 'Download Delay (ms):',
            saveSettings: 'Save Settings',
            downloadHistory: 'Download History:',
            clearHistory: 'Clear History',
            settingsSaved: 'Settings saved!',
            historyCleared: 'History cleared!',
            warning: '⚠️ Warning: This automation may violate Coretax policies. Use at your own risk.',
            
            // Safety Options
            safest: 'Safest',
            recommended: 'Recommended',
            fastest: 'Fastest',
            
            // Language Switch
            language: 'Language',
            switchLanguage: 'Switch Language',
            
            // Add missing keys
            duration: 'Duration',
            exportErrors: 'Export Errors',
            avgTime: 'Average Time',
            performance: 'Performance',
            
            // Keyboard shortcuts help
            keyboardShortcuts: 'Keyboard Shortcuts',
            shortcutDownload: 'Ctrl+D: Start Download',
            shortcutSelectAll: 'Ctrl+Shift+A: Select All',
            shortcutFilter: 'Ctrl+Shift+F: Open Filter',
            shortcutMinimize: 'Ctrl+Shift+M: Minimize Panel',
            shortcutExportErrors: 'Ctrl+Shift+E: Export Errors',
            shortcutCloseModal: 'Esc: Close Modal'
        }
    }
};

// Language utility class for Firefox
class LanguageManager {
    constructor() {
        this.currentLang = 'id'; // Default to Indonesian
        this.loadLanguage();
    }

    async loadLanguage() {
        try {
            const result = await browser.storage.local.get(['selectedLanguage']);
            this.currentLang = result.selectedLanguage || 'id';
        } catch (error) {
            console.warn('Failed to load language setting:', error);
            this.currentLang = 'id';
        }
    }

    async setLanguage(langCode) {
        if (LANGUAGES[langCode]) {
            this.currentLang = langCode;
            try {
                await browser.storage.local.set({ selectedLanguage: langCode });
                return true;
            } catch (error) {
                console.error('Failed to save language setting:', error);
                return false;
            }
        }
        return false;
    }

    getText(key) {
        const lang = LANGUAGES[this.currentLang];
        return lang?.translations[key] || LANGUAGES.id.translations[key] || key;
    }

    getCurrentLanguage() {
        return LANGUAGES[this.currentLang];
    }

    getAvailableLanguages() {
        return Object.keys(LANGUAGES).map(code => ({
            code,
            name: LANGUAGES[code].name,
            flag: LANGUAGES[code].flag
        }));
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.LanguageManager = LanguageManager;
    window.LANGUAGES = LANGUAGES;
}