"use client";

import { useEffect, useRef, useState } from "react";
import { landingCopy } from "./copy";
import { Reveal } from "./Reveal";

const { progression } = landingCopy;
const LAST_INDEX = progression.tiers.length - 1;
const FILL_PERCENT = (progression.activeTierIndex / LAST_INDEX) * 100;

export function ProgressionSection() {
  const railRef = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const node = railRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFilled(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -20% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="px-[clamp(20px,5vw,56px)] py-[clamp(60px,8vw,104px)]">
      <Reveal className="mx-auto max-w-[1180px]">
        <h2 className="font-display m-0 mb-14 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.02em]">
          {progression.heading}
        </h2>

        <div className="grid items-start gap-[clamp(32px,5vw,72px)] [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          <div>
            <div
              ref={railRef}
              data-rail=""
              data-filled={filled ? "" : undefined}
              className="relative my-11 mb-[52px] h-0.5 bg-hairline"
            >
              <div
                className="absolute inset-y-0 start-0 bg-ochre"
                style={{
                  ["--tier-fill" as string]: `${FILL_PERCENT}%`,
                  width: filled ? `${FILL_PERCENT}%` : "0%",
                  transition: "width 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
              {progression.tiers.map((tier, index) => {
                const position = (index / LAST_INDEX) * 100;
                const active = index === progression.activeTierIndex;
                const reached = index <= progression.activeTierIndex;
                return (
                  <div key={tier}>
                    <div
                      className="absolute top-1/2"
                      style={{ insetInlineStart: `${position}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <div
                        className="rounded-full"
                        style={{
                          width: active ? 14 : 10,
                          height: active ? 14 : 10,
                          background: reached ? "var(--ochre)" : "var(--hairline)",
                          boxShadow: active ? "0 0 18px rgba(192, 138, 46, 0.55)" : "none",
                        }}
                      />
                    </div>
                    <div
                      className="absolute top-6 whitespace-nowrap text-[0.8125rem]"
                      style={{
                        insetInlineStart: `${position}%`,
                        transform: "translateX(-50%)",
                        color: active ? "var(--ink)" : "var(--ink-muted)",
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {tier}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="m-0 max-w-[46ch] text-ink-muted">{progression.note}</p>
          </div>

          <div className="border border-hairline bg-canvas-raised px-7 pb-5 pt-7">
            <div className="mb-5 flex items-baseline justify-between">
              <h3 className="font-display m-0 text-lg font-semibold">{progression.leaderboardTitle}</h3>
              <span className="text-xs uppercase tracking-[0.08em] text-ink-muted">
                {progression.leaderboardPeriod}
              </span>
            </div>
            <div className="grid gap-0.5">
              {progression.leaderboard.map((row, index) => (
                <div
                  key={row.rank}
                  className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-t border-hairline py-3 last:border-b"
                >
                  <span
                    className="font-display font-semibold"
                    style={{ color: index < 3 ? "var(--ochre)" : "var(--ink-muted)" }}
                  >
                    {row.rank}
                  </span>
                  <span>{row.name}</span>
                  <span className="text-[0.9375rem] text-ink-muted">{row.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
