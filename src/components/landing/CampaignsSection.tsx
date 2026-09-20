import { Image as ImageIcon } from "lucide-react";
import { landingCopy } from "./copy";
import { Reveal } from "./Reveal";

const { campaigns } = landingCopy;

export function CampaignsSection() {
  return (
    <section id="campagnes" className="px-[clamp(20px,5vw,56px)] py-[clamp(60px,8vw,104px)]">
      <Reveal className="mx-auto max-w-[1180px]">
        <h2 className="font-display m-0 mb-14 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
          {campaigns.heading}
        </h2>
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          {campaigns.items.map((item) => (
            <article
              key={item.title}
              className="flex flex-col border border-hairline bg-canvas-raised"
            >
              <div className="flex aspect-video flex-col items-center justify-center gap-2.5 bg-motif/10">
                <ImageIcon className="size-[26px] text-motif" strokeWidth={1.3} />
                <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-motif">
                  {campaigns.imagePlaceholder}
                </span>
              </div>
              <div className="flex flex-1 flex-col px-6 pb-5 pt-6">
                <span className="self-start border border-hairline px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.12em] text-ink-muted">
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
                  <a href="#campagnes" className="text-sm text-org">
                    {campaigns.viewCampaign}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
