"use client";

import { useState } from "react";

/**
 * ProductGallery — the visual centerpiece. Big rounded frame, playful floating
 * accent blobs, filmstrip thumbnails.
 *
 * Extraction hooks: each unique image URL is exposed exactly once via a
 * `data-verid-target="images"` <img>. The large preview is presentational only
 * (no target) so image URLs are never double-counted during extraction.
 */
export function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const safe = images.length > 0 ? images : [""];

  return (
    <div className="relative">
      {/* floating expressive accents */}
      <div
        className="pointer-events-none absolute -left-5 -top-6 h-20 w-20 rounded-3xl bg-cyan/70 blur-[2px] animate-float-slow"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-4 bottom-16 h-14 w-14 rounded-full bg-violet/70 animate-float-slow"
        style={{ animationDelay: "1.4s" }}
        aria-hidden="true"
      />

      <figure className="relative overflow-hidden rounded-card bg-tint shadow-lift">
        <div className="aspect-square w-full">
          {/* Main preview — carries the extraction target when there is only one
              image (no thumbnails render). When multiple images exist the
              thumbnails below carry the targets; this one is skipped to avoid
              double-counting. */}
          <img
            {...(safe.length === 1 ? { "data-verid-target": "images" } : {})}
            src={safe[active]}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>
        <figcaption className="absolute left-4 top-4">
          <span className="mk-tag bg-surface/90 text-ink shadow-lift-sm">
            {active + 1} / {safe.length}
          </span>
        </figcaption>
      </figure>

      {/* Thumbnails carry the extraction targets — one per unique image URL. */}
      {safe.length > 1 && (
        <ul className="mt-4 flex gap-3" role="list">
          {safe.map((src, i) => (
            <li key={src || i}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={`block overflow-hidden rounded-2xl ring-2 transition ${
                  i === active
                    ? "ring-magenta"
                    : "ring-transparent hover:ring-line"
                }`}
              >
                <img
                  data-verid-target="images"
                  src={src}
                  alt=""
                  className="h-20 w-20 object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
