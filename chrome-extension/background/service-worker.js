/**
 * PhishFormer Background Service Worker
 * Handles real-time page scans, API communication, tab badges, and warning triggers.
 */

importScripts('../utils/feature-extractor.js');

const DEFAULT_API_URL = 'http://localhost:5000/predict';
const scanCache = new Map();

// Helper to get stored API URL
async function getApiUrl() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['apiUrl'], (result) => {
            resolve(result.apiUrl || DEFAULT_API_URL);
        });
    });
}

// Perform scan on tab URL and HTML features
async function scanTab(tabId, url) {
    if (!url || url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
        updateBadge(tabId, 'SAFE', '#00e676');
        return { score: 0, verdict: 'SAFE', riskLevel: 'SAFE' };
    }

    const { urlFeatures } = extractUrlFeatures(url);

    // Get DOM HTML features from content script
    let htmlFeatures = {};
    try {
        const domResponse = await chrome.tabs.sendMessage(tabId, { action: 'EXT_GET_DOM_FEATURES' });
        if (domResponse && domResponse.htmlFeatures) {
            htmlFeatures = domResponse.htmlFeatures;
        }
    } catch (err) {
        console.log("Could not communicate with content script on tab:", tabId, err.message);
    }

    const apiUrl = await getApiUrl();
    let score = 0;
    let prediction = 'Legitimate';
    let confidence = 0.95;
    let reasons = [];

    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, fetch_html: false })
        });

        if (res.ok) {
            const data = await res.json();
            score = Math.round(data.phishing_score !== undefined ? data.phishing_score : (data.confidence * 100));
            prediction = data.prediction || (score > 50 ? 'Phishing' : 'Legitimate');
            confidence = data.confidence || 0.9;
        } else {
            throw new Error(`API returned status ${res.status}`);
        }
    } catch (err) {
        console.warn("Backend API offline or unreachable, using client heuristic fallback:", err.message);
        
        // Client heuristic fallback
        let heuristicScore = 10;
        const lowerUrl = url.toLowerCase();

        if (urlFeatures.ip) { heuristicScore += 40; reasons.push("Raw IP address used as hostname"); }
        if (urlFeatures.punycode) { heuristicScore += 35; reasons.push("Punycode homograph domain detected"); }
        if (urlFeatures.suspecious_tld) { heuristicScore += 25; reasons.push("High-risk domain extension (TLD)"); }
        if (urlFeatures.phish_hints) { heuristicScore += 25; reasons.push("Sensitive login/banking keyphrase in URL"); }
        if (urlFeatures.shortening_service) { heuristicScore += 20; reasons.push("URL shortener obfuscation"); }
        if (urlFeatures.nb_dots > 4) { heuristicScore += 20; reasons.push("Excessive subdomain depth"); }
        if (urlFeatures.prefix_suffix) { heuristicScore += 10; reasons.push("Hyphenated domain string"); }
        
        if (htmlFeatures.login_form) { heuristicScore += 15; reasons.push("Password input form present"); }
        if (htmlFeatures.sfh) { heuristicScore += 25; reasons.push("Suspicious or blank form handler"); }
        if (htmlFeatures.external_favicon) { heuristicScore += 15; reasons.push("Favicon loaded from external origin"); }

        score = Math.min(99, heuristicScore);
        prediction = score > 50 ? 'Phishing' : 'Legitimate';
    }

    // Determine badge and warning alert
    let badgeText = 'SAFE';
    let badgeColor = '#00e676';
    let riskLevel = '🟢 SAFE';

    if (score >= 70) {
        badgeText = 'RISK';
        badgeColor = '#ff4560';
        riskLevel = '🔴 CRITICAL PHISHING';
    } else if (score >= 35) {
        badgeText = 'WARN';
        badgeColor = '#ffb400';
        riskLevel = '🟠 SUSPICIOUS';
    }

    updateBadge(tabId, badgeText, badgeColor);

    const result = {
        url,
        score,
        prediction,
        riskLevel,
        confidence: (confidence * 100).toFixed(1) + '%',
        reasons: reasons.length > 0 ? reasons : ['Automated AI Model Flag'],
        urlFeatures,
        htmlFeatures,
        timestamp: Date.now()
    };

    scanCache.set(tabId, result);

    // Show warning banner on page if high risk
    if (score >= 70) {
        try {
            chrome.tabs.sendMessage(tabId, {
                action: 'EXT_SHOW_WARNING_BANNER',
                score,
                reasons: result.reasons
            });
        } catch (e) {}
    }

    return result;
}

function updateBadge(tabId, text, color) {
    chrome.action.setBadgeText({ tabId, text });
    chrome.action.setBadgeBackgroundColor({ tabId, color });
}

// Tab navigation listeners
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        scanTab(tabId, tab.url);
    }
});

// Handle messages from popup UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXT_GET_STATUS') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs && tabs[0]) {
                const tab = tabs[0];
                let cached = scanCache.get(tab.id);
                if (!cached || cached.url !== tab.url) {
                    cached = await scanTab(tab.id, tab.url);
                }
                sendResponse({ result: cached });
            } else {
                sendResponse({ result: null });
            }
        });
        return true;
    } else if (request.action === 'EXT_SCAN_TAB') {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs && tabs[0]) {
                const res = await scanTab(tabs[0].id, tabs[0].url);
                sendResponse({ result: res });
            }
        });
        return true;
    }
});
