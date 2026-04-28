import { useState, useEffect, useRef } from 'react';
import ImageUploader from './components/ImageUploader';
import RoastDisplay from './components/RoastDisplay';
import { analyzeListingImage } from './services/anthropicService';

const STAGES = [
  'Reading your listing…',
  'Identifying weak spots…',
  'Writing the roast…',
  'Calculating revenue impact…',
  'Almost done…',
];

const BRANDS = ['Merkle', 'Razor Group', 'Huel', 'Honeywell', 'Ghirardelli', '7-Eleven'];

/* Scrolling roast ticker quotes */
const TICKER_QUOTES = [
  '🔥 "Your title reads like a grocery list written by a robot with no soul."',
  '💀 "5 images of the product from the same angle. Bold strategy."',
  '😬 "No A+ content in 2025? Your competitor is actively grateful."',
  '🔥 "Generic bullet points that could describe literally any product."',
  '💸 "Leaving ~$2,400/mo on the table with that first image."',
  '😭 "Your main image has text. Amazon hates that. Buyers hate that."',
  '🎯 "Competitors outrank you because their title has 40 more keywords."',
  '🔥 "Price anchoring? Never heard of it, apparently."',
];

/* Fake sample result for the preview card */
const SAMPLE_RESULT = {
  score: 38,
  roast: 'Your listing is the retail equivalent of a handshake with a limp wrist — technically there, but inspiring zero confidence.',
  fixes: [
    'Rewrite the main title — add primary keyword in first 80 chars.',
    'Replace hero image — pure white background, no text or collages.',
    'Add A+ Content — listings with it convert 10% higher on average.',
  ],
  revenue_upside: { lost_monthly: 2400, lost_yearly: 28800 },
};

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* Animated counter */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = target / 50;
        const t = setInterval(() => {
          start += step;
          if (start >= target) { setVal(target); clearInterval(t); }
          else setVal(Math.floor(start));
        }, 28);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* Mini score ring for the preview */
function MiniScoreRing({ score }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 400); return () => clearTimeout(t); }, []);
  const r = 22, circ = 2 * Math.PI * r;
  const color = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626';
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={go ? circ - (score / 100) * circ : circ}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <span style={{ position: 'absolute', fontSize: 13, fontWeight: 900, color: '#111' }}>{score}</span>
    </div>
  );
}

export default function App() {
  const [imageData, setImageData] = useState(null);
  const [result,    setResult]    = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stage,     setStage]     = useState(0);
  const [error,     setError]     = useState(null);
  const uploadRef = useRef(null);

  const handleImageSelect = (b64, mt, url) => {
    setImageData({ base64: b64, mediaType: mt, dataUrl: url });
    setResult(null); setError(null);
  };
  const handleAnalyze = async () => {
    if (!imageData) return;
    setIsLoading(true); setStage(0); setError(null);
    const iv = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 2200);
    try {
      setResult(await analyzeListingImage(imageData.base64, imageData.mediaType));
    } catch (err) {
      setError(
        err.message === 'MISSING_API_KEY' ? 'Add REACT_APP_GEMINI_API_KEY to .env and restart.' :
        err.message?.includes('rate')      ? 'Rate limit — wait a moment and try again.' :
        err.message || 'Something went wrong.'
      );
    } finally { clearInterval(iv); setIsLoading(false); }
  };
  const handleReset = () => { setImageData(null); setResult(null); setError(null); };

  const scrollToUpload = () => uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ══ HEADER ══ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(237,232,225,0.93)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none' }}><PixiiLogo /></a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {result && <button onClick={handleReset} className="btn-outline" style={{ fontSize: 13 }}>↺ New listing</button>}
          </div>
        </div>
      </header>

      {!result && (
        <main style={{ flex: 1 }}>

          {/* ══ ROAST TICKER ══ */}
          <div style={{ background: 'var(--bg-dark)', padding: '10px 0', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="ticker-wrap">
              <div className="ticker-inner">
                {[...TICKER_QUOTES, ...TICKER_QUOTES].map((q, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 40px', fontSize: 13, color: '#aaa', whiteSpace: 'nowrap' }}>
                    {q}
                    <span style={{ marginLeft: 40, color: '#333' }}>·</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ══ HERO ══ */}
          <section className="grid-bg" style={{ padding: '80px 32px 60px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

              {/* LEFT — copy + upload */}
              <div className="anim-slide-left">
                {/* Live badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '6px 14px', borderRadius: 999, background: 'rgba(191,68,25,0.08)', border: '1px solid rgba(191,68,25,0.2)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse-ring 2s infinite' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>FREE · No account needed</span>
                </div>

                <h1 style={{ fontSize: 'clamp(40px, 5.5vw, 68px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2.5px', color: '#111', marginBottom: 22 }}>
                  AI that grades<br />Amazon listings.<br />
                  <span style={{ color: 'var(--accent)' }}>Instantly.</span>
                </h1>

                <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
                  Upload a screenshot. Get a <strong style={{ color: '#333' }}>brutal roast</strong>, exact fixes, and the revenue you're leaving on the table — in under 30 seconds.
                </p>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 28, marginBottom: 36, flexWrap: 'wrap' }}>
                  {[
                    { n: 2400, suf: '+', label: 'listings roasted' },
                    { n: 94,   suf: '%', label: 'accuracy rate' },
                    { n: 30,   suf: 's', label: 'avg. analysis time' },
                  ].map(({ n, suf, label }) => (
                    <div key={label}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: '#111', letterSpacing: '-1px', lineHeight: 1 }}>
                        <Counter target={n} suffix={suf} />
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 3, fontWeight: 500 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Upload box */}
                <div ref={uploadRef}>
                  <div className="input-group" style={{ padding: 8, gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRight: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
                      <span style={{ fontSize: 17 }}>🖼</span>
                      <span style={{ fontSize: 12, color: '#aaa', fontWeight: 600, letterSpacing: '0.05em' }}>IMG</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <ImageUploader onImageSelect={handleImageSelect} isLoading={isLoading} inline />
                    </div>
                    <button onClick={handleAnalyze} disabled={!imageData || isLoading} className="btn-primary" style={{ flexShrink: 0, fontSize: 15, padding: '11px 26px' }}>
                      {isLoading
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner />{STAGES[stage]}</span>
                        : 'Analyze →'}
                    </button>
                  </div>

                  {isLoading && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 10, paddingLeft: 4 }}>
                      {STAGES.map((_, i) => (
                        <div key={i} style={{ height: 3, borderRadius: 99, width: i <= stage ? 22 : 7, background: i <= stage ? 'var(--accent)' : 'rgba(0,0,0,0.12)', transition: 'all 0.4s ease' }} />
                      ))}
                    </div>
                  )}

                  {error && (
                    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(191,68,25,0.07)', border: '1px solid rgba(191,68,25,0.2)', color: 'var(--accent)', fontSize: 13, display: 'flex', gap: 8 }}>
                      <span>⚠</span><span>{error}</span>
                    </div>
                  )}
                </div>

                <p style={{ fontSize: 12, color: '#bbb', marginTop: 12 }}>Free demo · PNG, JPG, WebP · Results in ~30 seconds</p>
              </div>

              {/* RIGHT — live sample result preview */}
              <div className="anim-slide-right" style={{ position: 'relative' }}>

                {/* Floating badges */}
                <div style={{ position: 'absolute', top: -20, right: 20, zIndex: 5, animation: 'float-badge 3.5s ease-in-out infinite' }}>
                  <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>💸</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>+$2,400/mo</div>
                      <div style={{ fontSize: 10, color: '#aaa', fontWeight: 500 }}>revenue unlocked</div>
                    </div>
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 80, left: -24, zIndex: 5, animation: 'float-badge2 4s ease-in-out infinite' }}>
                  <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>⚡</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>3 instant fixes</div>
                      <div style={{ fontSize: 10, color: '#aaa', fontWeight: 500 }}>ready to action</div>
                    </div>
                  </div>
                </div>

                {/* Sample result card */}
                <div className="mock-card" style={{ padding: 24, animationDelay: '200ms' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Sample Report</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#111', letterSpacing: '-0.3px' }}>Wireless Earbuds Listing</div>
                    </div>
                    <MiniScoreRing score={SAMPLE_RESULT.score} />
                  </div>

                  {/* Roast preview */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>🔥 The Roast</div>
                    <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, borderLeft: '2px solid var(--accent)', paddingLeft: 12, fontStyle: 'italic' }}>
                      "{SAMPLE_RESULT.roast}"
                    </p>
                  </div>

                  {/* Revenue */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                    {[
                      { v: `$${SAMPLE_RESULT.revenue_upside.lost_monthly.toLocaleString()}/mo`, l: 'lost monthly' },
                      { v: `$${SAMPLE_RESULT.revenue_upside.lost_yearly.toLocaleString()}/yr`,  l: 'lost yearly' },
                    ].map(({ v, l }) => (
                      <div key={l} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 10, background: '#f0faf3', border: '1px solid rgba(22,163,74,0.12)' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a', letterSpacing: '-0.5px' }}>{v}</div>
                        <div style={{ fontSize: 10, color: '#6b9e7a', marginTop: 3, fontWeight: 600 }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Fixes */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>⚡ Top Fixes</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {SAMPLE_RESULT.fixes.map((f, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 9, background: '#faf9f7', border: '1px solid rgba(0,0,0,0.06)' }}>
                          <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 6, background: 'rgba(191,68,25,0.08)', border: '1px solid rgba(191,68,25,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)' }}>{i + 1}</span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#555', lineHeight: 1.5 }}>{f}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA overlay */}
                  <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(191,68,25,0.06) 0%, rgba(191,68,25,0.02) 100%)', border: '1px dashed rgba(191,68,25,0.25)', textAlign: 'center', cursor: 'pointer' }}
                    onClick={scrollToUpload}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>👆 Upload your listing to get this</p>
                    <p style={{ fontSize: 11, color: '#bbb' }}>Free · No account · 30 seconds</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══ HOW IT WORKS ══ */}
          <section style={{ background: '#fff', padding: '64px 32px', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>How it works</p>
              <h2 style={{ textAlign: 'center', fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#111', marginBottom: 48 }}>Three steps to a better listing</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }} className="stagger">
                {[
                  { n: '01', icon: '📸', title: 'Upload screenshot', body: 'Grab a screenshot of any Amazon listing — yours or a competitor\'s.' },
                  { n: '02', icon: '🤖', title: 'Our algorithm analyzes it', body: 'Our AI reads title, images, bullets, pricing, and positioning in seconds.' },
                  { n: '03', icon: '💰', title: 'Get your report', body: 'Score, roast, 3 prioritized fixes, and a revenue impact estimate.' },
                ].map(({ n, icon, title, body }) => (
                  <div key={n} style={{ textAlign: 'center', padding: '28px 24px', borderRadius: 16, background: '#faf9f7', border: '1px solid rgba(0,0,0,0.07)' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(191,68,25,0.07)', border: '1px solid rgba(191,68,25,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>{icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', marginBottom: 8 }}>{n}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 8 }}>{title}</div>
                    <div style={{ fontSize: 13, color: '#888', lineHeight: 1.65 }}>{body}</div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <button onClick={scrollToUpload} className="btn-primary pulse-btn" style={{ fontSize: 16, padding: '14px 36px' }}>
                  🔥 Roast My Listing — Free
                </button>
              </div>
            </div>
          </section>

          {/* ══ SOCIAL PROOF BAND ══ */}
          <div style={{ background: 'var(--bg-dark)', padding: '44px 32px' }}>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#555', marginBottom: 32, fontWeight: 500 }}>
              Top agencies and brands use Pixii to scale their creative
            </p>
            <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(24px,4vw,64px)', flexWrap: 'wrap' }}>
              {BRANDS.map(b => (
                <span key={b} style={{ fontSize: 14, fontWeight: 800, color: '#444', letterSpacing: '-0.2px', textTransform: b === '7-Eleven' || b === 'Huel' ? 'none' : 'uppercase', fontStyle: b === 'Huel' ? 'italic' : 'normal' }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ══ RESULTS ══ */}
      {result && (
        <main className="grid-bg" style={{ flex: 1, padding: '48px 32px 80px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div className="anim-fade-in" style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#111', marginBottom: 6 }}>Listing Report</h2>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>Analyzed by our algorithm · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <button onClick={handleReset} className="btn-outline" style={{ fontSize: 14 }}>↺ Analyze another</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,3fr)', gap: 24, alignItems: 'start' }}>
              <div className="anim-fade-up">
                <ImageUploader onImageSelect={handleImageSelect} isLoading={false} sidebarMode />
                {error && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(191,68,25,0.07)', border: '1px solid rgba(191,68,25,0.2)', color: 'var(--accent)', fontSize: 13 }}>{error}</div>}
              </div>
              <div className="anim-slide-right">
                <RoastDisplay result={result} />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ══ FOOTER ══ */}
      <footer style={{ background: result ? 'var(--bg)' : 'var(--bg-dark)', borderTop: `1px solid ${result ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}`, padding: '24px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: result ? '#aaa' : '#444' }}>
            Built by <span style={{ color: result ? '#666' : '#777', fontWeight: 600 }}>Pankaj Gupta</span> · Pixii Founding Engineer Application
          </p>
          <a href="https://pixii.ai" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>pixii.ai ↗</a>
        </div>
      </footer>
    </div>
  );
}

function PixiiLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px', color: '#111' }}>P</span>
      <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px', color: 'var(--accent)' }}>ixii</span>
      <span style={{ fontWeight: 400, fontSize: 20, color: '#999', marginLeft: 1 }}>.ai</span>
      <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: '#aaa' }}>Roast</span>
    </div>
  );
}
