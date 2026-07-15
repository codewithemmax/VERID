import Link from "next/link";
import { HeaderAuthNav } from "./HeaderAuthNav";

/** Kora Market top bar — expressive wordmark, categories, and auth controls. */
export function MarketHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-magenta via-violet to-cobalt text-lg font-black text-white">
            K
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Kora<span className="text-magenta">.</span>Market
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-ink-soft lg:flex">
          <span className="cursor-default transition-colors hover:text-ink">
            Handmade
          </span>
          <span className="cursor-default transition-colors hover:text-ink">
            Vintage
          </span>
          <span className="cursor-default transition-colors hover:text-ink">
            Electronics
          </span>
        </nav>
        <HeaderAuthNav />
      </div>
    </header>
  );
}
