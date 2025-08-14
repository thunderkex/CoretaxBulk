# Coretax Batch Download Extension - Wiki

## Overview

The **Coretax Batch Download Extension** is a browser extension designed to automate the bulk downloading of tax documents from the Coretax portal. It supports both Chrome and Firefox browsers and provides advanced features for filtering, progress tracking, and batch processing.

## Table of Contents

- [Installation](#installation)
- [Core Features](#core-features)
- [User Interface](#user-interface)
- [Configuration](#configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Browser Compatibility](#browser-compatibility)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)

## Installation

### Chrome Installation
1. Download the Chrome extension files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `chrome` folder

### Firefox Installation
1. Download the Firefox extension files
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from the `firefox` folder

## Core Features

### 1. Batch Document Download
- **Parallel Processing**: Download multiple documents simultaneously (1-5 parallel downloads)
- **Queue Management**: Intelligent queue system to handle large batches
- **Retry Mechanism**: Automatic retry for failed downloads (up to 3 attempts)
- **Progress Tracking**: Real-time progress bar showing download completion
- **Document Caching**: Prevents duplicate downloads using content-based caching

### 2. Document Selection
- **Select All/None**: Toggle selection of all visible documents
- **Individual Selection**: Manual checkbox selection for specific documents
- **Filtered Selection**: Select only documents that match current filters

### 3. Advanced Filtering System
- **Text Search**: Filter documents by text content with multi-keyword support
- **Document Type Filter**: Automatic detection and filtering by document types:
  - Invoice/Faktur
  - Receipt/Kwitansi
  - Report/Laporan
- **Real-time Filtering**: Debounced search with 300ms delay for smooth performance
- **Filter Persistence**: Maintains filter state during session

### 4. Progress Monitoring
- **Visual Progress Bar**: Animated progress indicator with gradient effects
- **Download Statistics**: Track successful, failed, and total downloads
- **Download Summary**: Modal showing completion statistics
- **Error Notifications**: Real-time error popups with auto-dismiss

### 5. Settings Management
- **Parallel Downloads**: Configure 1-5 simultaneous downloads
- **Download Delay**: Adjustable delay between batches (500-5000ms)
- **Settings Persistence**: Automatically saved to browser storage
- **Validation**: Input validation for all settings

### 6. Download History
- **Session Tracking**: Records download sessions with timestamps
- **Success/Failure Counts**: Detailed statistics for each session
- **History Limit**: Maintains last 10 download sessions
- **History Management**: Clear history functionality

## User Interface

### Main Panel
The floating download panel includes:
- **Minimize Button**: Collapse panel to save screen space
- **Select All Button**: Toggle selection of all documents
- **Filter Button**: Open advanced filter modal
- **Download Button**: Start batch download process
- **Progress Bar**: Visual download progress indicator

### Filter Modal
- **Search Input**: Text-based filtering with auto-focus
- **Type Dropdown**: Document type selection
- **Action Buttons**: Apply, Clear, and Close options
- **Real-time Preview**: Instant filtering as you type

### Settings Popup
- **Parallel Downloads**: Dropdown with safety recommendations
- **Download Delay**: Number input with validation
- **Download History**: List of recent sessions
- **Warning Notice**: Important usage disclaimer

## Configuration

### Performance Settings

#### Parallel Downloads
- **1 (Safest)**: Single download at a time, minimal server load
- **2-3 (Recommended)**: Balanced speed and reliability
- **4-5 (Fastest)**: Maximum speed, higher server load

#### Download Delay
- **Minimum**: 500ms (safe for most scenarios)
- **Recommended**: 650ms (default setting)
- **Maximum**: 5000ms (for slow connections)

### Document Detection
The extension automatically detects document types based on content:
- Searches for keywords in Indonesian and English
- Builds dynamic filter options based on detected types
- Updates filter options for each page session

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + D` | Start download process |
| `Ctrl/Cmd + Shift + A` | Toggle select all |
| `Ctrl/Cmd + Shift + F` | Open filter modal |
| `Ctrl/Cmd + Shift + M` | Toggle minimize panel |

## Browser Compatibility

### Chrome Extension (Manifest V3)
- **Minimum Version**: Chrome 88+
- **Permissions**: Storage, Host permissions for Coretax domains
- **APIs**: Chrome Storage API, Content Scripts
- **Security**: Content Security Policy compliant

### Firefox Extension (Manifest V2)
- **Minimum Version**: Firefox 57+
- **Permissions**: Storage, Host permissions for Coretax domains
- **APIs**: Browser Storage API, Content Scripts
- **Compatibility**: WebExtensions API

### Supported Coretax URLs
- `https://coretaxdjp.pajak.go.id/e-invoice-portal/id-ID/output-tax/*`
- `https://coretaxdjp.pajak.go.id/e-invoice-portal/id-ID/input-tax/*`
- `https://coretaxdjp.pajak.go.id/withholding-slips-portal/*`
- `https://coretaxdjp.pajak.go.id/returnsheets-portal/*`

## Technical Details

### Architecture
- **Content Script**: Main functionality injected into Coretax pages
- **Popup Script**: Settings and history management
- **Storage System**: Browser local storage for persistence
- **Event System**: Custom events for modal interactions

### Document Detection Strategy
```javascript
// Button detection selectors
'button#DownloadButton, ' +
'button[aria-label*="unduh"], ' +
'button[aria-label*="download"], ' +
'button[title*="unduh"], ' +
'button[title*="download"]'
```

### Cache System
- **Key Generation**: Based on row text content
- **Purpose**: Prevent duplicate downloads
- **Scope**: Session-based (cleared on page reload)

### Error Handling
- **Network Errors**: Automatic retry with exponential backoff
- **Button Detection**: Graceful failure with error notifications
- **Validation**: Input validation for all user settings

## Troubleshooting

### Common Issues

#### Downloads Not Starting
1. **Check Selection**: Ensure documents are selected
2. **Check Filters**: Verify documents are visible after filtering
3. **Check Permissions**: Ensure extension has required permissions

#### Slow Download Speed
1. **Reduce Parallel Downloads**: Lower the parallel download count
2. **Increase Delay**: Add more delay between batches
3. **Check Network**: Verify stable internet connection

#### Missing Download Buttons
1. **Page Loading**: Wait for page to fully load
2. **DOM Changes**: Refresh page if layout changes
3. **Site Updates**: Extension may need updates for site changes

#### Extension Not Loading
1. **Check Permissions**: Verify host permissions are granted
2. **Developer Mode**: Ensure developer mode is enabled (Chrome)
3. **Temporary Add-on**: Reload temporary add-on (Firefox)

### Performance Tips
- **Optimal Settings**: Use 3 parallel downloads with 650ms delay
- **Large Batches**: Process in smaller chunks for better reliability
- **Network Conditions**: Adjust settings based on connection quality

### Browser-Specific Notes

#### Chrome
- Uses Manifest V3 for enhanced security
- Requires explicit host permissions
- Supports advanced CSP policies

#### Firefox
- Uses Manifest V2 (legacy but stable)
- More permissive permission model
- Requires browser_specific_settings for proper identification

## Security Considerations

### Privacy
- **No Data Collection**: Extension doesn't collect or transmit user data
- **Local Storage Only**: All data stored locally in browser
- **No External Requests**: Only interacts with Coretax domains

### Compliance Warning
⚠️ **Important**: This automation tool may violate Coretax terms of service. Users should:
- Review Coretax terms and conditions
- Use responsibly and within reasonable limits
- Accept full responsibility for usage
- Consider manual downloads for compliance

## Version History

### v1.5 (Current)
- Advanced filtering system
- Improved error handling
- Enhanced UI/UX with animations
- Firefox compatibility
- Keyboard shortcuts
- Download history tracking

## Developer Information

**Created by**: [Thunderkex](https://github.com/thunderkex/)
**License**: Use at your own risk
**Support**: Check GitHub repository for issues and updates

---

*This extension is provided as-is for educational and convenience purposes. Users are responsible for compliance with all applicable terms of service and regulations.*