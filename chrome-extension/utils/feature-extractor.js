/**
 * PhishFormer Feature Extractor (JavaScript Edition)
 * Extracts lexical and structural URL features in real time.
 */

const SHORTENING_SERVICES = ['bit.ly', 'goo.gl', 'tinyurl', 't.co', 'ow.ly', 'is.gd', 'buff.ly', 'adf.ly', 'bit.do'];
const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work', '.click', '.loan', '.fit', '.cfd'];
const PHISH_KEYWORDS = ['login', 'signin', 'verify', 'account', 'banking', 'secure', 'update', 'confirm', 'password', 'webmail', 'auth'];
const BRAND_KEYWORDS = ['apple', 'google', 'facebook', 'microsoft', 'amazon', 'paypal', 'netflix', 'bank', 'wellsfargo', 'chase'];
const COMMON_TLDS = ['.com', '.org', '.net', '.edu', '.gov'];

function extractUrlFeatures(rawUrl) {
    let url = rawUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }

    let parsed = { hostname: '', pathname: '', search: '', protocol: '' };
    try {
        const u = new URL(url);
        parsed.hostname = u.hostname || '';
        parsed.pathname = u.pathname || '';
        parsed.search = u.search || '';
        parsed.protocol = u.protocol || '';
    } catch (e) {
        parsed.hostname = '';
    }

    const hostname = parsed.hostname.toLowerCase();
    const fullUrlLower = url.toLowerCase();

    // Domain and Subdomain parsing
    const parts = hostname.split('.');
    let domain = '';
    let subdomain = '';
    if (parts.length >= 2) {
        domain = parts.slice(-2).join('.');
        subdomain = parts.slice(0, -2).join('.');
    } else {
        domain = hostname;
    }

    const urlDict = {};

    urlDict['length_url'] = url.length;
    urlDict['length_hostname'] = hostname.length;

    // Check raw IP address
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    urlDict['ip'] = ipPattern.test(hostname) ? 1 : 0;

    // Symbol counts
    urlDict['nb_dots'] = (url.match(/\./g) || []).length;
    urlDict['nb_hyphens'] = (url.match(/-/g) || []).length;
    urlDict['nb_at'] = (url.match(/@/g) || []).length;
    urlDict['nb_qm'] = (url.match(/\?/g) || []).length;
    urlDict['nb_and'] = (url.match(/&/g) || []).length;
    urlDict['nb_or'] = (url.match(/\|/g) || []).length;
    urlDict['nb_eq'] = (url.match(/=/g) || []).length;
    urlDict['nb_underscore'] = (url.match(/_/g) || []).length;
    urlDict['nb_tilde'] = (url.match(/~/g) || []).length;
    urlDict['nb_percent'] = (url.match(/%/g) || []).length;
    urlDict['nb_slash'] = (url.match(/\//g) || []).length;
    urlDict['nb_star'] = (url.match(/\*/g) || []).length;
    urlDict['nb_colon'] = (url.match(/:/g) || []).length;
    urlDict['nb_comma'] = (url.match(/,/g) || []).length;
    urlDict['nb_semicolumn'] = (url.match(/;/g) || []).length;
    urlDict['nb_dollar'] = (url.match(/\$/g) || []).length;
    urlDict['nb_space'] = (url.match(/ /g) || []).length;

    urlDict['nb_www'] = hostname.includes('www') ? 1 : 0;
    urlDict['nb_com'] = fullUrlLower.includes('.com') ? 1 : 0;
    
    // Double slash in path
    const dslashMatches = (url.match(/\/\//g) || []).length;
    urlDict['nb_dslash'] = url.startsWith('http://') || url.startsWith('https://') ? Math.max(0, dslashMatches - 1) : dslashMatches;

    urlDict['http_in_path'] = parsed.pathname.toLowerCase().includes('http') ? 1 : 0;
    urlDict['https_token'] = (parsed.pathname.toLowerCase().includes('https') || parsed.search.toLowerCase().includes('https')) ? 1 : 0;

    // Digits ratio
    const digits = (url.match(/\d/g) || []).length;
    urlDict['ratio_digits_url'] = url.length > 0 ? digits / url.length : 0;
    const hostDigits = (hostname.match(/\d/g) || []).length;
    urlDict['ratio_digits_host'] = hostname.length > 0 ? hostDigits / hostname.length : 0;

    urlDict['punycode'] = hostname.includes('xn--') ? 1 : 0;
    urlDict['prefix_suffix'] = domain.includes('-') ? 1 : 0;

    urlDict['shortening_service'] = SHORTENING_SERVICES.some(s => hostname.includes(s)) ? 1 : 0;
    urlDict['tld_in_subdomain'] = COMMON_TLDS.some(t => subdomain.includes(t)) ? 1 : 0;
    urlDict['abnormal_subdomain'] = (subdomain.length > 20 || (subdomain.match(/\./g) || []).length > 3) ? 1 : 0;
    urlDict['nb_subdomains'] = subdomain ? (subdomain.match(/\./g) || []).length + 1 : 0;

    urlDict['suspecious_tld'] = SUSPICIOUS_TLDS.some(t => fullUrlLower.endsWith(t) || fullUrlLower.includes(t + '/')) ? 1 : 0;
    urlDict['phish_hints'] = PHISH_KEYWORDS.some(kw => fullUrlLower.includes(kw)) ? 1 : 0;

    // Random domain check (high consonant density)
    const domainName = parts.length >= 2 ? parts[parts.length - 2] : hostname;
    const consonants = (domainName.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
    urlDict['random_domain'] = (domainName.length > 5 && (consonants / domainName.length) > 0.75) ? 1 : 0;

    // Brand spoofing check
    urlDict['brand_in_subdomain'] = BRAND_KEYWORDS.some(b => subdomain.includes(b)) ? 1 : 0;
    urlDict['brand_in_path'] = BRAND_KEYWORDS.some(b => parsed.pathname.toLowerCase().includes(b)) ? 1 : 0;

    return {
        urlFeatures: urlDict,
        hostname,
        domain,
        subdomain
    };
}

if (typeof self !== 'undefined') {
    self.extractUrlFeatures = extractUrlFeatures;
}
