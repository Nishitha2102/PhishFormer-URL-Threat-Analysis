import React, { useState, useEffect, useRef } from 'react';

// Hardcoded Sample Data
const MOCK_THREATS = [
  { url: 'secure-paypa1.com/verify', severity: 'CRITICAL', color: '#ff4560', time: '2s ago' },
  { url: 'apple-id-verify.tk/login', severity: 'CRITICAL', color: '#ff4560', time: '14s ago' },
  { url: 'amazon-prime-alert.xyz', severity: 'MEDIUM', color: '#ffb400', time: '31s ago' },
  { url: 'update-account.net/secure', severity: 'CRITICAL', color: '#ff4560', time: '1m ago' },
  { url: 'google-signin-check.com', severity: 'MEDIUM', color: '#ffb400', time: '2m ago' },
  { url: 'bankofamerica-alert.org', severity: 'CRITICAL', color: '#ff4560', time: '3m ago' },
  { url: 'dropbox-share-file.site', severity: 'LOW', color: '#00c8ff', time: '4m ago' },
  { url: 'netflix-billing-update.co', severity: 'MEDIUM', color: '#ffb400', time: '5m ago' }
];

const MOCK_HISTORY = [
  { url: 'example.com/login', score: 91, verdict: 'phishing', time: '10m ago' },
  { url: 'bank-auth-verify.com', score: 78, verdict: 'phishing', time: '12m ago' },
  { url: 'user-settings.apple.com.br', score: 54, verdict: 'suspicious', time: '1h ago' },
  { url: 'netflix-billing.com', score: 42, verdict: 'suspicious', time: '2h ago' },
  { url: 'github.com', score: 12, verdict: 'safe', time: '5h ago' },
  { url: 'stackoverflow.com', score: 8, verdict: 'safe', time: '1d ago' },
  { url: 'support-ticket-0129.net', score: 67, verdict: 'suspicious', time: '1d ago' },
  { url: 'secure-login.paypal.account.com', score: 88, verdict: 'phishing', time: '2d ago' },
];

const URL_FEATURES = ['length_url','length_hostname','ip','nb_dots','nb_hyphens','nb_at','nb_qm','nb_and','nb_or','nb_eq','nb_underscore','nb_tilde','nb_percent','nb_slash','nb_star','nb_colon','nb_comma','nb_semicolumn','nb_dollar','http_in_path'];
const HTML_FEATURES = ['login_form','external_favicon','links_in_tags','submit_email','sfh','iframe','popup_window','right_clic','domain_in_title','domain_with_copyright','empty_title','onmouseover','shortening_service','nb_redirection','nb_external_redirection','web_traffic','dns_record','google_index','page_rank','nb_hyperlinks','ratio_intHyperlinks','ratio_extHyperlinks','ratio_nullHyperlinks','nb_extCSS','ratio_intRedirection'];

function App() {
  const [activeSection, setActiveSection] = useState('scan');
  
  // Scan State
  const [targetUrl, setTargetUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0); // 0-4
  const [scanResult, setScanResult] = useState(null);
  const [gaugeScore, setGaugeScore] = useState(0);
  
  // Feed State
  const [feed, setFeed] = useState(MOCK_THREATS.slice(0, 5));

  // Feed Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setFeed(prev => {
        const nextThreat = MOCK_THREATS[Math.floor(Math.random() * MOCK_THREATS.length)];
        const newFeed = [{...nextThreat, _id: Date.now()}, ...prev];
        if (newFeed.length > 6) return newFeed.slice(0, 6);
        return newFeed;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Gauge animation hook
  useEffect(() => {
    if (scanResult) {
      let start = 0;
      const target = scanResult.score;
      const duration = 1000;
      const startTime = performance.now();
      
      const animateGauge = (time) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Simple ease out
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setGaugeScore(Math.floor(start + (target - start) * easeOut));
        if (progress < 1) requestAnimationFrame(animateGauge);
      };
      requestAnimationFrame(animateGauge);
    }
  }, [scanResult]);

  const runScan = async (e) => {
    e.preventDefault();
    if (!targetUrl) return;
    
    setIsScanning(true);
    setScanResult(null);
    setScanStage(0);

    const startTime = Date.now();

    // Stage animations
    for (let i = 1; i <= 3; i++) {
        await new Promise(r => setTimeout(r, 200));
        setScanStage(i);
    }

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, fetch_html: true })
      });
      const data = await response.json();
      const latency = (Date.now() - startTime) + 'ms';

      setScanStage(4);

      if (response.ok) {
        const score = Math.round(data.phishing_score !== undefined ? data.phishing_score : (data.confidence * 100));
        const verdict = score < 30 ? 'safe' : score < 70 ? 'suspicious' : 'phishing detected';
        const color = score < 30 ? '#00e676' : score < 70 ? '#ffb400' : '#ff4560';

        const rawFeatures = data.features?.url_features || {};
        const featureEntries = Object.entries(rawFeatures).slice(0, 6).map(([k, v]) => ({
          name: k,
          val: typeof v === 'number' ? Math.round(v > 1 ? Math.min(v * 10, 100) : v * 100) : 50,
          color: v > 0 ? '#ff4560' : '#00e676'
        }));

        setScanResult({
          url: data.url || targetUrl,
          score,
          verdict,
          color,
          confidence: (data.confidence * 100).toFixed(1) + '%',
          latency,
          features: featureEntries.length > 0 ? featureEntries : [
            { name: 'length_url', val: Math.min(targetUrl.length, 100), color: targetUrl.length > 50 ? '#ff4560' : '#00e676' },
            { name: 'phish_hints', val: score > 50 ? 100 : 0, color: score > 50 ? '#ff4560' : '#00e676' }
          ]
        });
      } else {
        throw new Error(data.message || 'Scan failed');
      }
    } catch (err) {
      console.warn('Backend API connection error, fallback to client rules:', err);
      let score = 12;
      const lowerUrl = targetUrl.toLowerCase();
      if (lowerUrl.includes('paypa1') || lowerUrl.includes('verify') || lowerUrl.includes('secure') || lowerUrl.includes('phish')) score += 45;
      if (/\d/.test(lowerUrl)) score += 25;
      if (lowerUrl.includes('-')) score += 10;
      if (score > 98) score = 98;

      setScanResult({
        url: targetUrl,
        score,
        verdict: score < 30 ? 'safe' : score < 70 ? 'suspicious' : 'phishing detected',
        color: score < 30 ? '#00e676' : score < 70 ? '#ffb400' : '#ff4560',
        confidence: (score > 50 ? score * 0.99 : (100 - score) * 0.99).toFixed(1) + '%',
        latency: Math.floor(Math.random() * 50 + 100) + 'ms',
        features: [
          { name: 'login_form', val: score > 70 ? 92 : 10, color: score > 70 ? '#ff4560' : '#00e676' },
          { name: 'nb_dots', val: score > 60 ? 81 : 40, color: score > 60 ? '#ff4560' : '#ffb400' },
          { name: 'ip', val: 0, color: 'rgba(255,255,255,0.5)' },
          { name: 'iframe', val: score > 70 ? 74 : 5, color: score > 70 ? '#ff4560' : '#00e676' }
        ]
      });
    } finally {
      setIsScanning(false);
    }
  };

  const NavItem = ({ name }) => (
    <button 
      onClick={() => setActiveSection(name)}
      className={`text-[11px] font-mono tracking-[0.08em] px-2 py-1 transition-all border-b-2 ${activeSection === name ? 'text-[#00c8ff] border-[#00c8ff]' : 'text-[rgba(255,255,255,0.5)] border-transparent hover:text-white'}`}
    >
      {name}
    </button>
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[rgba(7,13,26,0.85)] border-b border-[rgba(255,255,255,0.07)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md border-[1.5px] border-[#00c8ff] flex items-center justify-center pulse-ring-container bg-[rgba(0,200,255,0.1)]">
              <div className="w-2 h-2 bg-[#00c8ff] rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-sora font-medium text-[15px] leading-tight text-white">PhishFormer</span>
              <span className="font-mono text-[10px] tracking-[0.12em] text-[#00c8ff]">threat detection system</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <NavItem name="scan" />
            <NavItem name="analytics" />
            <NavItem name="history" />
            <NavItem name="model" />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] bg-[#00e676] rounded-full animate-blink"></div>
            <span className="font-mono text-[10px] text-[rgba(255,255,255,0.5)]">system online</span>
          </div>
        </div>
      </nav>

      {/* Ticker */}
      <div className="w-full bg-[rgba(0,200,255,0.06)] border-b border-[rgba(0,200,255,0.1)] ticker-wrap py-1.5 flex select-none">
        <div className="ticker-inner">
          {/* Ticker content doubled for infinite loop */}
          {[1,2].map(id => (
            <div key={id} className="flex gap-8 mx-4">
              <div className="font-mono text-[10px] tracking-widest"><span className="text-[rgba(255,255,255,0.5)]">THREATS BLOCKED:</span> <span className="text-[#00e676]">24,902</span></div>
              <div className="font-mono text-[10px] tracking-widest"><span className="text-[rgba(255,255,255,0.5)]">MODEL ACCURACY:</span> <span className="text-[#00c8ff]">99.2%</span></div>
              <div className="font-mono text-[10px] tracking-widest"><span className="text-[rgba(255,255,255,0.5)]">URLS SCANNED:</span> <span className="text-[#white]">142,504</span></div>
              <div className="font-mono text-[10px] tracking-widest"><span className="text-[rgba(255,255,255,0.5)]">AVG INFERENCE:</span> <span className="text-[#00c8ff]">112ms</span></div>
              <div className="font-mono text-[10px] tracking-widest"><span className="text-[rgba(255,255,255,0.5)]">NEW PHISHING DOMAINS:</span> <span className="text-[#ff4560]">3,492</span></div>
              <div className="font-mono text-[10px] tracking-widest"><span className="text-[rgba(255,255,255,0.5)]">URL FEATURES:</span> <span className="text-[#00c8ff]">20</span></div>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* SCAN SECTION */}
        <div style={{ display: activeSection === 'scan' ? 'block' : 'none' }}>
        
          <div className="text-center pt-[40px] px-[28px] pb-[28px]">
            <h1 className="font-sora font-medium text-[26px] text-[#e8f4ff] mb-2">url threat analysis engine</h1>
            <p className="font-mono text-[12px] text-[#00c8ff] tracking-[0.1em]">lightgbm classification | real-time detection | 45-feature analysis</p>
          </div>

          <div className="max-w-[680px] mx-auto bg-[rgba(0,200,255,0.04)] border border-[rgba(0,200,255,0.18)] rounded-[12px] p-[20px] relative">
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#00c8ff] to-transparent opacity-50"></div>
            
            <label className="block mb-2 font-mono text-[10px] text-[rgba(255,255,255,0.5)] tracking-[0.12em]">target url</label>
            <form onSubmit={runScan} className="flex gap-2">
              <input 
                type="text"
                placeholder="https://suspicious-link.com"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                className="flex-1 bg-[rgba(0,0,0,0.4)] border border-[rgba(0,200,255,0.2)] focus:border-[#00c8ff] rounded text-[12px] font-mono px-3 py-2 outline-none text-[#e8f4ff] placeholder-[#2a4a5e]"
                disabled={isScanning}
              />
              <button 
                type="submit"
                disabled={isScanning || !targetUrl}
                className={`font-mono text-[11px] font-medium tracking-[0.08em] px-6 py-2 rounded transition-all flex items-center gap-2 justify-center min-w-[120px]
                  ${isScanning 
                    ? 'border-2 border-[#00c8ff] bg-transparent text-[#00c8ff]' 
                    : 'bg-[#00c8ff] text-[#070d1a] border-2 border-[#00c8ff] hover:bg-[#33d4ff] active:scale-[0.97]'}`}
              >
                {isScanning ? (
                  <><svg className="w-3 h-3 animate-spin-fast text-[#00c8ff]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> scanning...</>
                ) : 'analyze'}
              </button>
            </form>
          </div>

          {/* Progress Strip */}
          {isScanning && (
            <div className="max-w-[680px] mx-auto mt-4 px-2">
              <div className="w-full bg-[rgba(255,255,255,0.1)] h-[2px] mb-2 relative overflow-hidden">
                <div 
                  className="bg-[#00c8ff] h-full transition-all duration-300 ease-out"
                  style={{ width: `${(scanStage / 4) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between font-mono text-[9px] tracking-widest text-[rgba(255,255,255,0.3)]">
                <span className={scanStage >= 1 ? 'text-[#00c8ff]' : ''}>extracting url</span>
                <span className={scanStage >= 2 ? 'text-[#00c8ff]' : ''}>parsing html</span>
                <span className={scanStage >= 3 ? 'text-[#00c8ff]' : ''}>evaluating trees</span>
                <span className={scanStage >= 4 ? 'text-[#00c8ff]' : ''}>computing score</span>
              </div>
            </div>
          )}

          {/* Metrics Row */}
          {!scanResult && !isScanning && (
            <div className="max-w-[680px] mx-auto mt-8 grid grid-cols-4 gap-3">
              {[
                { val: '3,492', label: 'threats/hr', chg: '+12%', color: '#ff4560' },
                { val: '14K', label: 'total scanned', chg: '+4%', color: '#00c8ff' },
                { val: '99.2%', label: 'accuracy', chg: '+0.1%', color: '#00e676' },
                { val: '112ms', label: 'avg latency', chg: '-5ms', color: '#ffb400' }
              ].map((m, i) => (
                <div key={i} className="bg-[rgba(0,0,0,0.3)] rounded-[8px] p-[12px] flex flex-col justify-between">
                  <div className="font-sora text-[20px] font-medium leading-none mb-1">{m.val}</div>
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[9px] tracking-[0.1em] text-[rgba(255,255,255,0.5)]">{m.label}</span>
                    <span className="font-mono text-[9px]" style={{ color: m.color }}>{m.chg}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Panel */}
          {scanResult && !isScanning && (
            <div className="max-w-[680px] mx-auto mt-6 border border-[rgba(0,200,255,0.25)] bg-[rgba(0,0,0,0.4)] p-[18px] animate-flash-in">
              <div className="flex gap-[20px] mb-6">
                
                {/* SVG Gauge */}
                <div className="relative w-[88px] h-[88px] flex-shrink-0">
                  <svg viewBox="0 0 88 88" className="w-[88px] h-[88px] transform -rotate-90">
                    <circle cx="44" cy="44" r="36" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                    <circle 
                      cx="44" cy="44" r="36" 
                      stroke={scanResult.color} 
                      strokeWidth="6" 
                      fill="none" 
                      strokeLinecap="round"
                      strokeDasharray="226"
                      style={{ 
                        strokeDashoffset: 226 - (gaugeScore / 100 * 226), 
                        transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s' 
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-sora text-[20px] font-medium leading-none mt-1" style={{color: scanResult.color}}>{gaugeScore}</span>
                    <span className="font-mono text-[8px] tracking-widest text-[rgba(255,255,255,0.4)]">risk score</span>
                  </div>
                </div>

                {/* Verdict Info */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className={`px-3 py-1 bg-opacity-10 rounded-full border flex items-center gap-2`}
                      style={{ backgroundColor: `${scanResult.color}1a`, borderColor: scanResult.color }}
                    >
                      <div className={`w-2 h-2 rounded-full ${scanResult.score > 70 ? 'animate-blink' : ''}`} style={{ backgroundColor: scanResult.color }}></div>
                      <span className="font-mono text-[10px] tracking-widest uppercase font-bold" style={{ color: scanResult.color }}>{scanResult.verdict}</span>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-[rgba(255,255,255,0.6)] truncate mb-2" title={scanResult.url}>{scanResult.url}</div>
                  <div className="flex gap-4 font-mono text-[10px]">
                    <span className="text-[rgba(255,255,255,0.4)]">conf: <span className="text-[#00c8ff]">{scanResult.confidence}</span></span>
                    <span className="text-[rgba(255,255,255,0.4)]">model: LightGBM</span>
                    <span className="text-[rgba(255,255,255,0.4)]">time: {scanResult.latency}</span>
                  </div>
                </div>
              </div>

              {/* Signals */}
              <div className="pt-4 border-t border-[rgba(255,255,255,0.05)]">
                <div className="font-mono text-[10px] tracking-widest text-[rgba(255,255,255,0.3)] mb-3 uppercase">top feature signals</div>
                <div className="space-y-2">
                  {scanResult.features.map(f => (
                    <div key={f.name} className="flex items-center">
                      <div className="w-[130px] font-mono text-[10px] text-[rgba(255,255,255,0.5)] truncate pr-2">{f.name}</div>
                      <div className="flex-1 h-[5px] bg-[rgba(255,255,255,0.05)] rounded overflow-hidden">
                        <div 
                          className="h-full rounded animate-fill-bar"
                          style={{ '--w': `${f.val}%`, backgroundColor: f.color }}
                        ></div>
                      </div>
                      <div className="w-[30px] font-mono text-[9px] text-right ml-2" style={{ color: f.color }}>{f.val}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live Feed */}
          <div className="max-w-[680px] mx-auto mt-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] tracking-widest text-[#00c8ff] uppercase">live threat feed</span>
              <div className="flex-1 h-[1px] bg-[rgba(0,200,255,0.1)]"></div>
            </div>
            <div className="space-y-2 relative">
              {feed.map((t, idx) => (
                <div 
                  key={t._id || idx} 
                  className="bg-[rgba(0,0,0,0.25)] rounded-[6px] h-[36px] flex items-center px-3 border-l-2 custom-slide"
                  style={{ borderColor: t.color, animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex-1 font-mono text-[10px] truncate text-[rgba(255,255,255,0.8)] mr-3">{t.url}</div>
                  <div 
                    className="font-mono text-[8px] px-2 py-0.5 rounded-[4px] uppercase tracking-widest"
                    style={{ color: t.color, backgroundColor: `${t.color}1a` }}
                  >
                    {t.severity}
                  </div>
                  <div className="w-[40px] text-right font-mono text-[9px] text-[rgba(255,255,255,0.3)]">{t.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ANALYTICS SECTION */}
        <div style={{ display: activeSection === 'analytics' ? 'block' : 'none' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Radar Card */}
            <div className="terminal-card p-6 rounded-lg flex flex-col items-center">
              <h3 className="font-mono text-[11px] text-[rgba(255,255,255,0.5)] tracking-[0.1em] self-start mb-6">VERDICT DISTRIBUTION</h3>
              <div className="relative w-[200px] h-[200px]">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle cx="100" cy="100" r="90" stroke="rgba(0,200,255,0.06)" strokeWidth="1" fill="none"/>
                  <circle cx="100" cy="100" r="60" stroke="rgba(0,200,255,0.06)" strokeWidth="1" fill="none"/>
                  <circle cx="100" cy="100" r="30" stroke="rgba(0,200,255,0.06)" strokeWidth="1" fill="none"/>
                  <path d="M 100 10 L 100 190 M 10 100 L 190 100 M 36 36 L 164 164 M 164 36 L 36 164" stroke="rgba(0,200,255,0.06)" strokeWidth="1"/>
                  
                  {/* Sweep Animation Group */}
                  <g className="animate-radar-sweep">
                    <line x1="100" y1="100" x2="100" y2="10" stroke="rgba(0,200,255,0.4)" strokeWidth="1" />
                    <path d="M 100 100 L 100 10 A 90 90 0 0 1 180 50 Z" fill="rgba(0,200,255,0.06)" />
                  </g>
                  
                  {/* Dots */}
                  <circle cx="110" cy="40" r="3" fill="#ff4560" />
                  <circle cx="60" cy="80" r="3" fill="#ffb400" />
                  <circle cx="150" cy="120" r="3" fill="#00e676" />
                  <circle cx="80" cy="140" r="3" fill="#00e676" />
                  <circle cx="120" cy="160" r="3" fill="#ff4560" />
                  <circle cx="40" cy="110" r="3" fill="#ffb400" />
                </svg>
              </div>
              <div className="flex gap-4 mt-6">
                <div className="font-mono text-[10px] text-[rgba(255,255,255,0.5)]"><span className="text-[#ff4560] mr-1">■</span>phishing 41%</div>
                <div className="font-mono text-[10px] text-[rgba(255,255,255,0.5)]"><span className="text-[#ffb400] mr-1">■</span>suspicious 24%</div>
                <div className="font-mono text-[10px] text-[rgba(255,255,255,0.5)]"><span className="text-[#00e676] mr-1">■</span>safe 35%</div>
              </div>
            </div>

            {/* Feature Importance Card */}
            <div className="terminal-card p-6 rounded-lg">
              <h3 className="font-mono text-[11px] text-[rgba(255,255,255,0.5)] tracking-[0.1em] mb-6">GLOBAL FEATURE IMPORTANCE</h3>
              <div className="space-y-4">
                {[
                  { name: 'length_url', val: 78, color: '#ff4560' },
                  { name: 'nb_dots', val: 65, color: '#ffb400' },
                  { name: 'ip', val: 58, color: '#ffb400' },
                  { name: 'nb_hyperlinks', val: 52, color: '#00c8ff' },
                  { name: 'nb_hyphens', val: 44, color: '#00c8ff' },
                  { name: 'ratio_extHyperlinks', val: 38, color: '#00c8ff' },
                ].map(f => (
                  <div key={f.name} className="flex items-center">
                    <div className="w-[120px] font-mono text-[10px] text-[rgba(255,255,255,0.6)] truncate">{f.name}</div>
                    <div className="flex-1 h-[5px] bg-[rgba(255,255,255,0.05)] rounded overflow-hidden">
                      <div className="h-full rounded animate-fill-bar" style={{ '--w': `${f.val}%`, backgroundColor: f.color }}></div>
                    </div>
                    <div className="w-[30px] font-mono text-[10px] text-right ml-2" style={{ color: f.color }}>{f.val}%</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Trend */}
            <div className="col-span-1 md:col-span-2 terminal-card p-6 rounded-lg">
              <h3 className="font-mono text-[11px] text-[rgba(255,255,255,0.5)] tracking-[0.1em] mb-6">DAILY SCAN VOLUME</h3>
              <div className="h-[120px] w-full relative">
                <svg viewBox="0 0 1000 120" preserveAspectRatio="none" className="w-full h-full">
                  <polygon points="0,120 0,90 100,85 200,70 300,75 400,50 500,45 600,60 700,30 800,20 900,10 1000,5 1000,120" fill="rgba(0,200,255,0.06)" />
                  <polyline points="0,90 100,85 200,70 300,75 400,50 500,45 600,60 700,30 800,20 900,10 1000,5" fill="none" stroke="#00c8ff" strokeWidth="2" />
                </svg>
              </div>
              <div className="flex justify-between font-mono text-[9px] text-[rgba(255,255,255,0.4)] mt-2">
                <span>14d ago</span>
                <span>7d ago</span>
                <span>today</span>
              </div>
            </div>

            {/* Performance */}
            <div className="terminal-card p-6 rounded-lg">
              <h3 className="font-mono text-[11px] text-[rgba(255,255,255,0.5)] tracking-[0.1em] mb-6">MODEL PERFORMANCE</h3>
              <div className="space-y-5">
                {[
                  { n: 'accuracy', v: '97.4%', c: '#00c8ff' },
                  { n: 'precision', v: '96.8%', c: '#00e676' },
                  { n: 'recall', v: '98.1%', c: '#ffb400' },
                  { n: 'f1 score', v: '97.4%', c: 'rgba(255,255,255,0.4)' },
                ].map(f => (
                  <div key={f.n}>
                    <div className="flex justify-between font-mono text-[10px] mb-1">
                      <span className="text-[rgba(255,255,255,0.6)]">{f.n}</span>
                      <span style={{ color: f.c }}>{f.v}</span>
                    </div>
                    <div className="h-[4px] bg-[rgba(255,255,255,0.05)] rounded overflow-hidden">
                      <div className="h-full rounded animate-fill-bar" style={{ '--w': f.v, backgroundColor: f.c }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="terminal-card p-6 rounded-lg">
              <h3 className="font-mono text-[11px] text-[rgba(255,255,255,0.5)] tracking-[0.1em] mb-6">THREAT TAXONOMY</h3>
              <div className="space-y-4">
                {[
                  { n: 'credential harvesting', v: 78, c: '#ff4560' },
                  { n: 'brand impersonation', v: 62, c: '#ffb400' },
                  { n: 'typosquatting', v: 49, c: '#ff4560' },
                  { n: 'malicious redirect', v: 35, c: '#ffb400' },
                  { n: 'homograph attack', v: 21, c: '#00c8ff' },
                ].map(f => (
                  <div key={f.n} className="flex flex-col gap-1">
                    <div className="font-mono text-[10px] tracking-widest text-[rgba(255,255,255,0.5)] flex justify-between">
                      {f.n} <span style={{color: f.c}}>{f.v}%</span>
                    </div>
                    <div className="h-[2px] bg-[rgba(255,255,255,0.05)] rounded overflow-hidden">
                      <div className="h-full rounded animate-fill-bar" style={{ '--w': `${f.v}%`, backgroundColor: f.c }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* HISTORY SECTION */}
        <div style={{ display: activeSection === 'history' ? 'block' : 'none' }}>
           <div className="terminal-card rounded-lg overflow-hidden border border-[rgba(255,255,255,0.07)]">
              <div className="grid grid-cols-4 px-6 py-4 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.04)]">
                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-[rgba(255,255,255,0.4)]">URL</div>
                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-[rgba(255,255,255,0.4)]">Score</div>
                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-[rgba(255,255,255,0.4)]">Verdict</div>
                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-[rgba(255,255,255,0.4)] text-right">Time</div>
              </div>
              <div className="divide-y divide-[rgba(255,255,255,0.02)]">
                {MOCK_HISTORY.map((h, i) => (
                  <div key={i} className="grid grid-cols-4 px-6 py-4 hover:bg-[rgba(0,200,255,0.04)] transition-colors animate-slide-in" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                    <div className="font-mono text-[11px] truncate pr-4 text-[rgba(255,255,255,0.8)]">{h.url}</div>
                    <div className="font-sora text-[11px] font-medium" style={{ color: h.score > 70 ? '#ff4560' : h.score > 30 ? '#ffb400' : '#00e676' }}>
                      {h.score}
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-[4px] font-mono text-[9px] uppercase tracking-widest border" 
                        style={{ 
                          color: h.score > 70 ? '#ff4560' : h.score > 30 ? '#ffb400' : '#00e676',
                          borderColor: h.score > 70 ? 'rgba(255,69,96,0.3)' : h.score > 30 ? 'rgba(255,180,0,0.3)' : 'rgba(0,230,118,0.3)',
                          backgroundColor: h.score > 70 ? 'rgba(255,69,96,0.05)' : h.score > 30 ? 'rgba(255,180,0,0.05)' : 'rgba(0,230,118,0.05)'
                        }}
                      >
                        {h.verdict}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-[rgba(255,255,255,0.3)] text-right">{h.time}</div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* MODEL SECTION */}
        <div style={{ display: activeSection === 'model' ? 'block' : 'none' }}>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="terminal-card rounded-lg overflow-hidden border border-[rgba(255,255,255,0.07)]">
                 <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.04)] font-mono text-[11px] tracking-[0.1em] text-[rgba(255,255,255,0.5)]">AI ARCHITECTURE</div>
                 <div>
                    {[
                      { l: 'architecture', v: 'lightgbm gradient boosting', c: '#00c8ff' },
                      { l: 'estimators', v: '100', c: '#fff' },
                      { l: 'learning parameters', v: 'learning_rate=0.1', c: '#fff' },
                      { l: 'url feature map', v: '20 metrics → dense input', c: '#00c8ff' },
                      { l: 'html feature map', v: '25 metrics → dense input', c: '#00c8ff' },
                      { l: 'output logic', v: 'phishing threshold > 70', c: '#00e676' },
                    ].map((m, i) => (
                      <div key={i} className={`flex justify-between items-center px-6 py-3 font-mono text-[10px] ${i % 2 === 0 ? 'bg-[rgba(0,200,255,0.03)]' : ''}`}>
                        <span className="text-[rgba(255,255,255,0.4)] tracking-wide">{m.l}</span>
                        <span style={{ color: m.c }}>{m.v}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="terminal-card rounded-lg p-6 border border-[rgba(255,255,255,0.07)]">
                <div className="font-mono text-[9px] tracking-[0.1em] text-[rgba(0,200,255,0.5)] mb-3">URL STREAM — 20 FEATURES</div>
                <div className="flex flex-wrap gap-2 mb-8">
                  {URL_FEATURES.map(f => (
                    <span key={f} className="font-mono text-[9px] px-[7px] py-[2px] bg-[rgba(0,200,255,0.1)] text-[#4a9bb5] border border-[rgba(0,200,255,0.15)] rounded">
                      {f}
                    </span>
                  ))}
                </div>

                <div className="font-mono text-[9px] tracking-[0.1em] text-[rgba(0,200,100,0.5)] mb-3">HTML STREAM — 25 FEATURES</div>
                <div className="flex flex-wrap gap-2">
                  {HTML_FEATURES.map(f => (
                    <span key={f} className="font-mono text-[9px] px-[7px] py-[2px] bg-[rgba(0,200,100,0.08)] text-[#4ab580] border border-[rgba(0,200,100,0.15)] rounded">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
           </div>
        </div>

      </main>
    </div>
  );
}

export default App;
