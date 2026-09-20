import { User, Share2, Building2 } from "lucide-react";
import { landingCopy } from "./copy";
import { Reveal } from "./Reveal";

const ICONS = [User, Share2, Building2];
const { problem } = landingCopy;

export function ProblemSection() {
  return (
    <section className="px-[clamp(20px,5vw,56px)] py-[clamp(76px,10vw,128px)]">
      <Reveal className="mx-auto max-w-[1180px]">
        <h2 className="font-display m-0 mb-14 max-w-[18ch] text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
          {problem.heading}
        </h2>
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(248px,1fr))]">
          {problem.cards.map((card, i) => {
            const Icon = ICONS[i];
            return (
              <div key={card.title} className="border border-hairline bg-canvas-raised px-7 pb-8 pt-7">
                <Icon className="size-6 text-ink" strokeWidth={1.4} />
                <h3 className="font-display mb-2.5 mt-5 text-lg font-semibold">{card.title}</h3>
                <p className="m-0 text-base text-ink-muted">{card.body}</p>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
