import { useState, useRef } from 'react';

export default function ImageUploader({ onImageSelect, isLoading, inline, sidebarMode }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview,    setPreview]    = useState(null);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!valid.includes(file.type)) { alert('Please upload a JPEG, PNG, WebP, or GIF.'); return; }
    if (file.size > 20 * 1024 * 1024) { alert('File must be under 20MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      setPreview(url);
      const [hdr, b64] = url.split(',');
      onImageSelect(b64, hdr.match(/:(.*?);/)[1], url);
    };
    reader.readAsDataURL(file);
  };

  const onDrop     = (e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onPaste    = (e) => {
    for (const item of (e.clipboardData?.items || []))
      if (item.type.startsWith('image/')) { handleFile(item.getAsFile()); break; }
  };
  const click = () => !isLoading && fileRef.current?.click();

  /* ── Inline mode (inside the hero input bar) ── */
  if (inline) {
    return (
      <div onPaste={onPaste} tabIndex={0} style={{ outline: 'none', width: '100%' }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />
        <div
          onClick={click}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px',
            cursor: isLoading ? 'default' : 'pointer',
          }}
        >
          {preview ? (
            <>
              <img src={preview} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 14, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Screenshot uploaded · click to change
              </span>
            </>
          ) : (
            <span style={{ fontSize: 14, color: isDragging ? 'var(--accent)' : '#aaa', transition: 'color 0.2s' }}>
              {isDragging ? 'Drop here…' : 'Upload listing screenshot or drag & drop'}
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── Sidebar / full mode ── */
  return (
    <div onPaste={onPaste} tabIndex={0} style={{ outline: 'none' }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])} />

      <div
        onClick={click}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setIsDragging(false)}
        className={`upload-zone${isDragging ? ' dragging' : ''}${preview ? ' has-image' : ''}`}
        style={{ overflow: 'hidden', position: 'relative', pointerEvents: isLoading ? 'none' : 'auto' }}
      >
        {preview ? (
          <div style={{ position: 'relative' }}>
            <img src={preview} alt="Listing" style={{ width: '100%', maxHeight: sidebarMode ? 480 : 280, objectFit: 'contain', display: 'block' }} />
            {isLoading && <div className="shimmer" style={{ position: 'absolute', inset: 0 }} />}
            {!isLoading && (
              <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(191,68,25,0.1)', border: '1px solid rgba(191,68,25,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                    <svg width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/>
                    </svg>
                  </div>
                  <p style={{ color: '#333', fontSize: 13, fontWeight: 600 }}>Change image</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="24" height="24" fill="none" stroke={isDragging ? 'var(--accent)' : '#bbb'} strokeWidth="1.5" viewBox="0 0 24 24" style={{ transition: 'stroke 0.2s' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: isDragging ? 'var(--accent)' : '#555', marginBottom: 6, transition: 'color 0.2s' }}>
              {isDragging ? 'Drop it!' : 'Drop your Amazon screenshot'}
            </p>
            <p style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>or click to browse · paste with Ctrl+V</p>
            <div style={{ display: 'flex', gap: 5 }}>
              {['PNG', 'JPG', 'WebP'].map(f => (
                <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)', color: '#aaa' }}>{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
