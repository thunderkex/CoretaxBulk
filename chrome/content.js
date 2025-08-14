/**
 * Created by thunderkex
 */

class SimpleDocDownloader {
    constructor() {
        this.createUI();
        this.loadSettings();
        this.downloadQueue = [];
        this.processingQueue = false;
        this.documentCache = new Map();
        this.retryAttempts = 3;
        this.filterDebounceTimer = null;
        this.downloadStats = { total: 0, completed: 0, failed: 0 };
        this.isMinimized = false;
        this.setupKeyboardShortcuts();
        this.documentTypes = new Set();
    }

    async loadSettings() {
        const result = await chrome.storage.local.get(['parallelDownloads', 'downloadDelay']);
        this.parallelDownloads = result.parallelDownloads || 5;
        this.downloadDelay = result.downloadDelay || 650;
    }

    // Bikin tombol download dan progress bar
    createUI() {
        const panel = document.createElement('div');
        panel.className = 'download-panel';

        // Minimize button
        const minimizeBtn = document.createElement('button');
        minimizeBtn.innerHTML = '&#x2796;';
        minimizeBtn.className = 'minimize-btn';
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());

        // Select All button
        const selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = 'Select All';
        selectAllBtn.className = 'select-all-btn';
        selectAllBtn.addEventListener('click', () => this.toggleSelectAll());

        // Filter button
        const filterBtn = document.createElement('button');
        filterBtn.textContent = 'Filter';
        filterBtn.className = 'filter-btn';
        filterBtn.addEventListener('click', () => this.showFilterModal());

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Documents';
        downloadBtn.className = 'download-btn';
        downloadBtn.addEventListener('click', () => this.startDownload());

        // Progress bar container
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);

        panel.append(minimizeBtn, selectAllBtn, filterBtn, downloadBtn, progressBar);
        document.body.appendChild(panel);

        this.progressFill = progressFill;
    }

    showFilterModal() {
        const modal = document.createElement('div');
        modal.className = 'filter-modal';
        
        // Detect document types for filter options
        this.detectDocumentTypes();
        const typeOptions = Array.from(this.documentTypes).map(type => 
            `<option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>`
        ).join('');
        
        modal.innerHTML = `
            <div class="filter-modal-content">
                <h3>Filter Documents</h3>
                <input type="text" id="filterText" placeholder="Enter search text...">
                <select id="filterType">
                    <option value="">All Types</option>
                    ${typeOptions}
                </select>
                <div class="modal-buttons">
                    <button onclick="document.querySelector('.filter-modal').remove()">Close</button>
                    <button onclick="document.dispatchEvent(new CustomEvent('applyFilter'))">Apply</button>
                    <button onclick="document.dispatchEvent(new CustomEvent('clearFilter'))">Clear</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners
        const applyHandler = () => {
            const filterText = document.getElementById('filterText').value.toLowerCase();
            const filterType = document.getElementById('filterType').value;
            this.filterDocuments(filterText, filterType);
            modal.remove();
        };

        const clearHandler = () => {
            this.clearFilters();
            modal.remove();
        };

        document.addEventListener('applyFilter', applyHandler, { once: true });
        document.addEventListener('clearFilter', clearHandler, { once: true });

        // Auto-focus the input
        setTimeout(() => document.getElementById('filterText').focus(), 100);
    }

    filterDocuments(text, type = '') {
        // Clear existing timer
        clearTimeout(this.filterDebounceTimer);
        
        // Set new debounced timer
        this.filterDebounceTimer = setTimeout(() => {
            const rows = document.querySelectorAll('table.p-datatable-table tbody tr');
            const searchTerms = text.toLowerCase().split(' ').filter(term => term.length > 0);
            
            rows.forEach(row => {
                const content = row.textContent.toLowerCase();
                const textMatches = !text || searchTerms.every(term => content.includes(term));
                const typeMatches = !type || content.includes(type);
                
                row.style.display = (textMatches && typeMatches) ? '' : 'none';
            });
        }, 300);
    }

    clearFilters() {
        const rows = document.querySelectorAll('table.p-datatable-table tbody tr');
        rows.forEach(row => row.style.display = '');
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('table.p-datatable-table tbody tr input[type="checkbox"]');
        const someUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
        checkboxes.forEach(cb => cb.checked = someUnchecked);
    }

    // Mulai proses download
    async startDownload() {
        const rows = document.querySelectorAll('table.p-datatable-table tbody tr');
        const selectedRows = this.getSelectedRows(rows);
        
        if (!await this.validateDownload(selectedRows)) return;

        this.downloadQueue = [...selectedRows];
        await this.processDownloadQueue();
    }

    getSelectedRows(rows) {
        return Array.from(rows).filter(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            return checkbox?.checked && row.style.display !== 'none';
        });
    }

    async processDownloadQueue() {
        if (this.processingQueue) return;
        this.processingQueue = true;

        const total = this.downloadQueue.length;
        let completed = 0;
        let failed = 0;

        while (this.downloadQueue.length > 0) {
            const batch = this.downloadQueue.splice(0, this.parallelDownloads);
            await Promise.all(batch.map(async row => {
                const result = await this.downloadDocument(row);
                result ? completed++ : failed++;
                this.updateProgress(completed, total);
            }));

            await this.sleep(this.downloadDelay);
        }

        this.processingQueue = false;
        await this.saveHistory(completed, failed);
        this.showSummary(completed, failed, total);
    }

    async downloadDocument(row, attemptCount = 0) {
        try {
            const downloadBtn = this.findDownloadButton(row);
            if (!downloadBtn) {
                this.showError('Download button not found:', row);
                return false;
            }

            const cacheKey = this.generateCacheKey(row);
            if (this.documentCache.has(cacheKey)) {
                this.showError('Using cached document');
                return true;
            }

            downloadBtn.click();
            this.documentCache.set(cacheKey, true);
            return true;
        } catch (error) {
            this.showError('Error downloading document:', error);
            if (attemptCount < this.retryAttempts) {
                await this.sleep(800);
                return this.downloadDocument(row, attemptCount + 1);
            }
            return false;
        }
    }

    findDownloadButton(row) {
        return row.querySelector(
            'button#DownloadButton, ' +
            'button[aria-label*="unduh"], ' +
            'button[aria-label*="download"], ' +
            'button[title*="unduh"], ' +
            'button[title*="download"]'
        );
    }

    generateCacheKey(row) {
        // Generate unique key based on row content
        return row.textContent.trim();
    }

    updateProgress(completed, total) {
        const percentage = (completed / total) * 100;
        this.progressFill.style.width = `${percentage}%`;
    }

    async saveHistory(completed, failed) {
        const historyEntry = {
            timestamp: Date.now(),
            success: completed,
            failed: failed
        };

        const { downloadHistory = [] } = await chrome.storage.local.get(['downloadHistory']);
        downloadHistory.unshift(historyEntry);
        if (downloadHistory.length > 10) downloadHistory.pop();
        await chrome.storage.local.set({ downloadHistory });
    }

    showSummary(completed, failed, total) {
        const modal = document.createElement('div');
        modal.className = 'summary-modal';
        modal.innerHTML = `
            <div class="summary-modal-content">
                <h3>Download Summary</h3>
                <p>Successful: ${completed}</p>
                <p>Failed: ${failed}</p>
                <p>Total: ${total}</p>
                <button onclick="this.closest('.summary-modal').remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    toggleMinimize() {
        const panel = document.querySelector('.download-panel');
        panel.classList.toggle('minimized');
        const minimizeBtn = panel.querySelector('.minimize-btn');
        minimizeBtn.innerHTML = panel.classList.contains('minimized') ? '&#x2795;' : '&#x2796;';
    }

    // Fungsi buat jeda
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showError(message, duration = 3000) {
        const errorPopup = document.createElement('div');
        errorPopup.className = 'error-popup';
        errorPopup.textContent = message;
        document.body.appendChild(errorPopup);

        setTimeout(() => {
            errorPopup.classList.add('fade-out');
            setTimeout(() => errorPopup.remove(), 300);
        }, duration);
    }

    async validateDownload(selectedRows) {
        if (selectedRows.length === 0) {
            this.showError('Please select at least one document to download');
            return false;
        }
        return true;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'd':
                        e.preventDefault();
                        this.startDownload();
                        break;
                    case 'a':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.toggleSelectAll();
                        }
                        break;
                    case 'f':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.showFilterModal();
                        }
                        break;
                    case 'm':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.toggleMinimize();
                        }
                        break;
                }
            }
        });
    }

    detectDocumentTypes() {
        const rows = document.querySelectorAll('table.p-datatable-table tbody tr');
        this.documentTypes.clear();
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                const text = cell.textContent.toLowerCase();
                if (text.includes('invoice') || text.includes('faktur')) {
                    this.documentTypes.add('invoice');
                } else if (text.includes('receipt') || text.includes('kwitansi')) {
                    this.documentTypes.add('receipt');
                } else if (text.includes('report') || text.includes('laporan')) {
                    this.documentTypes.add('report');
                }
            });
        });
    }
}

// Jalankan ekstensinya
new SimpleDocDownloader();