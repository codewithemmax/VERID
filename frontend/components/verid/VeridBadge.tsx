"use client";

// F2.2 — VeridBadge.
// Space is reserved on mount (h-7 w-7 inline-block) so the Buy button never
// shifts by a pixel regardless of which state renders.

import { useVerid } from "@/context/VeridProvider";

export function VeridBadge() {
  const { status, verdict } = useVerid();

  // Scanning state — grey pulsing dot
  if (status === "scanning" || status === "idle") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center"
        title="Verid is checking…"
        aria-label="Verid is checking this listing"
      >
        <span
          className="block h-3 w-3 rounded-full bg-verid-unknown animate-verid-pulse"
          aria-hidden="true"
        />
      </span>
    );
  }

  // Failed / unknown — grey dash, never green
  if (status === "failed" || !verdict) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center"
        title="Verid couldn't check this listing."
        aria-label="Verid analysis unavailable"
      >
        <span className="block h-0.5 w-4 rounded-full bg-verid-unknown" aria-hidden="true" />
      </span>
    );
  }

  // Done — colour by band
  const band = verdict.band;

  if (band === "clear") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center"
        title="No risk signals detected."
        aria-label="Verid: no risk signals detected"
      >
        <ShieldCheck colour="#22C55E" />
      </span>
    );
  }

  if (band === "caution") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center"
        title={`Verid: ${verdict.signals.length} unusual signal${verdict.signals.length === 1 ? "" : "s"}`}
        aria-label="Verid caution"
      >
        <ShieldCheck colour="#F59E0B" />
      </span>
    );
  }

  // block
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center"
      title="Verid: high-risk listing"
      aria-label="Verid: high risk"
    >
      <ShieldCheck colour="#EF4444" />
    </span>
  );
}

function ShieldCheck({ colour }: { colour: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
        fill={colour}
        fillOpacity="0.18"
        stroke={colour}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke={colour}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
