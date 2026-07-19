import type { AnalyzeResponse, Signal } from '../shared/types';

const ROOT_ID = 'verid-overlay-root';
const MIN_SCAN_MS = 400;

let root: HTMLDivElement | null = null;
let blockerEl: HTMLDivElement | null = null;
let lastVerdict: AnalyzeResponse | null = null;
let buyIntercepted = false;

// ─── Mount ───────────────────────────────────────────────────────────────────

export function mountOverlay(): void {
  if (document.getElementById(ROOT_ID)) return;
  root = document.createElement('div');
  root.id = ROOT_ID;
  document.body.appendChild(root);
  renderScanning();
}

export function removeOverlay(): void {
  document.getElementById(ROOT_ID)?.remove();
  root = null;
}

// ─── States ──────────────────────────────────────────────────────────────────

export function renderScanning(): void {
  if (!root) return;
  root.innerHTML = `
    <div class="v-pill v-scanning" role="status" aria-live="polite">
      <span class="v-shield-icon">🛡</span>
      <span class="v-dots"><span></span><span></span><span></span></span>
      <span class="v-label">Checking listing…</span>
    </div>`;
}

export function renderUnknown(): void {
  if (!root) return;
  root.innerHTML = `
    <div class="v-pill v-unknown" title="Verid couldn't check this listing.">
      <span class="v-dash" aria-hidden="true">—</span>
      <span class="v-label">Couldn't check</span>
    </div>`;
}

export function renderClear(): void {
  if (!root) return;
  root.innerHTML = `
    <div class="v-pill v-clear" title="Verid checked this listing — no fraud signals detected.">
      <span class="v-icon">✓</span>
      <span class="v-label">No risk signals</span>
    </div>`;
  // Collapse to badge after 3s
  setTimeout(() => {
    const pill = root?.querySelector('.v-pill');
    if (pill) pill.classList.add('v-collapsed');
  }, 3000);
}

export function renderCaution(verdict: AnalyzeResponse): void {
  if (!root) return;
  lastVerdict = verdict;
  const chips = verdict.signals.slice(0, 4).map(s =>
    `<span class="v-chip">${s.label}</span>`
  ).join('');
  const overflow = verdict.signals.length > 4
    ? `<span class="v-chip v-chip-more">+${verdict.signals.length - 4} more</span>` : '';
  const confidenceText = verdict.confidence === 'high' ? 'High confidence'
    : verdict.confidence === 'medium' ? 'Medium confidence'
    : 'Low confidence — limited data';

  root.innerHTML = `
    <div class="v-panel v-caution" role="alert">
      <div class="v-panel-header">
        <span class="v-icon-caution">⚠</span>
        <span class="v-panel-title">Caution · Score ${verdict.score}</span>
      </div>
      <div class="v-chips">${chips}${overflow}</div>
      <button class="v-disclosure-btn" aria-expanded="false">
        <span class="v-chevron">▸</span> What does this mean?
      </button>
      <div class="v-disclosure" hidden>
        <p class="v-explanation">${verdict.explanation}</p>
        <ul class="v-signal-list">
          ${verdict.signals.map(s => `<li><span class="v-bullet v-bullet-caution"></span>${s.label}</li>`).join('')}
        </ul>
        <p class="v-confidence">${confidenceText}</p>
      </div>
    </div>`;

  root.querySelector('.v-disclosure-btn')?.addEventListener('click', () => {
    const btn = root?.querySelector('.v-disclosure-btn') as HTMLButtonElement;
    const disc = root?.querySelector('.v-disclosure') as HTMLElement;
    const chevron = root?.querySelector('.v-chevron') as HTMLElement;
    if (!btn || !disc) return;
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    disc.hidden = open;
    chevron.textContent = open ? '▸' : '▾';
  });
}

export function renderBlock(verdict: AnalyzeResponse): void {
  if (!root) return;
  lastVerdict = verdict;
  interceptBuyButtons(verdict);
}

// ─── Block modal ─────────────────────────────────────────────────────────────

function showBlockModal(verdict: AnalyzeResponse, originalEvent?: Event): void {
  if (blockerEl) return;

  const confidenceText = verdict.confidence === 'high' ? 'High confidence'
    : verdict.confidence === 'medium' ? 'Medium confidence'
    : 'Low confidence — limited data';

  blockerEl = document.createElement('div');
  blockerEl.className = 'v-scrim';
  blockerEl.setAttribute('role', 'dialog');
  blockerEl.setAttribute('aria-modal', 'true');
  blockerEl.setAttribute('aria-labelledby', 'v-blocker-title');
  blockerEl.innerHTML = `
    <div class="v-modal">
      <div class="v-modal-red-rule"></div>
      <div class="v-modal-body">
        <div class="v-modal-header">
          <span class="v-icon-block">⛔</span>
          <h2 id="v-blocker-title">Stop — confirmed scam pattern</h2>
        </div>
        <p class="v-explanation">${verdict.explanation}</p>
        <ul class="v-signal-list">
          ${verdict.signals.map((s: Signal) =>
            `<li><span class="v-bullet v-bullet-block"></span>${s.label}</li>`
          ).join('')}
        </ul>
        <p class="v-confidence">${confidenceText}</p>
      </div>
      <div class="v-modal-actions">
        <button class="v-btn-primary" id="v-go-back">Go back</button>
        <button class="v-btn-secondary" id="v-report">Report listing</button>
        <button class="v-btn-ghost" id="v-proceed">Proceed anyway</button>
      </div>
    </div>`;

  document.body.appendChild(blockerEl);

  const goBack = blockerEl.querySelector('#v-go-back') as HTMLButtonElement;
  goBack?.focus();

  blockerEl.querySelector('#v-go-back')?.addEventListener('click', closeModal);
  blockerEl.querySelector('#v-report')?.addEventListener('click', closeModal);
  blockerEl.querySelector('#v-proceed')?.addEventListener('click', () => {
    closeModal();
    // Re-fire the original click so the buyer can proceed
    if (originalEvent?.target instanceof HTMLElement) {
      originalEvent.target.click();
    }
  });

  document.addEventListener('keydown', handleModalKey);
}

function closeModal(): void {
  blockerEl?.remove();
  blockerEl = null;
  document.removeEventListener('keydown', handleModalKey);
}

function handleModalKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') { closeModal(); return; }
  if (e.key !== 'Tab' || !blockerEl) return;
  const focusable = Array.from(
    blockerEl.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}

// ─── Buy button interception ─────────────────────────────────────────────────

function interceptBuyButtons(verdict: AnalyzeResponse): void {
  if (buyIntercepted) return;
  buyIntercepted = true;

  const selectors = [
    '[data-qa*="buy"]', 'button[class*="buy"]', 'button[class*="Buy"]',
    'button[class*="cart"]', 'button[class*="Cart"]',
    'a[class*="checkout"]', 'button[class*="checkout"]',
    '[class*="add-to-cart"]', '[class*="addToCart"]',
  ];

  document.addEventListener('click', (e) => {
    if (!lastVerdict || lastVerdict.band !== 'block') return;
    const target = e.target as HTMLElement;
    const matched = selectors.some(sel => {
      try { return target.closest(sel) !== null; } catch { return false; }
    });
    if (!matched) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    showBlockModal(verdict, e);
  }, true);
}

// ─── Render verdict ──────────────────────────────────────────────────────────

export async function renderVerdict(
  verdictPromise: Promise<AnalyzeResponse | null>,
  scanStart: number
): Promise<void> {
  mountOverlay();
  renderScanning();

  const verdict = await verdictPromise;

  // Enforce minimum scan display
  const elapsed = Date.now() - scanStart;
  if (elapsed < MIN_SCAN_MS) {
    await new Promise(r => setTimeout(r, MIN_SCAN_MS - elapsed));
  }

  if (!verdict) { renderUnknown(); return; }

  lastVerdict = verdict;

  // Persist verdict for popup
  chrome.storage.local.set({ lastVerdict: verdict, lastScanUrl: location.href });

  if (verdict.band === 'clear')   { renderClear();           return; }
  if (verdict.band === 'caution') { renderCaution(verdict);  return; }
  if (verdict.band === 'block')   { renderBlock(verdict);    return; }
  renderUnknown();
}
