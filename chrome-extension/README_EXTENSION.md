# 🛡️ PhishFormer - Google Chrome Extension Guide

The **PhishFormer Chrome Extension (Manifest V3)** brings real-time AI phishing detection directly into your web browser. It extracts lexical URL features and analyzes active DOM structure to alert users before credentials can be stolen.

---

## 🚀 How to Install the Extension in Google Chrome

Follow these simple steps to load the extension into your browser:

### Step 1: Open Chrome Extensions Page
1. Open **Google Chrome** (or Microsoft Edge / Brave / Opera).
2. Type `chrome://extensions/` in the address bar and press **Enter**.

### Step 2: Enable Developer Mode
1. In the top-right corner of the Extensions page, toggle **Developer mode** to **ON** (blue switch).

### Step 3: Load the Unpacked Extension
1. Click the **Load unpacked** button in the top-left menu.
2. Select the `chrome-extension` folder located inside your project directory:
   `c:\Users\Nishitha\Downloads\phishformers\phishformer\chrome-extension`
3. Click **Select Folder**.

🎉 **Done!** You will now see the **PhishFormer - AI Phishing Detector** icon 🛡️ in your Chrome extension toolbar!

---

## ⚡ How It Works

1. **Automatic Navigation Scanning**:
   - Every time you open or navigate to a webpage, the background service worker extracts 20+ URL structural features.
2. **DOM Signal Extraction**:
   - The content script inspects the webpage for password forms, suspicious form action endpoints (`sfh`), hidden `iframe` overlays, external favicons, and broken link ratios.
3. **Model Prediction**:
   - The extension sends features to your local PhishFormer API (`http://localhost:5000/predict`).
   - If the local backend is offline, an integrated client heuristic safety engine takes over instantly.
4. **Dynamic Action Badges & Warning Banners**:
   - 🟢 **SAFE**: Phishing risk score < 30%.
   - 🟠 **WARN**: Suspicious flags detected (score 30% - 70%).
   - 🔴 **RISK**: High Phishing Risk (score > 70%). Automatically injects a **Top Security Warning Alert Banner** onto the dangerous webpage!

---

## 📁 Extension File Structure

```
chrome-extension/
├── manifest.json                # Manifest V3 Configuration
├── README_EXTENSION.md          # Setup & Usage Guide
├── generate_icons.py            # Python Script for Icon Assets
├── icons/                       # Extension Toolbar Icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── utils/
│   └── feature-extractor.js      # JS lexical URL feature extractor
├── content/
│   ├── content.js               # DOM scanner content script
│   └── warning-banner.js        # High-risk alert banner injector
├── background/
│   └── service-worker.js        # Background worker & tab scan manager
└── popup/
    ├── popup.html               # Sleek dark-themed popup UI
    ├── popup.css                # Glassmorphism styling & animations
    └── popup.js                 # UI controller & SVG gauge renderer
```

---

## 🧪 Testing the Extension

### Test Safe Sites:
- Visit `https://google.com` or `https://github.com`.
- Click the PhishFormer toolbar icon.
- You will see a green **0% - 10% Risk Score**, green `SAFE` badge, and clean security indicators.

### Test High-Risk / Suspicious Links:
- Visit a test link with phishing keywords or IP hosts (e.g. `http://secure-paypa1.com/verify` or local test server).
- The extension badge turns **RED (`RISK`)** and injects an alert banner at the top of the browser tab warning you not to enter passwords.

---

## ⚙️ Backend Connection Setup
By default, the extension connects to `http://localhost:5000/predict`. Ensure your Flask backend is running:

```bash
python app.py
```

If deployed on Railway or cloud servers, you can update `DEFAULT_API_URL` in [`service-worker.js`](file:///c:/Users/Nishitha/Downloads/phishformers/phishformer/chrome-extension/background/service-worker.js#L7) to point to your live backend domain.
