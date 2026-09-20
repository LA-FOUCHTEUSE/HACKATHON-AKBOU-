"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { landingCopy } from "./copy";
import { Reveal } from "./Reveal";

const { method } = landingCopy;

export function MethodSection() {
  const [tab, setTab] = useState(0);
  const steps = tab === 0 ? method.volunteerSteps : method.organizationSteps;

  return (
    <section id="methode" className="px-[clamp(20px,5vw,56px)] py-[clamp(60px,8vw,104px)]">
      <Reveal className="mx-auto max-w-[1180px]">
        <h2 className="font-display m-0 mb-10 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
          {method.heading}
        </h2>

        <div className="relative mb-14 grid max-w-[460px] grid-cols-2 border-b border-hairline">
          {method.tabs.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setTab(index)}
              className="px-1 py-3 text-center text-[0.9375rem] font-medium transition-colors duration-250"
              style={{ color: tab === index ? "var(--ink)" : "var(--ink-muted)" }}
              aria-pressed={tab === index}
            >
              {label}
            </button>
          ))}
          <motion.div
            layoutId="tw-tab-underline"
            className="absolute -bottom-px h-px w-1/2 bg-ink"
            style={{ insetInlineStart: `${tab * 50}%` }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        <div className="grid gap-7 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          {steps.map((step) => (
            <div key={step.number} className="relative border-t border-hairline pt-7">
              <div className="font-display text-sm tracking-[0.08em] text-ink-muted">{step.number}</div>
              <h3 className="font-display mt-3 text-[1.3125rem] font-semibold tracking-[-0.01em]">
                {step.title}
              </h3>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
