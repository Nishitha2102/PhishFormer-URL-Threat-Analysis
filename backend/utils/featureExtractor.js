const axios = require('axios');
const urlModule = require('url');

const extractUrlFeatures = (urlString) => {
    let parsed;
    try {
        parsed = new URL(urlString);
    } catch(e) {
        // Fallback for parsing
        parsed = { hostname: urlString, pathname: '', href: urlString };
    }
    
    return {
        length_url: urlString.length,
        length_hostname: parsed.hostname ? parsed.hostname.length : 0,
        ip: /(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/.test(parsed.hostname) ? 1 : 0,
        nb_dots: (urlString.match(/\./g) || []).length,
        nb_hyphens: (urlString.match(/-/g) || []).length,
        nb_at: (urlString.match(/@/g) || []).length,
        nb_qm: (urlString.match(/\?/g) || []).length,
        nb_and: (urlString.match(/&/g) || []).length,
        nb_or: (urlString.match(/\|/g) || []).length,
        nb_eq: (urlString.match(/=/g) || []).length,
        nb_underscore: (urlString.match(/_/g) || []).length,
        nb_tilde: (urlString.match(/~/g) || []).length,
        nb_percent: (urlString.match(/%/g) || []).length,
        nb_slash: (urlString.match(/\//g) || []).length,
        nb_star: (urlString.match(/\*/g) || []).length,
        nb_colon: (urlString.match(/:/g) || []).length,
        nb_comma: (urlString.match(/,/g) || []).length,
        nb_semicolumn: (urlString.match(/;/g) || []).length,
        nb_dollar: (urlString.match(/\$/g) || []).length,
        http_in_path: parsed.pathname && parsed.pathname.includes('http') ? 1 : 0
    };
};

const extractHtmlFeatures = async (urlString) => {
    let html = '';
    let success = false;
    let defaultFeatures = {
        login_form: 0, external_favicon: 0, links_in_tags: 0, submit_email: 0, 
        sfh: 0, iframe: 0, popup_window: 0, right_clic: 0, domain_in_title: 0, 
        domain_with_copyright: 0, empty_title: 1, onmouseover: 0, shortening_service: 0, 
        nb_redirection: 0, nb_external_redirection: 0, web_traffic: 0, dns_record: 0, 
        google_index: 0, page_rank: 0, nb_hyperlinks: 0, ratio_intHyperlinks: 0, 
        ratio_extHyperlinks: 0, ratio_nullHyperlinks: 0, nb_extCSS: 0, ratio_intRedirection: 0
    };

    try {
        const response = await axios.get(urlString, { timeout: 3000, maxRedirects: 3 });
        html = response.data.toString().toLowerCase();
        success = true;
    } catch(e) {
        success = false;
    }

    if (success) {
        defaultFeatures.login_form = (html.includes('type="password"') || html.includes('login')) ? 1 : 0;
        defaultFeatures.iframe = html.includes('<iframe') ? 1 : 0;
        defaultFeatures.empty_title = html.includes('<title></title>') ? 1 : 0;
        defaultFeatures.right_clic = html.includes('event.button == 2') ? 1 : 0;
        defaultFeatures.submit_email = html.includes('mailto:') ? 1 : 0;
        defaultFeatures.onmouseover = html.includes('onmouseover') ? 1 : 0;
        
        let hrefMatches = html.match(/href="([^"]*)"/g) || [];
        defaultFeatures.nb_hyperlinks = hrefMatches.length;
        defaultFeatures.links_in_tags = (html.match(/<script|<link|<meta/g) || []).length > 0 ? 1 : 0;
        defaultFeatures.nb_extCSS = (html.match(/<link[^>]*rel="stylesheet"[^>]*href="http/g) || []).length;
        
        let parsed;
        try { parsed = new URL(urlString); } catch(e) { parsed = { hostname: '' }; }
        defaultFeatures.domain_in_title = html.includes(`<title>${parsed.hostname}`) ? 1 : 0;
    }
    
    // Simulate some metrics since we can't easily do WHOIS or Alexa tracking fast
    defaultFeatures.web_traffic = Math.floor(Math.random() * 1000000); // Random mock traffic rank
    
    return defaultFeatures;
};

module.exports = {
    extractUrlFeatures,
    extractHtmlFeatures
};
