import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketHeader } from "@/components/marketplace/MarketHeader";
import { ProductGallery } from "@/components/marketplace/ProductGallery";
import { ProductDetails } from "@/components/marketplace/ProductDetails";
import { SellerCard } from "@/components/marketplace/SellerCard";
import { ReviewSection } from "@/components/marketplace/ReviewSection";
import { BuyButton } from "@/components/marketplace/BuyButton";
import { VeridProvider } from "@/context/VeridProvider";
import { getListingById } from "@/lib/listings";

// Listings are live DB rows — render per request.
export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  return (
    <VeridProvider>
      <MarketHeader />

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <nav className="py-5 text-sm text-ink-soft">
          <Link href="/" className="font-semibold hover:text-ink">
            ← Back to Kora Market
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left — imagery */}
          <ProductGallery images={listing.images} title={listing.title} />

          {/* Right — details, seller, buy */}
          <div className="flex flex-col gap-6">
            <ProductDetails listing={listing} />
            <SellerCard listing={listing} />

            {/*
              Verid mounts its overlay around this region at runtime (Phase 2):
              the badge sits beside Buy, the caution banner inserts above it, and
              the blocker intercepts the click. Phase 1 renders only the button.
            */}
            <div className="mt-2">
              <BuyButton />
              <p className="mt-3 text-center text-xs text-ink-soft">
                Secure checkout · Buyer protection on eligible orders
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 max-w-3xl">
          <ReviewSection reviews={listing.reviews} />
        </div>
      </main>
    </VeridProvider>
  );
}
