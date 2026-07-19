"use client";

// F2.3 — VeridBanner (caution band, score 31–85).
// Dark instrument rectangle — deliberately styled unlike the marketplace's
// warm rounded cards. Inserts above Buy, pushes content down (unavoidable
// is its job). Buy button stays fully enabled.

import { useState } from "react";
import type { Signal } from "@shared/types";
import { useVerid } from "@/context/VeridProvider";

const MAX_VISIBLE_CHIPS = 4;

export function VeridBanner() {
  const { verdict } = useVerid();
  const [expanded, setExpanded] = useState(false);

  if (!verdict || verdict.band !== "caution") return null;

  const { signals, explanation, confidence } = verdict;
  const visible = signals.slice(0, MAX_VISIBLE_CHIPS);
  const overflow = signals.length - MAX_VISIBLE_CHIPS;

  const confidenceLabel =
    confidence === "high" ? "High confidence"
    : confidence === "medium" ? "Medium confidence"
    : "Low confidence — limited data";

  return (
    <div
      role="alert"
      className="rounded-xl border border-verid-border bg-verid-surface font-verid-body text-verid-text shadow-lift"
      style={{ transition: "all 200ms ease-out" }}
    >
      {/* Top bar */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <span className="mt-0.5 shrink-0 text-verid-caution" aria-hidden="true">
          <WarningIcon />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-verid-head text-sm font-bold text-verid-caution">
            Caution — {signals.length} unusual signal{signals.length === 1 ? "" : "s"}
          </p>
          {/* Signal chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visible.map((s: Signal) => (
              <SignalChip key={s.label} signal={s} />
            ))}
            {overflow > 0 && (
              <span className="inline-flex items-center rounded-md bg-verid-surface-alt px-2 py-0.5 text-xs text-verid-text-dim">
                +{overflow} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Disclosure toggle */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1.5 border-t border-verid-border px-4 py-2.5 text-left text-xs font-semibold text-verid-text-dim transition-colors hover:text-verid-text"
        aria-expanded={expanded}
      >
        <ChevronIcon expanded={expanded} />
        {expanded ? "Hide details" : "What does this mean?"}
      </button>

      {/* Expanded disclosure */}
      {expanded && (
        <div className="border-t border-verid-border px-4 pb-4 pt-3 text-sm">
          <p className="leading-relaxed text-verid-text">{explanation}</p>

          {signals.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {signals.map((s: Signal) => (
                <li key={s.label} className="flex items-start gap-2 text-verid-text-dim">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-verid-caution" aria-hidden="true" />
                  {s.label}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs text-verid-text-dim">
            Confidence: {confidenceLabel}
          </p>
        </div>
      )}
    </div>
  );
}

function SignalChip({ signal }: { signal: Signal }) {
  return (
    <span className="inline-flex items-center rounded-md bg-verid-surface-alt px-2 py-0.5 text-xs text-verid-text">
      {signal.label}
    </span>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
      <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      className={`transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
