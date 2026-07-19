import type { AnalyzeResponse } from '../shared/types';

const verdictArea  = document.getElementById('verdict-area')!;
const siteLabel    = document.getElementById('site-label')!;
const scanBtn      = document.getElementById('scan-btn') as HTMLButtonElement;
const toggle       = document.getElementById('enabled-toggle') as HTMLInputElement;
const toggleLabel  = document.getElementById('toggle-label')!;

// ─── Load state ──────────────────────────────────────────────────────────────

chrome.storage.local.get(['lastVerdict', 'lastScanUrl'], (data) => {
  const verdict: AnalyzeResponse | undefined = data.lastVerdict;
  const url: string | undefined = data.lastScanUrl;

  if (url) {
    try {
      siteLabel.textContent = `Last scan: ${new URL(url).hostname}`;
    } catch { /* ignore */ }
  }

  if (!verdict) return;
  renderVerdict(verdict);
});

chrome.storage.sync.get({ veridEnabled: true }, ({ veridEnabled }) => {
  toggle.checked = veridEnabled;
  toggleLabel.textContent = veridEnabled ? 'On' : 'Off';
});

// ─── Toggle ──────────────────────────────────────────────────────────────────

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  toggleLabel.textContent = enabled ? 'On' : 'Off';
  chrome.storage.sync.set({ veridEnabled: enabled });
});

// ─── Scan button ─────────────────────────────────────────────────────────────

scanBtn.addEventListener('click', async () => {
  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning…';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'RESCAN' });
  }
  setTimeout(() => {
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan this page';
  }, 3000);
});

// ─── Render ──────────────────────────────────────────────────────────────────

function renderVerdict(verdict: AnalyzeResponse): void {
  const band = verdict.band;
  const bandLabel = band === 'clear' ? '✓ Clear'
    : band === 'caution' ? '⚠ Caution'
    : '⛔ High Risk';

  const topSignals = verdict.signals.slice(0, 3);
  const signalsHtml = topSignals.length > 0
    ? `<ul class="signals-list">${topSignals.map(s =>
        `<li><span class="sig-dot"></span>${s.label}</li>`
      ).join('')}</ul>`
    : '';

  verdictArea.innerHTML = `
    <div class="verdict-card">
      <div class="verdict-row">
        <span class="score-num ${band}">${verdict.score}</span>
        <div>
          <div class="band-label ${band}">${bandLabel}</div>
        </div>
      </div>
      ${signalsHtml}
    </div>`;
}
