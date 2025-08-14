# CoretaxBulk Browser Extension

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/thunderkex/CoretaxBulk)](https://github.com/thunderkex/CoretaxBulk/releases/latest)
[![GitHub all releases](https://img.shields.io/github/downloads/thunderkex/CoretaxBulk/total)](https://github.com/thunderkex/CoretaxBulk/releases)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://github.com/thunderkex/CoretaxBulk/releases/latest)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange?logo=firefox)](https://github.com/thunderkex/CoretaxBulk/releases/latest)

A browser extension for bulk operations on Coretax platform, available for both Chrome and Firefox browsers.

## 📥 Download

<div align="center">
  <a href="https://github.com/thunderkex/CoretaxBulk/releases/latest">
    <img src="https://img.shields.io/badge/Download%20Latest%20Release-4CAF50?style=for-the-badge&logo=download&logoColor=white" alt="Download Latest Release" width="300">
  </a>
</div>

## Features

- Bulk operations for Coretax platform
- Cross-browser compatibility (Chrome and Firefox)
- User-friendly popup interface
- Custom styling and content modification

## Installation

### Chrome Installation

1. Download the latest `coretax-bulk-chrome.zip` from the [Releases](https://github.com/thunderkex/CoretaxBulk/releases) page
2. Extract the ZIP file to a folder
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the extracted folder
6. The extension will now be available in your Chrome toolbar

### Firefox Installation

1. Download the latest `coretax-bulk-firefox.zip` from the [Releases](https://github.com/thunderkex/CoretaxBulk/releases) page
2. Extract the ZIP file to a folder
3. Open Firefox and navigate to `about:debugging`
4. Click "This Firefox" in the left sidebar
5. Click "Load Temporary Add-on"
6. Select any file from the extracted folder
7. The extension will now be available in your Firefox toolbar

## File Structure

```
CoretaxBulk/
├── chrome/                 # Chrome extension files
│   ├── manifest.json      # Chrome extension manifest
│   ├── popup.html         # Extension popup interface
│   ├── popup.js           # Popup functionality
│   ├── content.js         # Content script for page interaction
│   ├── style.js           # Style manipulation scripts
│   └── styles.css         # Extension styling
├── firefox/               # Firefox extension files
│   ├── manifest.json      # Firefox extension manifest
│   ├── popup.html         # Extension popup interface
│   ├── popup.js           # Popup functionality
│   ├── content.js         # Content script for page interaction
│   └── styles.css         # Extension styling
└── .github/workflows/     # GitHub Actions for automated releases
    └── release.yml        # Release workflow configuration
```

## Development

### Building from Source

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd CoretaxBulk
   ```

2. For Chrome development:
   - Navigate to the `chrome/` directory
   - Load the extension in Chrome as described in the installation section

3. For Firefox development:
   - Navigate to the `firefox/` directory
   - Load the extension in Firefox as described in the installation section

### Making Changes

- Modify files in the respective browser directories (`chrome/` or `firefox/`)
- The extensions will automatically reload when you make changes (in developer mode)
- Test thoroughly on both browsers before creating releases

## Releases

Releases are automatically created using GitHub Actions when tags are pushed to the repository. Each release includes:

- `coretax-bulk-chrome.zip` - Chrome extension package
- `coretax-bulk-firefox.zip` - Firefox extension package
- `coretax-bulk-source.zip` - Complete source code

To create a new release:

1. Create and push a new tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. The GitHub Actions workflow will automatically build and create the release

## Browser Compatibility

- **Chrome**: Version 88 and above
- **Firefox**: Version 78 and above

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both Chrome and Firefox
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and support, please create an issue in the GitHub repository.