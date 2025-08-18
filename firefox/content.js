class SimpleDocDownloader {
    constructor() {
        this.langManager = new LanguageManager();
        this.initializeAsync();
        this.downloadQueue = [];
        this.processingQueue = false;
        this.documentCache = new Set();
        this.retryAttempts = 3;
        this.filterDebounceTimer = null;
        this.downloadStats = { total: 0, completed: 0, failed: 0 };
        this.isMinimized = false;
        this.setupKeyboardShortcuts();
        this.documentTypes = new Set();
        // Adaptive concurrency
        this.minConcurrency = 1;
        this.maxConcurrency = 10;
        this.currentConcurrency = 5;
        this.metrics = { durations: [], avgDuration: 0, successes: 0, failures: 0 };
        this._attempts = new WeakMap();
        this._rowCache = null;
    }

    async initializeAsync() {
        await this.langManager.loadLanguage();
        this.createUI();
        this.loadSettings();
        this.setupStorageListener();
    }

    setupStorageListener() {
        // Listen for language changes from popup
        browser.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.selectedLanguage) {
                this.langManager.currentLang = changes.selectedLanguage.newValue;
                this.updateUILanguage();
            }
        });
    }

    updateUILanguage() {
        // Update button texts with new language
        this.selectAllBtn.textContent = this.langManager.getText('selectAll');
        this.filterBtn.textContent = this.langManager.getText('filter');
        this.downloadBtn.textContent = this.langManager.getText('downloadDocuments');
        
        // Update aria labels
        const minimizeBtn = document.querySelector('.minimize-btn');
        if (minimizeBtn) {
            minimizeBtn.setAttribute('aria-label', this.langManager.getText('minimizePanel'));
        }
    }

    async loadSettings() {
        const result = await browser.storage.local.get(['parallelDownloads', 'downloadDelay']);
        this.parallelDownloads = result.parallelDownloads || 5;
        this.downloadDelay = result.downloadDelay || 650;
        this.currentConcurrency = Math.min(this.maxConcurrency, Math.max(this.minConcurrency, this.parallelDownloads));
    }

    createUI() {
        const panel = document.createElement('div');
        panel.className = 'download-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'CoretaxBulk Download Panel');

        // Minimize button
        const minimizeBtn = document.createElement('button');
        minimizeBtn.innerHTML = '&#x2796;';
        minimizeBtn.className = 'minimize-btn';
        minimizeBtn.setAttribute('aria-label', this.langManager.getText('minimizePanel'));
        minimizeBtn.addEventListener('click', () => this.toggleMinimize());

        // Select All button
        const selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = this.langManager.getText('selectAll');
        selectAllBtn.className = 'select-all-btn';
        selectAllBtn.setAttribute('aria-label', 'Select or deselect all documents');
        selectAllBtn.addEventListener('click', () => this.toggleSelectAll());

        // Filter button
        const filterBtn = document.createElement('button');
        filterBtn.textContent = this.langManager.getText('filter');
        filterBtn.className = 'filter-btn';
        filterBtn.setAttribute('aria-label', 'Open filter dialog');
        filterBtn.addEventListener('click', () => this.showFilterModal());

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = this.langManager.getText('downloadDocuments');
        downloadBtn.className = 'download-btn';
        downloadBtn.setAttribute('aria-label', 'Start bulk download');
        downloadBtn.addEventListener('click', () => this.startDownload());

        // Progress bar container
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.setAttribute('role', 'progressbar');
        progressBar.setAttribute('aria-valuemin', '0');
        progressBar.setAttribute('aria-valuemax', '100');
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);

        // Live region for screen readers
        const srStatus = document.createElement('div');
        srStatus.className = 'sr-only';
        srStatus.setAttribute('aria-live', 'polite');

        panel.append(minimizeBtn, selectAllBtn, filterBtn, downloadBtn, progressBar, srStatus);
        document.body.appendChild(panel);

        this.progressFill = progressFill;
        this.progressBar = progressBar;
        this.statusEl = srStatus;
        this.selectAllBtn = selectAllBtn;
        this.filterBtn = filterBtn;
        this.downloadBtn = downloadBtn;
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
                <h3>${this.langManager.getText('filterDocuments')}</h3>
                <input type="text" id="filterText" placeholder="${this.langManager.getText('enterSearchText')}">
                <select id="filterType">
                    <option value="">${this.langManager.getText('allTypes')}</option>
                    ${typeOptions}
                </select>
                <div class="modal-buttons">
                    <button onclick="document.querySelector('.filter-modal').remove()">${this.langManager.getText('close')}</button>
                    <button onclick="document.dispatchEvent(new CustomEvent('applyFilter'))">${this.langManager.getText('apply')}</button>
                    <button onclick="document.dispatchEvent(new CustomEvent('clearFilter'))">${this.langManager.getText('clear')}</button>
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
        clearTimeout(this.filterDebounceTimer);
        this.filterDebounceTimer = setTimeout(() => {
            const cache = this.getOrBuildRowCache();
            const searchTerms = (text || '').toLowerCase().split(' ').filter(Boolean);
            const typeLower = (type || '').toLowerCase();

            const changes = [];
            for (const item of cache) {
                const textMatches = searchTerms.length === 0 || searchTerms.every(term => item.textLower.includes(term));
                const typeMatches = !typeLower || item.textLower.includes(typeLower);
                const shouldHide = !(textMatches && typeMatches);
                const currentlyHidden = item.row.classList.contains('row-hidden');
                if (shouldHide !== currentlyHidden) changes.push({ row: item.row, hide: shouldHide });
            }
            if (changes.length) requestAnimationFrame(() => changes.forEach(c => this.setHiddenRow(c.row, c.hide)));
        }, 200);
    }

    clearFilters() {
        const cache = this.getOrBuildRowCache();
        requestAnimationFrame(() => cache.forEach(item => this.setHiddenRow(item.row, false)));
    }

    setHiddenRow(row, hidden) {
        if (hidden) row.classList.add('row-hidden'); else row.classList.remove('row-hidden');
    }

    getOrBuildRowCache() {
        if (this._rowCache && this._rowCache.length) return this._rowCache;
        const rows = document.querySelectorAll('table.p-datatable-table tbody tr');
        this._rowCache = Array.from(rows).map(row => ({ row, textLower: row.textContent.toLowerCase() }));
        return this._rowCache;
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('table.p-datatable-table tbody tr input[type="checkbox"]');
        const someUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
        checkboxes.forEach(cb => cb.checked = someUnchecked);
        
        // Update button text based on state
        this.selectAllBtn.textContent = someUnchecked ? 
            this.langManager.getText('deselectAll') : 
            this.langManager.getText('selectAll');
    }

    // Mulai proses download
    async startDownload() {
        this._rowCache = null;
        const rows = document.querySelectorAll('table.p-datatable-table tbody tr');
        const selectedRows = this.getSelectedRows(rows);
        
        if (!await this.validateDownload(selectedRows)) return;

        this.downloadQueue = [...selectedRows];
        await this.processDownloadQueue();
    }

    getSelectedRows(rows) {
        return Array.from(rows).filter(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            return checkbox?.checked && !row.classList.contains('row-hidden');
        });
    }

    async processDownloadQueue() {
        if (this.processingQueue) return;
        this.processingQueue = true;

        const total = this.downloadQueue.length;
        let completed = 0;
        let failed = 0;
        this.metrics = { durations: [], avgDuration: 0, successes: 0, failures: 0 };
        const queue = [...this.downloadQueue];
        this.downloadQueue = [];
        const attemptsMap = this._attempts;

        const runNext = async () => {
            if (!queue.length) return;
            const row = queue.shift();
            const start = performance.now();
            try {
                const ok = await this.downloadDocument(row);
                const dur = performance.now() - start;
                this.updateMetrics(dur, ok);
                ok ? completed++ : this.enqueueRetry(row, attemptsMap, queue) ? null : failed++;
            } catch (_) {
                const dur = performance.now() - start;
                this.updateMetrics(dur, false);
                this.enqueueRetry(row, attemptsMap, queue) ? null : failed++;
            }
            this.updateProgress(completed + failed, total);
            this.adjustConcurrency();
            if (queue.length) await this.sleep(this.downloadDelay);
            if (completed + failed < total) await runNext();
        };

        const starters = Math.min(this.currentConcurrency, total);
        const workers = [];
        for (let i = 0; i < starters; i++) workers.push(runNext());
        await Promise.all(workers);

        this.processingQueue = false;
        await this.saveHistory(completed, failed);
        this.showSummary(completed, failed, total);
    }

    enqueueRetry(row, attemptsMap, queue) {
        const prev = attemptsMap.get(row) || 0;
        if (prev + 1 < this.retryAttempts) {
            attemptsMap.set(row, prev + 1);
            queue.push(row);
            return true;
        }
        return false;
    }

    async downloadDocument(row, attemptCount = 0) {
        try {
            const downloadBtn = this.findDownloadButton(row);
            if (!downloadBtn) {
                this.showError('Download button not found');
                return false;
            }
            const cacheKey = this.generateCacheKey(row);
            if (this.documentCache.has(cacheKey)) return true;
            downloadBtn.click();
            this.documentCache.add(cacheKey);
            return true;
        } catch (error) {
            if (attemptCount < this.retryAttempts) {
                await this.sleep(400 * (attemptCount + 1));
                return this.downloadDocument(row, attemptCount + 1);
            }
            this.showError('Error downloading document');
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
        return this.hashString(row.textContent.trim());
    }

    hashString(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash) + str.charCodeAt(i);
        return `r${hash >>> 0}`;
    }

    updateProgress(completed, total) {
        const percentage = total ? (completed / total) * 100 : 0;
        const pctText = `${Math.min(100, Math.max(0, percentage)).toFixed(0)}`;
        if (this.progressBar) {
            this.progressBar.setAttribute('aria-valuenow', pctText);
        }
        if (this.statusEl) {
            this.statusEl.textContent = `${this.langManager.getText('progress')}: ${pctText}%`;
        }
        if (this.progressFill) {
            requestAnimationFrame(() => {
                this.progressFill.style.width = `${percentage}%`;
            });
        }
    }

    updateMetrics(durationMs, ok) {
        const arr = this.metrics.durations;
        arr.push(durationMs);
        if (arr.length > 20) arr.shift();
        const sum = arr.reduce((a, b) => a + b, 0);
        this.metrics.avgDuration = sum / arr.length;
        ok ? this.metrics.successes++ : this.metrics.failures++;
    }

    adjustConcurrency() {
        const avg = this.metrics.avgDuration || 0;
        const totalOps = this.metrics.successes + this.metrics.failures;
        const failRate = totalOps ? this.metrics.failures / totalOps : 0;
        if (avg > 1500 || failRate > 0.1) this.currentConcurrency = Math.max(this.minConcurrency, this.currentConcurrency - 1);
        else if (avg < 600 && failRate < 0.05) this.currentConcurrency = Math.min(this.maxConcurrency, this.currentConcurrency + 1);
    }

    async saveHistory(completed, failed) {
        const historyEntry = { timestamp: Date.now(), success: completed, failed };
        const { downloadHistory = [] } = await browser.storage.local.get(['downloadHistory']);
        downloadHistory.unshift(historyEntry);
        if (downloadHistory.length > 10) downloadHistory.pop();
        await browser.storage.local.set({ downloadHistory });
    }

    showSummary(completed, failed, total) {
        const modal = document.createElement('div');
        modal.className = 'summary-modal';
        modal.innerHTML = `
            <div class="summary-modal-content">
                <h3>${this.langManager.getText('downloadSummary')}</h3>
                <p>${this.langManager.getText('successful')}: ${completed}</p>
                <p>${this.langManager.getText('failed')}: ${failed}</p>
                <p>${this.langManager.getText('total')}: ${total}</p>
                <button onclick="this.closest('.summary-modal').remove()">${this.langManager.getText('close')}</button>
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
            this.showError(this.langManager.getText('noDocumentsSelected'));
            return false;
        }
        return true;
    }

    detectDocumentTypes() {
        this._rowCache = null;
        const rows = document.querySelectorAll('table.p-datatable-table tbody tr');
        this.documentTypes.clear();
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                const text = cell.textContent.toLowerCase();
                if (text.includes('invoice') || text.includes('faktur')) {
                    this.documentTypes.add(this.langManager.getText('invoice'));
                } else if (text.includes('receipt') || text.includes('kwitansi')) {
                    this.documentTypes.add(this.langManager.getText('receipt'));
                } else if (text.includes('slip') || text.includes('pajak')) {
                    this.documentTypes.add(this.langManager.getText('taxSlip'));
                } else {
                    this.documentTypes.add(this.langManager.getText('document'));
                }
            });
        });
    }
}

// Jalankan ekstensinya
new SimpleDocDownloader();