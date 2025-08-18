<div align="center">

# CoretaxBulk

*Streamline your Coretax workflow with intelligent bulk operations*

[![GitHub Stars](https://img.shields.io/github/stars/thunderkex/CoretaxBulk?style=flat-square&logo=star&color=yellow)](https://github.com/thunderkex/CoretaxBulk/stargazers)
[![Latest Release](https://img.shields.io/github/v/release/thunderkex/CoretaxBulk?style=flat-square&logo=github&color=blue)](https://github.com/thunderkex/CoretaxBulk/releases/latest)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://github.com/thunderkex/CoretaxBulk/blob/main/LICENSE)

**[📥 Download for Chrome](https://github.com/thunderkex/CoretaxBulk/releases/latest)** • **[📥 Download for Firefox](https://github.com/thunderkex/CoretaxBulk/releases/latest)**

</div>

## ✨ Features

**📦 Bulk Operations** - Download multiple Coretax documents simultaneously  
**🎯 Smart Filtering** - Filter by text search and document type  
**📊 Progress Tracking** - Real-time progress bars and download statistics  
**🌐 Language Support** - Switch between Indonesian (ID) and English (EN)  
**⚡ Keyboard Shortcuts** - `Ctrl+D` start, `Ctrl+Shift+A` select all  
**🔄 Auto Retry** - Intelligent retry logic for failed downloads  
**📱 Modern UI** - Clean, minimizable interface with error notifications  
**🎨 Accessibility** - High contrast and reduced motion support  
**🌙 Dark Mode** - Automatic dark mode detection  

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 88+ | ✅ Supported |
| Firefox | 78+ | ✅ Supported |

## 📥 Installation

### Chrome
1. Download `coretax-bulk-chrome.zip` from [releases](https://github.com/thunderkex/CoretaxBulk/releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top right)
5. Click **Load unpacked** and select the extracted folder

### Firefox  
1. Download `coretax-bulk-firefox.zip` from [releases](https://github.com/thunderkex/CoretaxBulk/releases)
2. Extract the ZIP file
3. Open Firefox and go to `about:debugging`
4. Click **This Firefox** → **Load Temporary Add-on**
5. Select any file from the extracted folder

## 🚀 Quick Start

1. Navigate to Coretax document list pages
2. The extension panel will appear in the bottom-left corner
3. Use **Select All** to select documents or manually check boxes
4. Optionally use **Filter** to narrow down documents
5. Click **Download** to start bulk downloading
6. Monitor progress in real-time
7. Change language via the popup settings (click extension icon)

### Keyboard Shortcuts
- `Ctrl+D` - Start download
- `Ctrl+Shift+A` - Select/deselect all
- `Ctrl+Shift+F` - Open filter modal
- `Ctrl+Shift+M` - Minimize/maximize panel

## ⚙️ Configuration

Configure the extension via the popup (click extension icon):

- **Language**: Switch between Indonesian (🇮🇩) and English (🇺🇸)
- **Parallel Downloads**: 1-5 concurrent downloads
- **Download Delay**: 500-5000ms between batches
- **View History**: See recent download statistics

Settings are automatically saved and synchronized across the interface.

## 🛠️ Development

### Quick Start
```bash
git clone https://github.com/thunderkex/CoretaxBulk
cd CoretaxBulk
```

### Chrome Development
1. Navigate to `chrome/` directory
2. Load unpacked in Chrome developer mode
3. Make changes and reload extension

### Firefox Development  
1. Navigate to `firefox/` directory
2. Load temporary add-on in Firefox
3. Changes require reloading the add-on

### Project Structure
```
coretaxbulk/
├── chrome/           # Chrome extension files
├── firefox/          # Firefox extension files
├── .github/          # GitHub Actions
└── README.md
```

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes with proper testing
4. Submit a pull request with clear description

---

## 📦 Automated Releases

GitHub Actions automatically creates releases with:
- Chrome extension package (`coretax-bulk-chrome.zip`)
- Firefox extension package (`coretax-bulk-firefox.zip`)  
- Complete source code (`coretax-bulk-source.zip`)

**Create a release:**
```bash
git tag v1.6.0
git push origin v1.6.0
```

---

## 🔒 Privacy & Security

- **No data collection**: All data stays on your device
- **Local storage only**: Settings saved in browser storage
- **No external requests**: Extension works entirely locally
- **Open source**: Full code transparency

---

## 🐛 Troubleshooting

**Extension not appearing?**
- Ensure you're on a Coretax document list page
- Check if developer mode is enabled (Chrome)
- Try refreshing the page

**Downloads not working?**
- Check browser download settings
- Ensure pop-ups are allowed for Coretax domain
- Try reducing parallel downloads in settings

**Performance issues?**
- Reduce parallel downloads to 1-2
- Increase download delay to 1000ms+
- Clear browser cache and restart

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

**Disclaimer**: This extension is provided as-is for educational and convenience purposes. Users are responsible for compliance with all applicable terms of service and regulations. Use at your own risk.

---

## 💬 Support

- 🐛 **Issues**: [Report bugs](https://github.com/thunderkex/CoretaxBulk/issues/new/choose)
- 💭 **Discussions**: [Ask questions](https://github.com/thunderkex/CoretaxBulk/discussions)  
- 📚 **Wiki**: [Read docs](https://github.com/thunderkex/CoretaxBulk/wiki)

---

<div align="center">

⭐ Star this repository if it helped you!

</div>