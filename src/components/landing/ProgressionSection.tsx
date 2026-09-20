"use client";

import { useEffect, useRef, useState } from "react";
import { landingCopy } from "./copy";
import { Reveal } from "./Reveal";

const { progression } = landingCopy;
const LAST_INDEX = progression.tiers.length - 1;
const ACTIVE = progression.activeTierIndex;

// The fill stops a little past the active node so the rail reads as "in progress"
// within the tier rather than exactly on its threshold.
const FILL_PERCENT = ((ACTIVE + 0.45) / LAST_INDEX) * 100;

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

        <div className="grid items-stretch gap-[clamp(32px,5vw,72px)] [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
          <div className="tw-glass flex flex-col px-7 pb-8 pt-7">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                  {progression.currentPointsLabel}
                </div>
                <div className="font-display mt-1 text-[2rem] leading-none tracking-[-0.02em] text-ochre">
                  {progression.currentPoints}
                  <span className="ms-1.5 font-sans text-sm text-ink-muted">
                    {progression.pointsLabel}
                  </span>
                </div>
              </div>
              <div className="text-end">
                <div className="text-xs uppercase tracking-[0.14em] text-ink-muted">
                  {progression.nextTierLabel}
                </div>
                <div className="mt-1 text-[0.9375rem] text-ink">{progression.nextTierGap}</div>
              </div>
            </div>

            <div
              ref={railRef}
              data-rail=""
              className="relative mx-[8%] mb-16 h-1.5 rounded-full bg-hairline"
            >
              <div
                className="absolute inset-y-0 start-0 rounded-full bg-ochre"
                style={{
                  ["--tier-fill" as string]: `${FILL_PERCENT}%`,
                  width: filled ? `${FILL_PERCENT}%` : "0%",
                  transition: "width 1100ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />

              {progression.tiers.map((tier, index) => {
                const position = (index / LAST_INDEX) * 100;
                const active = index === ACTIVE;
                const reached = index <= ACTIVE;
                return (
                  <div
                    key={tier.name}
                    className="absolute top-1/2"
                    style={{ insetInlineStart: `${position}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <div
                      className="rounded-full transition-[box-shadow] duration-500"
                      style={{
                        width: active ? 18 : 12,
                        height: active ? 18 : 12,
                        background: reached ? "var(--ochre)" : "var(--canvas)",
                        border: `2px solid ${reached ? "var(--ochre)" : "var(--hairline)"}`,
                        boxShadow: active
                          ? "0 0 0 5px color-mix(in srgb, var(--ochre) 22%, transparent), 0 0 20px rgba(192, 138, 46, 0.5)"
                          : "none",
                      }}
                    />
                    <div
                      className="absolute top-7 whitespace-nowrap text-center"
                      style={{ insetInlineStart: "50%", transform: "translateX(-50%)" }}
                    >
                      <div
                        className="text-[0.8125rem]"
                        style={{
                          color: active ? "var(--ink)" : "var(--ink-muted)",
                          fontWeight: active ? 600 : 400,
                        }}
                      >
                        {tier.name}
                      </div>
                      <div className="mt-0.5 text-[0.6875rem] tabular-nums text-ink-muted/80">
                        {tier.threshold}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="m-0 mt-auto max-w-[46ch] text-[0.9375rem] text-ink-muted">{progression.note}</p>
          </div>

          <div className="tw-glass px-7 pb-5 pt-7">
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
                    className="font-display font-semibold tabular-nums"
                    style={{ color: index < 3 ? "var(--ochre)" : "var(--ink-muted)" }}
                  >
                    {row.rank}
                  </span>
                  <span>{row.name}</span>
                  <span className="text-[0.9375rem] tabular-nums text-ink-muted">{row.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
