"use client";

import { useSyncExternalStore } from "react";
import { Image as ImageIcon } from "lucide-react";
import { landingCopy } from "./copy";
import { Reveal } from "./Reveal";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Server renders the wall; the first client pass corrects it if motion is reduced. */
function useReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

const { campaigns } = landingCopy;

type Campaign = (typeof campaigns.items)[number];

// Two columns, split 3/2. Each runs at its own constant speed: the difference
// between them is what reads as parallax depth, and the second column starts
// half a card lower so the wall never lines up into a grid.
const COLUMNS: { items: Campaign[]; duration: string; offset: string }[] = [
  { items: campaigns.items.slice(0, 3), duration: "44s", offset: "0px" },
  { items: campaigns.items.slice(3), duration: "62s", offset: "-120px" },
];

export function CampaignsSection() {
  const reduced = useReducedMotion();

  return (
    <section id="campagnes" className="px-[clamp(20px,5vw,56px)] py-[clamp(60px,8vw,104px)]">
      <Reveal className="mx-auto max-w-[1180px]">
        <h2 className="font-display m-0 mb-14 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
          {campaigns.heading}
        </h2>

        {/* Reduced motion, and every narrow viewport, get the plain grid. */}
        <div
          className={`grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] ${
            reduced ? "" : "lg:hidden"
          }`}
        >
          {campaigns.items.map((item) => (
            <CampaignCard key={item.title} item={item} />
          ))}
        </div>

        {reduced ? null : (
          <div
            className="relative hidden h-[680px] gap-5 overflow-hidden lg:grid lg:grid-cols-2"
            style={{
              maskImage:
                "linear-gradient(to bottom, transparent 0%, #000 9%, #000 91%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, #000 9%, #000 91%, transparent 100%)",
            }}
          >
            {COLUMNS.map((column, index) => (
              <div key={index} data-wall-column="" className="relative overflow-hidden">
                <div
                  data-wall-track=""
                  className="flex flex-col gap-5"
                  style={{
                    ["--wall-duration" as string]: column.duration,
                    ["--wall-gap" as string]: "20px",
                    marginBlockStart: column.offset,
                  }}
                >
                  {/* The list is rendered twice back-to-back so translateY(-50%)
                      lands on an identical card and the seam is invisible. The
                      second pass is decorative: hidden from assistive tech and
                      out of the tab order. */}
                  {[0, 1].flatMap((copy) =>
                    column.items.map((item) => (
                      <CampaignCard
                        key={`${item.title}-${copy}`}
                        item={item}
                        decorative={copy === 1}
                      />
                    )),
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}

function CampaignCard({ item, decorative = false }: { item: Campaign; decorative?: boolean }) {
  return (
    <article className="tw-glass flex flex-col overflow-hidden" aria-hidden={decorative || undefined}>
      <div className="flex aspect-video flex-col items-center justify-center gap-2.5 bg-motif/10">
        <ImageIcon className="size-[26px] text-motif" strokeWidth={1.3} />
        <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-motif">
          {campaigns.imagePlaceholder}
        </span>
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
          <a href="#campagnes" className="text-sm text-org" tabIndex={decorative ? -1 : undefined}>
            {campaigns.viewCampaign}
          </a>
        </div>
      </div>
    </article>
  );
}
