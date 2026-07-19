"use client";

// VeridScanner — mounts inside VeridProvider, fires the analysis on page load.
// 400ms minimum scanning duration (ui-context.md): a verdict that appears
// instantly reads as hardcoded. The 400ms is what makes real work look real.

import { useEffect } from "react";
import { useVerid } from "@/context/VeridProvider";
import { extractPageData } from "@/lib/extract-page-data";

const BACKEND_URL = process.env.NEXT_PUBLIC_VERID_API_URL ?? "http://localhost:3001";
const MIN_SCAN_MS = 400;
const CLIENT_TIMEOUT_MS = 5000;

export function VeridScanner() {
  const { setStatus, setVerdict } = useVerid();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    async function run() {
      setStatus("scanning");
      const start = Date.now();

      try {
        const payload = extractPageData();
        if (!payload) {
          setStatus("failed");
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        const verdict = await res.json();

        // Enforce minimum scan duration
        const elapsed = Date.now() - start;
        if (elapsed < MIN_SCAN_MS) {
          await new Promise((r) => setTimeout(r, MIN_SCAN_MS - elapsed));
        }

        if (cancelled) return;
        setVerdict(verdict);
        setStatus("done");
      } catch {
        if (cancelled) return;
        // Any failure → unknown state. Never a React error boundary.
        setStatus("failed");
      } finally {
        clearTimeout(timeout);
      }
    }

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null; // renders nothing — drives context only
}
