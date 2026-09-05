/**
 * PhishFormer Popup Script
 * UI controller for real-time risk gauge rendering and feature visualization.
 */

document.addEventListener('DOMContentLoaded', () => {
    const urlText = document.getElementById('url-text');
    const gaugeScore = document.getElementById('gauge-score');
    const gaugeFill = document.getElementById('gauge-fill');
    const riskBadge = document.getElementById('risk-badge');
    const signalsGrid = document.getElementById('signals-grid');
    const recsSection = document.getElementById('recs-section');
    const btnRescan = document.getElementById('btn-rescan');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('status-text');

    // Circumference of r=42 circle is 2 * PI * 42 = ~263.89
    const CIRCUMFERENCE = 264;

    checkBackendHealth();
    loadTabScanResult();

    btnRescan.addEventListener('click', () => {
        btnRescan.innerText = "⏳ Scanning...";
        btnRescan.disabled = true;
        
        chrome.runtime.sendMessage({ action: 'EXT_SCAN_TAB' }, (response) => {
            btnRescan.innerText = "⚡ Rescan Active Tab";
            btnRescan.disabled = false;
            if (response && response.result) {
                renderScanResult(response.result);
            }
        });
    });

    async function checkBackendHealth() {
        try {
            const res = await fetch('http://localhost:5000/health', { signal: AbortSignal.timeout(2000) });
            if (res.ok) {
                statusDot.classList.remove('offline');
                statusText.innerText = "API Connected";
            } else {
                throw new Error();
            }
        } catch (e) {
            statusDot.classList.add('offline');
            statusText.innerText = "Offline (Local Engine)";
        }
    }

    function loadTabScanResult() {
        chrome.runtime.sendMessage({ action: 'EXT_GET_STATUS' }, (response) => {
            if (response && response.result) {
                renderScanResult(response.result);
            } else {
                urlText.innerText = "Active Tab Unavailable";
            }
        });
    }

    function renderScanResult(data) {
        urlText.innerText = data.url || 'Active Tab';

        const score = data.score !== undefined ? data.score : 0;
        animateGauge(score);

        // Color coding logic
        let color = '#00e676';
        let badgeBg = 'rgba(0, 230, 118, 0.15)';
        let badgeBorder = 'rgba(0, 230, 118, 0.3)';
        let badgeLabel = '🟢 LEGITIMATE';

        if (score >= 70) {
            color = '#ff4560';
            badgeBg = 'rgba(255, 69, 96, 0.15)';
            badgeBorder = 'rgba(255, 69, 96, 0.4)';
            badgeLabel = '🔴 PHISHING RISK';
        } else if (score >= 35) {
            color = '#ffb400';
            badgeBg = 'rgba(255, 180, 0, 0.15)';
            badgeBorder = 'rgba(255, 180, 0, 0.4)';
            badgeLabel = '🟠 SUSPICIOUS';
        }

        gaugeFill.style.stroke = color;
        riskBadge.innerText = badgeLabel;
        riskBadge.style.color = color;
        riskBadge.style.background = badgeBg;
        riskBadge.style.borderColor = badgeBorder;

        // Render Security Indicator Tags
        signalsGrid.innerHTML = '';
        const urlFeats = data.urlFeatures || {};
        const htmlFeats = data.htmlFeatures || {};

        const tags = [];

        if (urlFeats.ip) tags.push({ label: 'Raw IP Hostname', danger: true });
        if (urlFeats.punycode) tags.push({ label: 'Punycode Homograph', danger: true });
        if (urlFeats.suspecious_tld) tags.push({ label: 'High-Risk TLD', danger: true });
        if (urlFeats.phish_hints) tags.push({ label: 'Phish Keyphrases', danger: true });
        if (urlFeats.shortening_service) tags.push({ label: 'URL Shortener', danger: true });
        if (urlFeats.nb_dots > 3) tags.push({ label: `Deep Subdomains (${urlFeats.nb_dots} dots)`, danger: true });
        
        if (htmlFeats.login_form) tags.push({ label: 'Password Input Form', danger: score > 50 });
        if (htmlFeats.sfh) tags.push({ label: 'Suspicious Form Handler', danger: true });
        if (htmlFeats.external_favicon) tags.push({ label: 'External Favicon', danger: true });

        if (urlFeats.length_url < 40 && !urlFeats.ip && !urlFeats.phish_hints) {
            tags.push({ label: 'Standard URL Length', danger: false });
        }
        if (urlFeats.nb_dots <= 2) {
            tags.push({ label: 'Normal Subdomain Depth', danger: false });
        }

        if (tags.length === 0) {
            tags.push({ label: 'Standard Domain DNA', danger: false });
        }

        tags.forEach(t => {
            const tagEl = document.createElement('div');
            tagEl.className = `signal-tag ${t.danger ? 'danger' : 'safe'}`;
            tagEl.innerText = `${t.danger ? '⚠️' : '✅'} ${t.label}`;
            signalsGrid.appendChild(tagEl);
        });

        // Recommendations
        recsSection.innerHTML = '';
        if (score >= 70) {
            recsSection.innerHTML = `
                <div class="rec-item">⚠️ <strong>DO NOT</strong> enter passwords or personal data.</div>
                <div class="rec-item">❌ Do not click unverified links or downloads.</div>
                <div class="rec-item">📢 Close this tab immediately if unexpected.</div>
            `;
        } else if (score >= 35) {
            recsSection.innerHTML = `
                <div class="rec-item">⚡ Double check domain spelling before logging in.</div>
                <div class="rec-item">🔒 Ensure valid SSL certificate and HTTPS.</div>
            `;
        } else {
            recsSection.innerHTML = `
                <div class="rec-item">✅ Website appears safe based on AI model analysis.</div>
                <div class="rec-item">🔒 Always verify HTTPS in address bar.</div>
            `;
        }
    }

    function animateGauge(targetScore) {
        let current = 0;
        const duration = 800;
        const startTime = performance.now();

        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            current = Math.floor(targetScore * easeOut);

            gaugeScore.innerText = `${current}%`;

            const offset = CIRCUMFERENCE - (CIRCUMFERENCE * (current / 100));
            gaugeFill.style.strokeDashoffset = offset;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }
});
