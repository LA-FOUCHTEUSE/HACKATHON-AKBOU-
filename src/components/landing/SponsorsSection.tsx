import { Check } from "lucide-react";
import { landingCopy } from "./copy";
import { Reveal } from "./Reveal";

const { sponsors } = landingCopy;

export function SponsorsSection() {
  return (
    <section id="entreprises" className="px-[clamp(20px,5vw,56px)] py-[clamp(60px,8vw,104px)]">
      <Reveal className="mx-auto max-w-[1180px]">
        <h2 className="font-display m-0 mb-14 max-w-[22ch] text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
          {sponsors.heading}
        </h2>
        <div className="grid items-stretch gap-5 [grid-template-columns:repeat(auto-fit,minmax(272px,1fr))]">
          {sponsors.packs.map((pack) => (
            <div
              key={pack.name}
              className={`tw-glass flex flex-col gap-5 px-7 pb-8 pt-7 ${
                pack.featured ? "tw-glass-org" : ""
              }`}
            >
              <div>
                {/* Fixed row height: the "most chosen" chip only exists on one card,
                    so reserving its height keeps every price on the same baseline. */}
                <div className="flex min-h-8 items-center gap-3">
                  <h3 className="font-display m-0 text-xl font-semibold">{pack.name}</h3>
                  {pack.featured ? (
                    <span className="rounded-full border border-org px-3 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-org">
                      {sponsors.mostChosen}
                    </span>
                  ) : null}
                </div>
                <div className="font-display mt-2.5 text-[1.75rem] tracking-[-0.02em]">
                  {pack.price}{" "}
                  <span className="font-sans text-[0.9375rem] text-ink-muted">
                    {sponsors.priceSuffix}
                  </span>
                </div>
              </div>

              <div className="grid gap-2.5">
                {pack.benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-2.5">
                    <Check
                      className={`mt-1.5 size-4 shrink-0 ${pack.featured ? "text-org" : "text-ink-muted"}`}
                      strokeWidth={2}
                    />
                    <span className="text-[0.9375rem]">{benefit}</span>
                  </div>
                ))}
              </div>

              <a
                href="#entreprises"
                className={`mt-auto rounded-full px-6 py-3 text-center text-[0.9375rem] font-medium transition-colors ${
                  pack.featured
                    ? "bg-org text-white hover:bg-org-deep"
                    : "border border-ink hover:bg-ink hover:text-canvas"
                }`}
              >
                {sponsors.cta}
              </a>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
