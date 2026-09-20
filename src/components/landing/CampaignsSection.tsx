"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { landingCopy } from "./copy";
import { Reveal } from "./Reveal";

const { campaigns } = landingCopy;

type Campaign = (typeof campaigns.items)[number];

const CARD_WIDTH = 340;
const CARD_GAP = 24;
const NARROW_CARD_WIDTH = 260;
const NARROW_BREAKPOINT = 680;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// Shape of the bend. The rail reads as wrapped around a cylinder seen head-on:
// cards yaw away from the viewer and sink back as they leave the centre.
const MAX_TILT = 34;
const MAX_DEPTH = 190;
const MIN_SCALE = 0.86;

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Server renders the rail; the first client pass corrects it if motion is reduced. */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * Bends the rail per frame: each card's yaw, depth and scale come from how far
 * its centre sits from the viewport centre, so the row curves away on both
 * sides like the face of a sphere. Reads layout only, writes custom properties
 * the stylesheet consumes, and never touches React state.
 */
function useSphericalBend(enabled: boolean) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !enabled) return;

    let frame = 0;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-carousel-card]"));

    const paint = () => {
      const bounds = rail.getBoundingClientRect();
      const centre = bounds.left + bounds.width / 2;
      const reach = bounds.width / 2 || 1;

      // A card filling most of the rail should barely bend, or it turns edge-on.
      const share = Math.min(1, (cards[0]?.offsetWidth ?? CARD_WIDTH) / reach);
      const damp = Math.max(0.35, 1 - share * 0.7);

      for (const card of cards) {
        const box = card.getBoundingClientRect();
        // -1 at the left edge of the rail, 0 dead centre, 1 at the right edge.
        const offset = Math.max(-1, Math.min(1, (box.left + box.width / 2 - centre) / reach));
        const curve = Math.sin((offset * Math.PI) / 2);

        card.style.setProperty("--card-tilt", `${(-curve * MAX_TILT * damp).toFixed(2)}deg`);
        card.style.setProperty("--card-depth", `${(-Math.abs(curve) * MAX_DEPTH * damp).toFixed(1)}px`);
        card.style.setProperty(
          "--card-scale",
          (1 - Math.abs(curve) * (1 - MIN_SCALE) * damp).toFixed(3),
        );
      }

      frame = requestAnimationFrame(paint);
    };

    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [enabled]);

  return railRef;
}

function subscribeToWidth(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function useIsNarrow() {
  return useSyncExternalStore(
    subscribeToWidth,
    () => window.innerWidth < NARROW_BREAKPOINT,
    () => false,
  );
}

export function CampaignsSection() {
  const reduced = useReducedMotion();
  const narrow = useIsNarrow();
  const cardWidth = narrow ? NARROW_CARD_WIDTH : CARD_WIDTH;
  const shift = campaigns.items.length * (cardWidth + CARD_GAP);
  const fade = narrow ? 8 : 18;
  const railRef = useSphericalBend(!reduced);

  // Keyboard focus pauses too, so tabbing to a link does not chase it away.
  const setPlayState = (state: "paused" | "running") => {
    const track = railRef.current?.querySelector<HTMLElement>("[data-carousel-track]");
    if (track) track.style.animationPlayState = state;
  };
  const pause = () => setPlayState("paused");
  const resume = () => setPlayState("running");

  return (
    <section id="campagnes" className="overflow-hidden py-[clamp(60px,8vw,104px)]">
      <Reveal>
        <div className="mx-auto max-w-[1180px] px-[clamp(20px,5vw,56px)]">
          <h2 className="font-display m-0 mb-14 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
            {campaigns.heading}
          </h2>
        </div>

        {reduced ? (
          <div className="mx-auto max-w-[1180px] px-[clamp(20px,5vw,56px)]">
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
              {campaigns.items.map((item) => (
                <CampaignCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <div
            ref={railRef}
            data-carousel=""
            className="relative w-full overflow-hidden"
            onPointerEnter={pause}
            onPointerLeave={resume}
            onFocusCapture={pause}
            onBlurCapture={resume}
            style={{
              perspective: "1400px",
              perspectiveOrigin: "50% 50%",
              minHeight: narrow ? 400 : 470,
              maskImage:
                `linear-gradient(to right, transparent 0%, #000 ${fade}%, #000 ${100 - fade}%, transparent 100%)`,
              WebkitMaskImage: `linear-gradient(to right, transparent 0%, #000 ${fade}%, #000 ${100 - fade}%, transparent 100%)`,
            }}
          >
            <div
              data-carousel-track=""
              className="flex w-max"
              style={{
                gap: CARD_GAP,
                transformStyle: "preserve-3d",
                ["--carousel-duration" as string]: "56s",
                ["--carousel-gap" as string]: `${CARD_GAP}px`,
                ["--carousel-shift" as string]: `${shift}px`,
              }}
            >
              {/* The list is rendered twice back-to-back so translateX(-50%)
                  lands on an identical card and the seam is invisible. The
                  second pass is decorative: hidden from assistive tech and out
                  of the tab order. */}
              {[0, 1].flatMap((copy) =>
                campaigns.items.map((item) => (
                  <div
                    key={`${item.title}-${copy}`}
                    data-carousel-card=""
                    className="flex-none"
                    style={{ width: cardWidth }}
                  >
                    <CampaignCard item={item} decorative={copy === 1} />
                  </div>
                )),
              )}
            </div>
          </div>
        )}
      </Reveal>
    </section>
  );
}

function CampaignCard({ item, decorative = false }: { item: Campaign; decorative?: boolean }) {
  return (
    <article
      className="tw-glass group/card flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgb(17_26_21/0.35)]"
      aria-hidden={decorative || undefined}
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={item.image}
          alt={decorative ? "" : item.imageAlt}
          width={1280}
          height={720}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-[1.06]"
          sizes="340px"
        />
      </div>
      <div className="flex flex-1 flex-col px-6 pb-5 pt-6">
        <span className="self-start rounded-full border border-hairline px-3 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted">
          {item.domain}
        </span>
        <h3 className="font-display mb-2.5 mt-4 text-[1.1875rem] font-semibold leading-snug">
          {item.title}
        </h3>
        <p className="m-0 text-[0.9375rem] text-ink-muted">
          {item.organization} · {item.city}
          <br />
          {item.date}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3.5 [margin-block-start:18px]">
          <span className="text-sm text-ink-muted">
            {item.participants} {campaigns.participantsSuffix}
          </span>
          <Link
            href={campaigns.viewCampaignHref}
            className="text-sm text-org underline-offset-4 hover:underline"
            tabIndex={decorative ? -1 : undefined}
          >
            {campaigns.viewCampaign}
          </Link>
        </div>
      </div>
    </article>
  );
}
