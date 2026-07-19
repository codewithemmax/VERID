"use client";

// BuyRegion — the client wrapper around the buy interaction.
// Renders: VeridBanner (caution) → badge + BuyButton row → footer copy.
// On block band: Buy click opens the blocker instead of proceeding.
// The BuyButton itself stays dumb — it never imports Verid.

import { useVerid } from "@/context/VeridProvider";
import { VeridBadge } from "./VeridBadge";
import { VeridBanner } from "./VeridBanner";
import { BuyButton } from "@/components/marketplace/BuyButton";

export function BuyRegion() {
  const { verdict, setBlockerOpen } = useVerid();

  function handleBuy() {
    if (verdict?.band === "block") {
      setBlockerOpen(true);
      return;
    }
    // clear / caution / unknown — proceed (mock checkout)
    alert("Proceeding to checkout…");
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      {/* Caution banner inserts here — pushes Buy down, unavoidable by design */}
      <VeridBanner />

      {/* Badge sits inline with the button row */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <BuyButton onBuy={handleBuy} />
        </div>
        <VeridBadge />
      </div>

      <p className="text-center text-xs text-ink-soft">
        Secure checkout · Buyer protection on eligible orders
      </p>
    </div>
  );
}
