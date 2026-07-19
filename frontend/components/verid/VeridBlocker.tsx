"use client";

// F2.4 — VeridBlocker (block band, score 86–100).
// Fires on Buy click — not on page load. The scrim darkens the entire vibrant
// marketplace so the red panel pops against a dimmed canvas.
// Focus trap: Tab cycles only within the modal. Escape → Go back.

import { useEffect, useRef } from "react";
import type { Signal } from "@shared/types";
import { useVerid } from "@/context/VeridProvider";

export function VeridBlocker() {
  const { verdict, blockerOpen, setBlockerOpen } = useVerid();
  const goBackRef = useRef<HTMLButtonElement>(null);
  const proceedRef = useRef<HTMLButtonElement>(null);

  // Focus the primary action when the modal opens
  useEffect(() => {
    if (blockerOpen) goBackRef.current?.focus();
  }, [blockerOpen]);

  // Escape → Go back
  useEffect(() => {
    if (!blockerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setBlockerOpen(false);
      if (e.key === "Tab") trapFocus(e);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [blockerOpen, setBlockerOpen]);

  function trapFocus(e: KeyboardEvent) {
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      "button, [href], input, [tabindex]:not([tabindex='-1'])"
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  const modalRef = useRef<HTMLDivElement>(null);

  if (!blockerOpen || !verdict || verdict.band !== "block") return null;

  const { signals, explanation, confidence } = verdict;

  const confidenceLabel =
    confidence === "high" ? "High confidence"
    : confidence === "medium" ? "Medium confidence"
    : "Low confidence — limited data";

  return (
    // Scrim — darkens the vibrant marketplace so the red panel wins the frame
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(9,10,13,0.72)", backdropFilter: "blur(4px)" }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="verid-blocker-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-verid-surface font-verid-body text-verid-text shadow-lift"
      >
        {/* Red top rule */}
        <div className="h-1 w-full bg-verid-block" aria-hidden="true" />

        <div className="px-6 py-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-verid-block" aria-hidden="true">
              <BlockIcon />
            </span>
            <h2
              id="verid-blocker-title"
              className="font-verid-head text-lg font-bold leading-snug"
            >
              Stop — this listing shows a confirmed scam pattern
            </h2>
          </div>

          {/* Explanation */}
          <p className="mt-3 text-sm leading-relaxed text-verid-text">
            {explanation}
          </p>

          {/* Signal bullets */}
          {signals.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm">
              {signals.map((s: Signal) => (
                <li key={s.label} className="flex items-start gap-2 text-verid-text-dim">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-verid-block" aria-hidden="true" />
                  {s.label}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs text-verid-text-dim">
            Confidence: {confidenceLabel}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-verid-border px-6 py-4">
          {/* Primary — safe path, loud */}
          <button
            ref={goBackRef}
            type="button"
            onClick={() => setBlockerOpen(false)}
            className="w-full rounded-xl bg-verid-block px-4 py-3 font-verid-head text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Go back
          </button>

          {/* Secondary */}
          <button
            type="button"
            onClick={() => setBlockerOpen(false)}
            className="w-full rounded-xl bg-verid-surface-alt px-4 py-3 font-verid-head text-sm font-semibold text-verid-text transition-colors hover:bg-verid-border"
          >
            Report this listing
          </button>

          {/* Escape hatch — deliberately unattractive */}
          <button
            ref={proceedRef}
            type="button"
            onClick={() => setBlockerOpen(false)}
            className="w-full px-4 py-2 text-xs text-verid-text-dim transition-colors hover:text-verid-text"
          >
            Proceed anyway
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.93 4.93l14.14 14.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
