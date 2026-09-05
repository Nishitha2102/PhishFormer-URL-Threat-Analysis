/**
 * PhishFormer Content Script
 * Inspects active DOM structure and extracts HTML features in real time.
 */

(function () {
    console.log("🛡️ PhishFormer content script loaded.");

    function extractHtmlFeatures() {
        const htmlDict = {};
        const hostname = window.location.hostname.toLowerCase();
        const htmlText = document.documentElement ? document.documentElement.innerHTML : '';

        // Login form detection
        const passwordFields = document.querySelectorAll('input[type="password"]');
        htmlDict['login_form'] = passwordFields.length > 0 ? 1 : 0;

        // Email inputs
        const emailFields = document.querySelectorAll('input[type="email"]');
        htmlDict['submit_email'] = emailFields.length > 0 ? 1 : 0;

        // Server Form Handler (SFH) and form redirections
        const forms = document.querySelectorAll('form');
        let sfhFlag = 0;
        let internalRedir = 0;
        let externalRedir = 0;

        forms.forEach(form => {
            const action = (form.getAttribute('action') || '').trim().toLowerCase();
            if (action === '' || action === 'about:blank') {
                sfhFlag = 1;
            } else if (action.startsWith('http://') || action.startsWith('https://')) {
                if (!action.includes(hostname)) {
                    sfhFlag = 1;
                    externalRedir++;
                } else {
                    internalRedir++;
                }
            } else {
                internalRedir++;
            }
        });
        htmlDict['sfh'] = sfhFlag;

        const totalRedir = internalRedir + externalRedir;
        htmlDict['ratio_intRedirection'] = totalRedir > 0 ? internalRedir / totalRedir : 0;

        // Hyperlinks analysis
        const links = document.querySelectorAll('a[href]');
        htmlDict['nb_hyperlinks'] = links.length;

        let intLinks = 0;
        let extLinks = 0;
        let nullLinks = 0;

        links.forEach(link => {
            const href = (link.getAttribute('href') || '').trim().toLowerCase();
            if (href === '' || href === '#' || href.startsWith('javascript:')) {
                nullLinks++;
            } else if (href.startsWith('http://') || href.startsWith('https://')) {
                if (href.includes(hostname)) {
                    intLinks++;
                } else {
                    extLinks++;
                }
            } else if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
                intLinks++;
            } else {
                extLinks++;
            }
        });

        const totalLinks = links.length;
        htmlDict['ratio_intHyperlinks'] = totalLinks > 0 ? intLinks / totalLinks : 0;
        htmlDict['ratio_extHyperlinks'] = totalLinks > 0 ? extLinks / totalLinks : 0;
        htmlDict['ratio_nullHyperlinks'] = totalLinks > 0 ? nullLinks / totalLinks : 0;

        // External CSS
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        let extCSS = 0;
        stylesheets.forEach(s => {
            const href = (s.getAttribute('href') || '').toLowerCase();
            if (href.startsWith('http://') || href.startsWith('https://')) {
                if (!href.includes(hostname)) extCSS++;
            }
        });
        htmlDict['nb_extCSS'] = extCSS;

        // External favicon
        const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        let extFavicon = 0;
        if (favicon) {
            const href = (favicon.getAttribute('href') || '').toLowerCase();
            if ((href.startsWith('http://') || href.startsWith('https://')) && !href.includes(hostname)) {
                extFavicon = 1;
            }
        }
        htmlDict['external_favicon'] = extFavicon;

        // iFrame
        const iframes = document.querySelectorAll('iframe');
        htmlDict['iframe'] = iframes.length > 0 ? 1 : 0;

        // Popup windows in scripts
        const scripts = document.querySelectorAll('script');
        let popupFlag = 0;
        scripts.forEach(s => {
            if (s.textContent && s.textContent.toLowerCase().includes('window.open')) {
                popupFlag = 1;
            }
        });
        htmlDict['popup_window'] = popupFlag;

        // Right click and onmouseover prevention
        htmlDict['right_clic'] = (htmlText.toLowerCase().includes('oncontextmenu') || htmlText.toLowerCase().includes('event.button == 2')) ? 1 : 0;
        htmlDict['onmouseover'] = htmlText.toLowerCase().includes('onmouseover') ? 1 : 0;

        // Title checks
        const titleText = (document.title || '').trim().toLowerCase();
        htmlDict['empty_title'] = titleText === '' ? 1 : 0;

        const mainDomainPart = hostname.split('.')[0];
        htmlDict['domain_in_title'] = (titleText && mainDomainPart && titleText.includes(mainDomainPart)) ? 1 : 0;
        htmlDict['domain_with_copyright'] = (htmlText.includes('©') || htmlText.includes('&copy;')) ? 1 : 0;

        return htmlDict;
    }

    // Listen for background requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'EXT_GET_DOM_FEATURES') {
            const features = extractHtmlFeatures();
            sendResponse({ htmlFeatures: features });
        } else if (request.action === 'EXT_SHOW_WARNING_BANNER') {
            if (window.phishformerShowBanner) {
                window.phishformerShowBanner(request.score, request.reasons);
            }
            sendResponse({ status: 'banner_displayed' });
        } else if (request.action === 'EXT_HIDE_WARNING_BANNER') {
            if (window.phishformerHideBanner) {
                window.phishformerHideBanner();
            }
            sendResponse({ status: 'banner_hidden' });
        }
        return true;
    });
})();
