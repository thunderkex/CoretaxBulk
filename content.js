/**
 * Created by thunderkex
 */

class SimpleDocDownloader {
    constructor() {
        this.createUI();
        this.loadSettings();
    }

    async loadSettings() {
        const result = await chrome.storage.local.get(['parallelDownloads', 'downloadDelay']);
        this.parallelDownloads = result.parallelDownloads || 3;
        this.downloadDelay = result.downloadDelay || 1000;
    }

    // Bikin tombol download dan progress bar
    createUI() {
        const panel = document.createElement('div');
        panel.className = 'download-panel';

        // Select All button
        const selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = 'Pilih Semua';
        selectAllBtn.className = 'select-all-btn';
        selectAllBtn.addEventListener('click', () => this.toggleSelectAll());

        // Filter button
        const filterBtn = document.createElement('button');
        filterBtn.textContent = 'Filter';
        filterBtn.className = 'filter-btn';
        filterBtn.addEventListener('click', () => this.showFilterModal());

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Dokumen';
        downloadBtn.className = 'download-btn';
        downloadBtn.addEventListener('click', () => this.startDownload());

        // Progress bar container
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);

        panel.append(selectAllBtn, filterBtn, downloadBtn, progressBar);
        document.body.appendChild(panel);

        this.progressFill = progressFill;
    }

    showFilterModal() {
        const modal = document.createElement('div');
        modal.className = 'filter-modal';
        modal.innerHTML = `
            <div class="filter-modal-content">
                <h3>Filter Dokumen</h3>
                <input type="text" id="filterText" placeholder="Masukkan teks pencarian...">
                <button onclick="document.querySelector('.filter-modal').remove()">Tutup</button>
                <button onclick="document.dispatchEvent(new CustomEvent('applyFilter'))">Terapkan</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.addEventListener('applyFilter', () => {
            const filterText = document.getElementById('filterText').value.toLowerCase();
            this.filterDocuments(filterText);
            modal.remove();
        });
    }

    filterDocuments(text) {
        const rows = document.querySelectorAll('table.p-datatable-table tbody tr');
        rows.forEach(row => {
            const content = row.textContent.toLowerCase();
            row.style.display = content.includes(text) ? '' : 'none';
        });
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('table.p-datatable-table tbody tr input[type="checkbox"]');
        const someUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
        checkboxes.forEach(cb => cb.checked = someUnchecked);
    }

    // Mulai proses download
    async startDownload() {
        const rows = document.querySelectorAll('table.p-datatable-table tbody tr');
        const selectedRows = Array.from(rows).filter(row => {
            const checkbox = row.querySelector('input[type="checkbox"]');
            return checkbox && checkbox.checked && row.style.display !== 'none';
        });

        // Kalo nggak ada yang dipilih
        if (selectedRows.length === 0) {
            alert('Harap pilih setidaknya satu dokumen.');
            return;
        }

        const total = selectedRows.length;
        let completed = 0;
        let failed = 0;

        // Process downloads in parallel batches
        for (let i = 0; i < selectedRows.length; i += this.parallelDownloads) {
            const batch = selectedRows.slice(i, i + this.parallelDownloads);
            await Promise.all(batch.map(async row => {
                try {
                    const downloadBtn = row.querySelector('button#DownloadButton, button[aria-label*="unduh"], button[aria-label*="download"], button[title*="unduh"], button[title*="download"]');
                    if (downloadBtn) {
                        downloadBtn.click();
                        completed++;
                    } else {
                        failed++;
                        row.style.border = '2px solid red';
                        console.error('Tombol unduh tidak ditemukan:', row);
                    }
                } catch (error) {
                    failed++;
                    console.error('Error downloading document:', error);
                }

                // Only update progress after each successful download
                if (completed > 0) {
                    const percentage = (completed / total) * 100;
                    this.progressFill.style.width = `${percentage}%`;
                }
            }));

            await this.sleep(this.downloadDelay);
        }

        // Save to download history
        const historyEntry = {
            timestamp: new Date().getTime(),
            success: completed,
            failed: failed
        };

        chrome.storage.local.get(['downloadHistory'], (result) => {
            const history = result.downloadHistory || [];
            history.unshift(historyEntry);
            if (history.length > 10) history.pop(); // Keep only last 10 entries
            chrome.storage.local.set({ downloadHistory: history });
        });

        this.showSummary(completed, failed, total);
    }

    showSummary(completed, failed, total) {
        const modal = document.createElement('div');
        modal.className = 'summary-modal';
        modal.innerHTML = `
            <div class="summary-modal-content">
                <h3>Ringkasan Unduhan</h3>
                <p>Berhasil: ${completed}</p>
                <p>Gagal: ${failed}</p>
                <p>Total: ${total}</p>
                <button onclick="this.closest('.summary-modal').remove()">Tutup</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Fungsi buat jeda
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Jalankan ekstensinya
new SimpleDocDownloader();