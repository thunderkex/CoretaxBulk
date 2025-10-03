/**
 * Created by thunderkex
 * CoretaxBulk - Intelligent bulk document downloader
 */

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
        this.minConcurrency = 1;
        this.maxConcurrency = 10;
        this.currentConcurrency = 5;
        this.metrics = { durations: [], avgDuration: 0, successes: 0, failures: 0 };
        this._attempts = new WeakMap();
        this._rowCache = null;
        // Add error tracking
        this.errorLog = [];
        this.maxErrorLogSize = 50;
        // Add performance markers
        this.performanceMarkers = new Map();
    }

    async initializeAsync() {
        await this.langManager.loadLanguage();
        this.createUI();
        this.loadSettings();
        this.setupStorageListener();
    }

    setupStorageListener() {
        // Listen for language changes from popup
        chrome.storage.onChanged.addListener((changes, namespace) => {
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
        const result = await chrome.storage.local.get(['parallelDownloads', 'downloadDelay']);
        this.parallelDownloads = result.parallelDownloads || 5;
        this.downloadDelay = result.downloadDelay || 650;
        // keep currentConcurrency in sync with settings, clamped
        this.currentConcurrency = Math.min(this.maxConcurrency, Math.max(this.minConcurrency, this.parallelDownloads));
    }

    // Bikin tombol download dan progress bar
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

        // Added ARIA roles and improved keyboard navigation for accessibility
        panel.setAttribute('role', 'complementary');
        panel.setAttribute('aria-labelledby', 'download-panel-title');
        const title = document.createElement('h2');
        title.id = 'download-panel-title';
        title.textContent = 'Download Panel';
        panel.prepend(title);

        // Added animations for panel transitions
        panel.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

        // Improved dark mode support
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            panel.style.backgroundColor = 'rgba(24, 26, 27, 0.95)';
            panel.style.color = '#e5e7eb';
        }
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
        // Debounced filtering with minimal DOM writes
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

            if (changes.length) {
                requestAnimationFrame(() => {
                    for (const c of changes) this.setHiddenRow(c.row, c.hide);
                });
            }
        }, 200);
    }

    clearFilters() {
        const cache = this.getOrBuildRowCache();
        requestAnimationFrame(() => {
            for (const item of cache) this.setHiddenRow(item.row, false);
        });
    }

    setHiddenRow(row, hidden) {
        if (hidden) row.classList.add('row-hidden');
        else row.classList.remove('row-hidden');
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
        // Invalidate cache in case table changed
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
        this.markPerformance('download-start');

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
                if (ok) {
                    completed++;
                } else {
                    const prev = attemptsMap.get(row) || 0;
                    if (prev + 1 < this.retryAttempts) {
                        attemptsMap.set(row, prev + 1);
                        queue.push(row);
                    } else {
                        failed++;
                    }
                }
            } catch (e) {
                const dur = performance.now() - start;
                this.updateMetrics(dur, false);
                this.logError('Download queue error', { error: e.message });
                const prev = attemptsMap.get(row) || 0;
                if (prev + 1 < this.retryAttempts) {
                    attemptsMap.set(row, prev + 1);
                    queue.push(row);
                } else {
                    failed++;
                }
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
        this.markPerformance('download-end');
        const totalTime = this.measurePerformance('download-start', 'download-end');
        
        await this.saveHistory(completed, failed, totalTime);
        this.showSummary(completed, failed, total, totalTime);
        if (this.statusEl) {
            this.statusEl.textContent = `Completed ${completed}/${total} in ${totalTime}ms`;
        }
    }

    // Add performance tracking
    markPerformance(label) {
        this.performanceMarkers.set(label, performance.now());
    }

    measurePerformance(startLabel, endLabel) {
        const start = this.performanceMarkers.get(startLabel);
        const end = this.performanceMarkers.get(endLabel);
        if (start && end) {
            return Math.round(end - start);
        }
        return 0;
    }

    // Enhanced error logging with context
    logError(message, context = {}) {
        const errorEntry = {
            timestamp: Date.now(),
            message,
            context: {
                ...context,
                url: window.location.href,
                concurrency: this.currentConcurrency,
                queueLength: this.downloadQueue.length
            },
            userAgent: navigator.userAgent
        };
        this.errorLog.push(errorEntry);
        if (this.errorLog.length > this.maxErrorLogSize) {
            this.errorLog.shift();
        }
        console.error('[CoretaxBulk]', message, context);
    }

    // Enhanced download with validation
    async downloadDocument(row, attemptCount = 0) {
        try {
            const downloadBtn = this.findDownloadButton(row);
            if (!downloadBtn) {
                this.logError('Download button not found', { attemptCount, row: row.textContent.substring(0, 50) });
                this.showError(this.langManager.getText('downloadButtonNotFound'));
                return false;
            }

            const cacheKey = this.generateCacheKey(row);
            if (this.documentCache.has(cacheKey)) return true;

            // Validate button is clickable
            if (downloadBtn.disabled || downloadBtn.getAttribute('aria-disabled') === 'true') {
                throw new Error('Download button is disabled');
            }

            const clickEvent = new MouseEvent('click', { 
                bubbles: true, 
                cancelable: true,
                view: window 
            });
            const dispatched = downloadBtn.dispatchEvent(clickEvent);
            
            if (!dispatched) {
                throw new Error('Click event was prevented');
            }

            this.documentCache.add(cacheKey);
            return true;
        } catch (error) {
            this.logError('Download document error', { 
                error: error.message, 
                attemptCount,
                stack: error.stack 
            });
            
            if (attemptCount < this.retryAttempts) {
                await this.sleep(400 * (attemptCount + 1));
                return this.downloadDocument(row, attemptCount + 1);
            }
            this.showError(this.langManager.getText('errorDownloadingDocument'));
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
        // Stable, compact key from row content
        return this.hashString(row.textContent.trim());
    }

    hashString(str) {
        // djb2 hash
        let hash = 5381;
        for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash) + str.charCodeAt(i);
        return `r${hash >>> 0}`;
    }

    updateProgress(completed, total) {
        const percentage = total ? (completed / total) * 100 : 0;
        const pctText = `${Math.min(100, Math.max(0, percentage)).toFixed(0)}`;
        if (this.progressBar) this.progressBar.setAttribute('aria-valuenow', pctText);
        if (this.statusEl) this.statusEl.textContent = `Progress: ${pctText}%`;
        const targetWidth = `${percentage}%`;
        if (this.progressFill) {
            requestAnimationFrame(() => {
                this.progressFill.style.width = targetWidth;
            });
        }
    }

    updateMetrics(durationMs, ok) {
        const arr = this.metrics.durations;
        arr.push(durationMs);
        if (arr.length > 20) arr.shift();
        const sum = arr.reduce((a, b) => a + b, 0);
        this.metrics.avgDuration = sum / arr.length;
        if (ok) this.metrics.successes++; else this.metrics.failures++;
    }

    // Improved concurrency adjustment logic
    adjustConcurrency() {
        const avgDuration = this.metrics.avgDuration || 1000;
        if (avgDuration < 500 && this.currentConcurrency < this.maxConcurrency) {
            this.currentConcurrency++;
        } else if (avgDuration > 1500 && this.currentConcurrency > this.minConcurrency) {
            this.currentConcurrency--;
        }
        console.log(`Adjusted concurrency to: ${this.currentConcurrency}`);
    }

    async saveHistory(completed, failed, duration = 0) {
        const historyEntry = {
            timestamp: Date.now(),
            success: completed,
            failed: failed,
            duration: duration,
            concurrency: this.currentConcurrency
        };

        const { downloadHistory = [] } = await chrome.storage.local.get(['downloadHistory']);
        downloadHistory.unshift(historyEntry);
        if (downloadHistory.length > 10) downloadHistory.pop();
        await chrome.storage.local.set({ downloadHistory });
    }

    showSummary(completed, failed, total, duration = 0) {
        const avgTime = duration > 0 ? Math.round(duration / total) : 0;
        const modal = document.createElement('div');
        modal.className = 'summary-modal';
        modal.innerHTML = `
            <div class="summary-modal-content">
                <h3>${this.langManager.getText('downloadSummary')}</h3>
                <p>${this.langManager.getText('successful')}: ${completed}</p>
                <p>${this.langManager.getText('failed')}: ${failed}</p>
                <p>${this.langManager.getText('total')}: ${total}</p>
                <p>⏱️ ${this.langManager.getText('duration') || 'Duration'}: ${duration}ms (${avgTime}ms avg)</p>
                <div class="modal-buttons">
                    <button onclick="this.closest('.summary-modal').remove()">${this.langManager.getText('close')}</button>
                    ${this.errorLog.length > 0 ? `<button onclick="document.dispatchEvent(new CustomEvent('exportErrors'))">${this.langManager.getText('exportErrors') || 'Export Errors'}</button>` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add export errors handler
        document.addEventListener('exportErrors', () => {
            this.exportErrorLog();
            modal.remove();
        }, { once: true });
    }

    async exportErrorLog() {
        try {
            const blob = new Blob([JSON.stringify(this.errorLog, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `coretaxbulk-errors-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            this.logError('Failed to export error log', { error: error.message });
        }
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

    // Enhanced keyboard shortcuts with better UX
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Prevent shortcuts when user is typing
            if (e.target.matches('input, textarea, select, [contenteditable="true"]')) return;
            
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
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
                    case 'e':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.exportErrorLog();
                        }
                        break;
                }
            }
            // Close modals with Escape
            if (e.key === 'Escape') {
                const modal = document.querySelector('.filter-modal, .summary-modal');
                if (modal) modal.remove();
            }
        });
    }

    detectDocumentTypes() {
        // Invalidate row cache when types are recalculated
        this._rowCache = null;
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