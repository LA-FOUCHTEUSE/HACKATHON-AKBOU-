"use client";

import { useCallback, useState } from "react";
import { Link } from "@/i18n/navigation";
import { landingCopy } from "./copy";
import { AlgeriaMap } from "./AlgeriaMap";
import { ContourField } from "./ContourField";
import { MotifBand } from "./MotifBand";
import { HandsIllustration, HandsIllustrationMobile } from "./HandsIllustration";

export type HeroSide = "volunteer" | "organization" | null;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DESKTOP_MIN_WIDTH = 1024;

/**
 * Brand tint for one half: solid at the outer edge, fading out past the middle so
 * the two halves never meet as a hard seam — they dissolve into the canvas.
 */
function tintStyle(active: boolean, fromLeft: boolean, rgb: string): React.CSSProperties {
  const direction = fromLeft ? "to right" : "to left";
  return {
    background: `linear-gradient(${direction},
      rgba(${rgb}, 0.95) 0%,
      rgba(${rgb}, 0.93) 32%,
      rgba(${rgb}, 0.78) 44%,
      rgba(${rgb}, 0.44) 54%,
      rgba(${rgb}, 0.16) 63%,
      rgba(${rgb}, 0.04) 70%,
      rgba(${rgb}, 0) 78%)`,
    opacity: active ? 1 : 0,
    transition: `opacity ${active ? 480 : 300}ms ${EASE}`,
  };
}

/** White wash that dims and recedes the non-hovered half. */
function washStyle(active: boolean, fromLeft: boolean): React.CSSProperties {
  const direction = fromLeft ? "to right" : "to left";
  return {
    background: `linear-gradient(${direction},
      rgba(255, 255, 255, 0.46) 0%,
      rgba(255, 255, 255, 0.40) 28%,
      rgba(255, 255, 255, 0.18) 44%,
      rgba(255, 255, 255, 0) 58%)`,
    opacity: active ? 1 : 0,
    transition: `opacity ${active ? 480 : 300}ms ${EASE}`,
  };
}

/**
 * The white hero copy is painted over the neutral copy and revealed with the same
 * soft gradient the tint uses, so wordmark and tagline change colour in step with
 * the half they sit on instead of flipping at a hard edge.
 */
function overlayStyle(active: boolean, fromLeft: boolean): React.CSSProperties {
  const direction = fromLeft ? "to right" : "to left";
  const mask = `linear-gradient(${direction}, #000 0%, #000 38%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 62%)`;
  return {
    maskImage: mask,
    WebkitMaskImage: mask,
    opacity: active ? 1 : 0,
    transition: `opacity ${active ? 420 : 280}ms ${EASE}`,
  };
}

function riseStyle(active: boolean, delay: number): React.CSSProperties {
  return {
    opacity: active ? 1 : 0,
    transform: active ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 320ms ease ${delay}ms, transform 320ms ${EASE} ${delay}ms`,
    pointerEvents: active ? "auto" : "none",
  };
}

const { hero } = landingCopy;

export function SplitHero() {
  const [side, setSide] = useState<HeroSide>(null);

  const handleMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (window.innerWidth < DESKTOP_MIN_WIDTH) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const next = event.clientX - rect.left < rect.width / 2 ? "volunteer" : "organization";
    setSide((current) => (current === next ? current : next));
  }, []);

  const handleLeave = useCallback(() => setSide(null), []);

  const onVolunteer = side === "volunteer";
  const onOrganization = side === "organization";

  return (
    <section
      id="top"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative flex min-h-[max(740px,100svh)] flex-col overflow-hidden"
    >
      <AlgeriaMap />
      <ContourField />
      <MotifBand />

      <div
        className="pointer-events-none absolute inset-0 z-40"
        style={tintStyle(onVolunteer, true, "180, 35, 44")}
      />
      <div
        className="pointer-events-none absolute inset-0 z-40"
        style={tintStyle(onOrganization, false, "11, 107, 58")}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[45]"
        style={washStyle(onOrganization, true)}
      />
      <div
        className="pointer-events-none absolute inset-0 z-[45]"
        style={washStyle(onVolunteer, false)}
      />

      <HandsIllustration side={side} />

      {/* Desktop split hero */}
      <div className="absolute inset-0 hidden lg:block">
        <div className="pointer-events-none absolute inset-0 z-60">
          <HeroCopy />
          <div className="absolute inset-0" style={overlayStyle(onVolunteer, true)}>
            <HeroCopy inverted />
          </div>
          <div className="absolute inset-0" style={overlayStyle(onOrganization, false)}>
            <HeroCopy inverted />
          </div>

          <div className="absolute bottom-[13%]" style={{ left: "clamp(24px, 6vw, 84px)" }}>
            <SideLabel active={onVolunteer} brand="var(--volunteer)" label={hero.volunteer.label} />
          </div>
          <div
            className="absolute bottom-[13%]"
            style={{ right: "clamp(24px, 6vw, 84px)", textAlign: "right" }}
          >
            <SideLabel
              active={onOrganization}
              brand="var(--org)"
              label={hero.organization.label}
              alignEnd
            />
          </div>

          <HoverPanel
            active={onVolunteer}
            centerPercent={25}
            headline={hero.volunteer.headline}
            cta={hero.volunteer.cta}
            href={hero.volunteer.href}
          />
          <HoverPanel
            active={onOrganization}
            centerPercent={75}
            headline={hero.organization.headline}
            cta={hero.organization.cta}
            href={hero.organization.href}
          />

          <HeroBottom />
          <div className="absolute inset-0" style={overlayStyle(onVolunteer, true)}>
            <HeroBottom inverted />
          </div>
          <div className="absolute inset-0" style={overlayStyle(onOrganization, false)}>
            <HeroBottom inverted />
          </div>
        </div>
      </div>

      {/* Mobile / tablet: two permanently legible stacked panels */}
      <div className="relative z-60 flex flex-1 flex-col justify-center gap-8 pt-52 pb-14 lg:hidden">
        <div className="px-5 text-center">
          <h1 className="font-wordmark m-0 text-[clamp(3.5rem,16vw,5rem)] leading-none tracking-[0.04em] text-ink">
            {hero.wordmark}
          </h1>
          <p className="mx-auto mt-4 max-w-[42ch] text-base leading-relaxed text-ink-muted">
            {hero.tagline}
          </p>
        </div>

        <HandsIllustrationMobile />

        <div className="flex flex-col gap-3.5 px-5">
          <MobilePanel
            label={hero.volunteer.label}
            headline={hero.volunteer.headline}
            cta={hero.volunteer.cta}
            href={hero.volunteer.href}
            tint="bg-volunteer/10"
            border="border-s-volunteer"
            text="text-volunteer"
            button="bg-volunteer"
          />
          <MobilePanel
            label={hero.organization.label}
            headline={hero.organization.headline}
            cta={hero.organization.cta}
            href={hero.organization.href}
            tint="bg-org/10"
            border="border-s-org"
            text="text-org"
            button="bg-org"
          />
        </div>

        <div className="px-5 text-center">
          <Link
            href={hero.thirdPathHref}
            className="border-b border-transparent text-sm text-ink-muted transition-colors hover:border-ink-muted"
          >
            {hero.thirdPath}
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroCopy({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="absolute inset-x-0 top-[31%] -translate-y-1/2 text-center">
      <h1
        className="font-wordmark m-0 text-[clamp(3.5rem,9vw,8rem)] leading-none tracking-[0.04em]"
        style={{ color: inverted ? "#ffffff" : "var(--ink)" }}
      >
        {hero.wordmark}
      </h1>
      <p
        className="mx-auto mt-1 max-w-[42ch] text-[1.0625rem] leading-relaxed"
        style={{ color: inverted ? "rgba(255,255,255,0.92)" : "var(--ink-muted)" }}
      >
        {hero.tagline}
      </p>
    </div>
  );
}

function SideLabel({
  active,
  brand,
  label,
  alignEnd = false,
}: {
  active: boolean;
  brand: string;
  label: string;
  alignEnd?: boolean;
}) {
  return (
    <>
      <div
        className="mb-3.5 h-px"
        style={{
          marginLeft: alignEnd ? "auto" : undefined,
          width: active ? 64 : 28,
          background: active ? "#ffffff" : brand,
          transition: `width 420ms ${EASE}, background 420ms ${EASE}`,
        }}
      />
      <div
        className="text-[0.8125rem] font-medium uppercase tracking-[0.16em]"
        style={{ color: active ? "#ffffff" : brand, transition: `color 420ms ${EASE}` }}
      >
        {label}
      </div>
    </>
  );
}

function HoverPanel({
  active,
  centerPercent,
  headline,
  cta,
  href,
}: {
  active: boolean;
  centerPercent: number;
  headline: string;
  cta: string;
  href: string;
}) {
  return (
    <div
      className="absolute top-1/2 w-[min(360px,24vw)] text-center"
      style={{ left: `${centerPercent}%`, transform: "translateX(-50%)" }}
    >
      <h2
        className="font-display m-0 mb-6 text-[clamp(1.25rem,1.9vw,1.75rem)] font-semibold leading-tight tracking-[-0.01em] text-white"
        style={riseStyle(active, 0)}
      >
        {headline}
      </h2>
      <div style={riseStyle(active, 60)}>
        <Link
          href={href}
          className="pointer-events-auto inline-block rounded-full bg-white px-7 py-3.5 text-[0.9375rem] font-medium text-ink transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[0_0_32px_rgba(255,255,255,0.25)]"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function HeroBottom({ inverted = false }: { inverted?: boolean }) {
  const color = inverted ? "rgba(255,255,255,0.94)" : "var(--ink-muted)";
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 pb-6">
      <Link
        href={hero.thirdPathHref}
        className="pointer-events-auto border-b border-transparent text-sm transition-colors hover:border-current"
        style={{ color }}
      >
        {hero.thirdPath}
      </Link>
      <div className="flex flex-col items-center gap-2.5">
        <div
          className="relative h-8 w-px overflow-hidden"
          style={{ background: inverted ? "rgba(255,255,255,0.55)" : "var(--hairline)" }}
        >
          <div
            data-cue=""
            className="absolute inset-x-0 h-2.5"
            style={{
              background: inverted ? "#ffffff" : "var(--ink-muted)",
              animation: "tw-cue 2s ease-in-out infinite",
            }}
          />
        </div>
        <span className="text-[0.6875rem] uppercase tracking-[0.16em]" style={{ color }}>
          {hero.scrollCue}
        </span>
      </div>
    </div>
  );
}

function MobilePanel({
  label,
  headline,
  cta,
  href,
  tint,
  border,
  text,
  button,
}: {
  label: string;
  headline: string;
  cta: string;
  href: string;
  tint: string;
  border: string;
  text: string;
  button: string;
}) {
  return (
    <div className={`rounded-2xl border-s-4 ${border} ${tint} px-6 py-6`}>
      <div className={`text-xs uppercase tracking-[0.16em] ${text}`}>{label}</div>
      <h2 className="font-display my-2.5 mb-4 text-2xl font-semibold leading-snug tracking-[-0.01em]">
        {headline}
      </h2>
      <Link
        href={href}
        className={`inline-block rounded-full ${button} px-6 py-3 text-[0.9375rem] font-medium text-white transition-transform duration-200 hover:-translate-y-px`}
      >
        {cta}
      </Link>
    </div>
  );
}
