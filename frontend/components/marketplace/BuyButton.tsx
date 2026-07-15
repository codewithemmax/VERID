"use client";

/**
 * BuyButton — the marketplace's primary CTA (magenta, never a status hue).
 *
 * Phase 1: a styled, working button that "reserves" the item. In Phase 2/3 the
 * Verid blocker intercepts this click for block-band listings — but that logic
 * lives in the overlay, which reads the click via the shared context. The
 * marketplace button itself stays dumb and never imports Verid.
 */
export function BuyButton({ onBuy }: { onBuy?: () => void }) {
  return (
    <button
      type="button"
      data-verid-target="buy-button"
      onClick={onBuy}
      className="group relative w-full overflow-hidden rounded-2xl bg-magenta px-6 py-4 text-lg font-bold text-white shadow-lift transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0"
    >
      <span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-violet to-cobalt opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100"
        aria-hidden="true"
      />
      <span className="relative z-10">Buy now</span>
    </button>
  );
}
