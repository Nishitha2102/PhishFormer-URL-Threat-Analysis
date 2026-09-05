/**
 * PhishFormer Warning Banner Injector
 * Displays a non-intrusive high-risk alert banner at the top of dangerous web pages.
 */

(function () {
    const BANNER_ID = 'phishformer-security-alert-banner';

    window.phishformerShowBanner = function (score, reasons) {
        if (document.getElementById(BANNER_ID)) return;

        const banner = document.createElement('div');
        banner.id = BANNER_ID;

        // Custom shadow DOM container to avoid site CSS pollution
        const shadow = banner.attachShadow({ mode: 'open' });

        const reasonListHtml = (reasons || ['Suspicious domain structure', 'Potential credential harvesting form'])
            .map(r => `<li>⚠️ ${r}</li>`)
            .join('');

        shadow.innerHTML = `
            <style>
                :host {
                    all: initial;
                    display: block;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 2147483647;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                .banner-container {
                    background: linear-gradient(135deg, #1e0508 0%, #3a0d14 100%);
                    border-bottom: 2px solid #ff4560;
                    color: #ffffff;
                    padding: 12px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 4px 20px rgba(255, 69, 96, 0.4);
                }
                .banner-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .shield-icon {
                    width: 36px;
                    height: 36px;
                    background: #ff4560;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: bold;
                    box-shadow: 0 0 12px rgba(255, 69, 96, 0.8);
                }
                .banner-info {
                    display: flex;
                    flex-direction: column;
                }
                .title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #ff4560;
                    letter-spacing: 0.5px;
                }
                .subtitle {
                    font-size: 12px;
                    color: #cbd5e1;
                    margin-top: 2px;
                }
                .reasons-box {
                    font-size: 11px;
                    color: #f87171;
                    margin-top: 4px;
                }
                .reasons-box ul {
                    margin: 0;
                    padding-left: 14px;
                    list-style: none;
                    display: flex;
                    gap: 12px;
                }
                .banner-right {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .btn-leave {
                    background: #ff4560;
                    color: #ffffff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-leave:hover {
                    background: #e0314b;
                }
                .btn-dismiss {
                    background: transparent;
                    color: #94a3b8;
                    border: 1px solid #475569;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    cursor: pointer;
                }
                .btn-dismiss:hover {
                    color: #ffffff;
                    border-color: #cbd5e1;
                }
            </style>
            <div class="banner-container">
                <div class="banner-left">
                    <div class="shield-icon">🛡️</div>
                    <div class="banner-info">
                        <div class="title">⚠️ PHISHFORMER SECURITY ALERT: HIGH PHISHING RISK (${score}%)</div>
                        <div class="subtitle">This webpage exhibits characteristics of a fake or deceptive website attempting to steal information.</div>
                        <div class="reasons-box">
                            <ul>${reasonListHtml}</ul>
                        </div>
                    </div>
                </div>
                <div class="banner-right">
                    <button class="btn-leave" id="btn-leave">🚪 Leave Page Safely</button>
                    <button class="btn-dismiss" id="btn-dismiss">Ignore Warning</button>
                </div>
            </div>
        `;

        document.body.prepend(banner);

        shadow.getElementById('btn-leave').addEventListener('click', () => {
            window.location.href = 'https://google.com';
        });

        shadow.getElementById('btn-dismiss').addEventListener('click', () => {
            banner.remove();
        });
    };

    window.phishformerHideBanner = function () {
        const existing = document.getElementById(BANNER_ID);
        if (existing) existing.remove();
    };
})();
