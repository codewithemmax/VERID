import { extractAll } from './extract';
import { renderVerdict, removeOverlay } from './overlay';
import type { AnalyzeResponse } from '../shared/types';

const API_URL = 'https://verid-backend.up.railway.app'; // replace with deployed URL
const TIMEOUT_MS = 5000;

async function analyze(): Promise<AnalyzeResponse | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const payload = await extractAll();
    const res = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json() as AnalyzeResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function run(): Promise<void> {
  // Check on/off toggle
  const { veridEnabled } = await chrome.storage.sync.get({ veridEnabled: true });
  if (!veridEnabled) { removeOverlay(); return; }

  const scanStart = Date.now();
  await renderVerdict(analyze(), scanStart);
}

// Run on page load
run();

// Re-run on SPA navigation (Jumia uses client-side routing)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    run();
  }
}).observe(document.body, { childList: true, subtree: true });

// Listen for manual re-scan from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'RESCAN') run();
});
