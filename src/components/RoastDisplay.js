import { useState, useEffect, useRef } from 'react';

/* ── Score ring ── */
function ScoreRing({ score }) {
  const [go, setGo] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGo(true), 80); return () => clearTimeout(t); }, []);

  const r    = 40;
  const circ = 2 * Math.PI * r;   // ≈ 251.3
  const offset = go ? circ - (score / 100) * circ : circ;

  const color  = score >= 70 ? '#16a34a' : score >= 45 ? '#d97706' : '#dc2626';
  const bg     = score >= 70 ? 'rgba(22,163,74,0.07)'  : score >= 45 ? 'rgba(217,119,6,0.07)'  : 'rgba(220,38,38,0.07)';
  const border = score >= 70 ? 'rgba(22,163,74,0.2)'   : score >= 45 ? 'rgba(217,119,6,0.2)'   : 'rgba(220,38,38,0.2)';
  const label  = score >= 70 ? 'Good'   : score >= 45  ? 'Fair'  : 'Poor';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="104" height="104" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="52" cy="52" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="6"/>
          <circle cx="52" cy="52" r={r} fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#111', lineHeight: 1, letterSpacing: '-1px' }}>{score}</div>
          <div style={{ fontSize: 11, color: '#bbb', fontWeight: 500 }}>/100</div>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99, background: bg, border: `1px solid ${border}`, color }}>{label}</span>
    </div>
  );
}

/* ── Section label ── */
function Label({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </p>
  );
}

/* ── Fix row ── */
function FixRow({ num, title }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 10, background: '#faf9f7', border: '1px solid rgba(0,0,0,0.07)', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'}
    >
      <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 7, background: 'rgba(191,68,25,0.08)', border: '1px solid rgba(191,68,25,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)' }}>{num}</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#444', lineHeight: 1.6, margin: 0 }}>{title}</p>
    </div>
  );
}

/* ── Main ── */
export default function RoastDisplay({ result }) {
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, []);

  const copy = () => {
    navigator.clipboard.writeText(result.roast);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} className="stagger">

      {/* ── Score ── */}
      <div className="card-white" style={{ padding: '22px 24px' }}>
        <Label>Listing Score</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <ScoreRing score={result.score} />
        </div>
      </div>

      {/* ── Roast ── */}
      <div className="card-white" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Label>🔥 The Roast</Label>
          <button onClick={copy} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
            cursor: 'pointer',
            background: copied ? 'rgba(22,163,74,0.07)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${copied ? 'rgba(22,163,74,0.2)' : 'rgba(0,0,0,0.1)'}`,
            color: copied ? '#16a34a' : '#888',
            transition: 'all 0.2s',
          }}>
            {copied
              ? <><CheckIcon /> Copied</>
              : <><CopyIcon /> Copy</>}
          </button>
        </div>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75 }}>{result.roast}</p>
      </div>

      {/* ── Revenue ── */}
      <div style={{ background: '#f0faf3', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 14, padding: '22px 24px' }}>
        <Label>💰 Revenue Upside</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { val: `$${result.revenue_upside.lost_monthly.toLocaleString()}/mo`, sub: 'lost monthly' },
            { val: `$${result.revenue_upside.lost_yearly.toLocaleString()}/yr`,  sub: 'lost yearly' },
          ].map(({ val, sub }) => (
            <div key={sub} style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 10, background: '#fff', border: '1px solid rgba(22,163,74,0.12)' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a', letterSpacing: '-1px', lineHeight: 1.1 }}>{val}</div>
              <div style={{ fontSize: 11, color: '#6b9e7a', marginTop: 4, fontWeight: 500 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fixes ── */}
      <div className="card-white" style={{ padding: '22px 24px' }}>
        <Label>⚡ Top Fixes</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {result.fixes.map((fix, i) => <FixRow key={i} num={i + 1} title={fix} />)}
        </div>
      </div>

    </div>
  );
}

function CopyIcon() {
  return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>;
}
function CheckIcon() {
  return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
}
