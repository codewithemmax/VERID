import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketHeader } from "@/components/marketplace/MarketHeader";
import { ProductGallery } from "@/components/marketplace/ProductGallery";
import { ProductDetails } from "@/components/marketplace/ProductDetails";
import { SellerCard } from "@/components/marketplace/SellerCard";
import { ReviewSection } from "@/components/marketplace/ReviewSection";
import { BuyButton } from "@/components/marketplace/BuyButton";
import { VeridProvider } from "@/context/VeridProvider";
import { VeridBadge } from "@/components/verid/VeridBadge";
import { VeridBanner } from "@/components/verid/VeridBanner";
import { VeridBlocker } from "@/components/verid/VeridBlocker";
import { VeridScanner } from "@/components/verid/VeridScanner";
import { BuyRegion } from "@/components/verid/BuyRegion";
import { getListingById } from "@/lib/listings";

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
      {/* VeridScanner fires the API call on mount — client component */}
      <VeridScanner />
      {/* VeridBlocker renders the modal when blockerOpen is true */}
      <VeridBlocker />

      <MarketHeader />

      <main className="mx-auto max-w-6xl px-5 pb-24">
        <nav className="py-5 text-sm text-ink-soft">
          <Link href="/" className="font-semibold hover:text-ink">
            ← Back to Kora Market
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={listing.images} title={listing.title} />

          <div className="flex flex-col gap-6">
            <ProductDetails listing={listing} />
            <SellerCard listing={listing} />

            {/*
              BuyRegion is a client component that:
              - renders VeridBanner (caution) above the button
              - renders the badge inline with the button
              - intercepts Buy click for block band → opens blocker
            */}
            <BuyRegion />
          </div>
        </div>

        <div className="mt-4 max-w-3xl">
          <ReviewSection reviews={listing.reviews} />
        </div>
      </main>
    </VeridProvider>
  );
}
