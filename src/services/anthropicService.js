const ROAST_PROMPT = `You are a brutally honest Amazon listing analyst. Analyze this product screenshot and return ONLY valid JSON with:
{
  "roast": "funny but harsh critique",
  "score": 85,
  "revenue_upside": { "lost_monthly": 5000, "lost_yearly": 60000 },
  "fixes": ["Fix 1", "Fix 2", "Fix 3"]
}
No markdown, no extra text, just pure JSON.`;

/** Compress + resize image to max 800px wide, JPEG 0.75 quality */
function compressImage(base64, mimeType) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      const b64 = dataUrl.split(',')[1];
      resolve({ base64: b64, mimeType: 'image/jpeg' });
    };
    img.onerror = () => resolve({ base64, mimeType });
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

async function callOpenRouter(apiKey, model, base64, mimeType) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: ROAST_PROMPT },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const e = new Error(err?.error?.message || `HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  console.log('[OpenRouter raw]', text);

  // Strip markdown code fences if present
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format');
  return JSON.parse(jsonMatch[0]);
}

export async function analyzeListingImage(base64Image, mediaType) {
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') throw new Error('MISSING_API_KEY');

  // Compress before sending — dramatically reduces payload
  const { base64, mimeType } = await compressImage(base64Image, mediaType);

  // Try models in order; all support vision
  const MODELS = [
    'google/gemini-2.0-flash-001',
    'google/gemini-flash-1.5',
    'meta-llama/llama-3.2-90b-vision-instruct',
  ];

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await callOpenRouter(apiKey, model, base64, mimeType);
      } catch (err) {
        const isRateLimit =
          err?.status === 429 ||
          err?.message?.toLowerCase().includes('rate') ||
          err?.message?.toLowerCase().includes('quota');

        if (isRateLimit) {
          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          break; // try next model
        }
        throw err; // non-rate-limit — fail fast
      }
    }
  }

  throw new Error('All models rate limited. Please wait 30 seconds and try again.');
}
