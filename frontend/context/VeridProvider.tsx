"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AnalyzeResponse } from "@shared/types";

/**
 * VeridProvider — the single source of truth for the Verid overlay's runtime
 * state. It is the ONLY bridge between the page and the overlay; the mock
 * marketplace never imports from here (see code-standards.md rule 5).
 *
 * Phase 1 only establishes the context + default state. The overlay components
 * that consume it (VeridBadge, VeridBanner, VeridBlocker) arrive in Phase 2,
 * and the live API wiring that drives `status`/`verdict` arrives in Phase 3.
 */

export type VeridStatus = "idle" | "scanning" | "done" | "failed";

export interface VeridState {
  status: VeridStatus;
  verdict: AnalyzeResponse | null;
  blockerOpen: boolean;
  setStatus: (status: VeridStatus) => void;
  setVerdict: (verdict: AnalyzeResponse | null) => void;
  setBlockerOpen: (open: boolean) => void;
}

const DEFAULT_STATE = {
  status: "idle" as VeridStatus,
  verdict: null as AnalyzeResponse | null,
  blockerOpen: false,
};

const VeridContext = createContext<VeridState | null>(null);

export function VeridProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VeridStatus>(DEFAULT_STATE.status);
  const [verdict, setVerdict] = useState<AnalyzeResponse | null>(
    DEFAULT_STATE.verdict,
  );
  const [blockerOpen, setBlockerOpen] = useState<boolean>(
    DEFAULT_STATE.blockerOpen,
  );

  useEffect(() => {
    // F1.1 verify: provider default state logs on mount.
    // eslint-disable-next-line no-console
    console.log("[Verid] provider mounted — default state:", DEFAULT_STATE);
  }, []);

  const value = useMemo<VeridState>(
    () => ({
      status,
      verdict,
      blockerOpen,
      setStatus,
      setVerdict,
      setBlockerOpen,
    }),
    [status, verdict, blockerOpen],
  );

  return <VeridContext.Provider value={value}>{children}</VeridContext.Provider>;
}

export function useVerid(): VeridState {
  const ctx = useContext(VeridContext);
  if (!ctx) {
    throw new Error("useVerid must be used within a <VeridProvider>");
  }
  return ctx;
}
