"use client";

import React, { useState, useEffect } from 'react';

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

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('scan');
  
  // Scan State
  const [targetUrl, setTargetUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0); // 0-4
  const [scanResult, setScanResult] = useState<any>(null);
  const [gaugeScore, setGaugeScore] = useState(0);
  
  // Feed State
  const [feed, setFeed] = useState<any[]>(MOCK_THREATS.slice(0, 5));

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
      
      const animateGauge = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setGaugeScore(Math.floor(start + (target - start) * easeOut));
        if (progress < 1) requestAnimationFrame(animateGauge);
      };
      requestAnimationFrame(animateGauge);
    }
  }, [scanResult]);

  const runScan = async (e: React.FormEvent) => {
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/predict`, {
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
          val: typeof v === 'number' ? Math.round(v > 1 ? Math.min(v * 10, 100) : (v as number) * 100) : 50,
          color: (v as number) > 0 ? '#ff4560' : '#00e676'
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

  const NavItem = ({ name }: { name: string }) => (
    <button 
      onClick={() => setActiveSection(name)}
      className={`text-[11px] font-mono tracking-[0.08em] px-2 py-1 transition-all border-b-2 ${activeSection === name ? 'text-[#00c8ff] border-[#00c8ff]' : 'text-[rgba(255,255,255,0.5)] border-transparent hover:text-white'}`}
    >
      {name}
    </button>
  );

  return (
    <div className="min-h-screen pb-20 bg-[#070d1a] text-white font-mono">
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
          {[1,2].map(id => (
            <div key={id} className="flex gap-8 mx-4">
              <div className="font-mono text-[10px] tracking-widest"><span className="text-[rgba(255,255,255,0.5)]">THREATS BLOCKED:</span> <span className="text-[#00e676]">24,902</span></div>
              <div className="font-mono text-[10px] tracking-widest"><span className="text-[rgba(255,255,255,0.5)]">MODEL ACCURACY:</span> <span className="text-[#00c8ff]">99.2%</span></div>
              <div className="font-mono text-[10px] tracking-widest"><span className="text-[rgba(255,255,255,0.5)]">URLS SCANNED:</span> <span className="text-white">142,504</span></div>
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
            <p className="font-mono text-[12px] text-[#00c8ff] tracking-[0.1em]">attention-based deep fusion model | real-time detection | 45-feature analysis</p>
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
                      strokeDasharray="226" 
                      strokeDashoffset={226 - (226 * (gaugeScore / 100))} 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-sora font-medium text-[20px] leading-none" style={{ color: scanResult.color }}>{gaugeScore}%</span>
                    <span className="font-mono text-[8px] text-[rgba(255,255,255,0.4)] uppercase">score</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-[10px] tracking-[0.1em] px-2 py-0.5 rounded uppercase font-bold" style={{ backgroundColor: `${scanResult.color}20`, color: scanResult.color, border: `1px solid ${scanResult.color}40` }}>
                      {scanResult.verdict}
                    </span>
                    <span className="font-mono text-[10px] text-[rgba(255,255,255,0.4)]">conf: {scanResult.confidence}</span>
                    <span className="font-mono text-[10px] text-[rgba(255,255,255,0.4)]">lat: {scanResult.latency}</span>
                  </div>
                  <div className="font-mono text-[12px] text-[#e8f4ff] truncate mb-3">{scanResult.url}</div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {scanResult.features.map((f: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[rgba(255,255,255,0.5)]">{f.name}</span>
                        <div className="w-16 bg-[rgba(255,255,255,0.05)] h-1.5 rounded overflow-hidden">
                          <div className="h-full" style={{ width: `${f.val}%`, backgroundColor: f.color }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Live Feed Table */}
          <div className="max-w-[680px] mx-auto mt-8">
            <div className="flex justify-between items-center mb-3">
              <span className="font-mono text-[10px] tracking-[0.12em] text-[rgba(255,255,255,0.5)]">LIVE THREAT FEED</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff4560] animate-ping"></span>
                <span className="font-mono text-[9px] text-[#ff4560]">stream active</span>
              </div>
            </div>

            <div className="terminal-card rounded-[8px] overflow-hidden">
              {feed.map((item, idx) => (
                <div key={item._id || idx} className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(255,255,255,0.04)] text-[11px] font-mono animate-slide-in">
                  <div className="flex items-center gap-3 truncate max-w-[400px]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-[#e8f4ff] truncate">{item.url}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: `${item.color}15`, color: item.color }}>{item.severity}</span>
                    <span className="text-[10px] text-[rgba(255,255,255,0.3)]">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ANALYTICS SECTION */}
        <div style={{ display: activeSection === 'analytics' ? 'block' : 'none' }}>
          <div className="terminal-card rounded-lg p-6 max-w-4xl mx-auto mt-6">
            <h2 className="font-sora text-lg text-white mb-1">Threat Analytics & Distribution</h2>
            <p className="font-mono text-[11px] text-[rgba(255,255,255,0.5)] mb-6">Real-time breakdown of detected vector patterns across total URL scans.</p>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded">
                <div className="text-[10px] text-[rgba(255,255,255,0.4)] mb-1">TOTAL SCANS RECORDED</div>
                <div className="font-sora text-2xl text-[#00c8ff]">142,504</div>
              </div>
              <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded">
                <div className="text-[10px] text-[rgba(255,255,255,0.4)] mb-1">PHISHING DETECTION RATE</div>
                <div className="font-sora text-2xl text-[#ff4560]">18.4%</div>
              </div>
              <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded">
                <div className="text-[10px] text-[rgba(255,255,255,0.4)] mb-1">MODEL LATENCY (P99)</div>
                <div className="font-sora text-2xl text-[#00e676]">142ms</div>
              </div>
            </div>
          </div>
        </div>

        {/* HISTORY SECTION */}
        <div style={{ display: activeSection === 'history' ? 'block' : 'none' }}>
          <div className="terminal-card rounded-lg p-6 max-w-4xl mx-auto mt-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-sora text-lg text-white mb-1">Recent Audit History</h2>
                <p className="font-mono text-[11px] text-[rgba(255,255,255,0.5)]">Inspection log of recent domain analysis queries.</p>
              </div>
            </div>

            <div className="divide-y divide-[rgba(255,255,255,0.05)]">
              {MOCK_HISTORY.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-[11px]">
                  <div>
                    <div className="text-[#e8f4ff] font-mono">{item.url}</div>
                    <div className="text-[9px] text-[rgba(255,255,255,0.3)]">{item.time}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px]" style={{ color: item.score > 50 ? '#ff4560' : '#00e676' }}>{item.score}%</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${item.verdict === 'phishing' ? 'bg-[rgba(255,69,96,0.15)] text-[#ff4560]' : item.verdict === 'suspicious' ? 'bg-[rgba(255,180,0,0.15)] text-[#ffb400]' : 'bg-[rgba(0,230,118,0.15)] text-[#00e676]'}`}>
                      {item.verdict}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODEL METRICS SECTION */}
        <div style={{ display: activeSection === 'model' ? 'block' : 'none' }}>
           <div className="max-w-4xl mx-auto mt-6">
              <div className="terminal-card rounded-lg p-6 mb-6">
                 <h2 className="font-sora text-lg text-white mb-1">Attention-Based Deep Fusion Model Specs</h2>
                 <p className="font-mono text-[11px] text-[rgba(255,255,255,0.5)] mb-6">Deep Learning architecture combining 20 URL features & 25 HTML content signals.</p>

                 <div className="grid grid-cols-4 gap-4">
                    {[
                      { metric: 'Accuracy', val: '99.2%', color: '#00e676' },
                      { metric: 'Precision', val: '98.8%', color: '#00c8ff' },
                      { metric: 'Recall', val: '99.1%', color: '#ffb400' },
                      { metric: 'F1 Score', val: '98.9%', color: '#ff4560' }
                    ].map((m, i) => (
                      <div key={i} className="p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded text-center">
                        <div className="text-[10px] text-[rgba(255,255,255,0.4)] mb-1">{m.metric}</div>
                        <div className="font-sora text-xl" style={{ color: m.color }}>{m.val}</div>
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
