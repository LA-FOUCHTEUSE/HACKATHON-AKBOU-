"use client";

import Image from "next/image";
import type { HeroSide } from "./SplitHero";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const REST_OPACITY = 0.55;
const DIMMED_OPACITY = 0.15;

// Source compositions are 1595x361 flat silhouettes with baked-in brand colour.
const HAND_WIDTH = 1595;
const HAND_HEIGHT = 361;

type HandProps = {
  side: HeroSide;
  hovered: boolean;
  anyHovered: boolean;
};

function handStyle({ hovered, anyHovered }: Omit<HandProps, "side">, glow: string, tilt: number) {
  const active = hovered;
  const duration = active ? 420 : 300;
  return {
    opacity: active ? 1 : anyHovered ? DIMMED_OPACITY : REST_OPACITY,
    filter: active ? `drop-shadow(0 0 26px ${glow})` : "none",
    transform: `rotate(${active ? tilt : 0}deg)`,
    transition: [
      `opacity ${duration}ms ${EASE}`,
      `filter ${duration}ms ${EASE}`,
      `transform 560ms ${EASE}`,
    ].join(", "),
  } satisfies React.CSSProperties;
}

export function HandsIllustration({ side }: { side: HeroSide }) {
  const anyHovered = side !== null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 hidden overflow-hidden lg:block" aria-hidden="true">
      {/* Volunteer (red) enters from the far left, fingers reaching toward centre.
          The illustration is a fixed composition: it must not mirror under RTL,
          so it is placed with physical offsets while the text around it flips. */}
      <div
        className="absolute top-[54%] w-[min(54%,780px)] origin-[left_center]"
        style={{
          left: 0,
          ...handStyle({ hovered: side === "volunteer", anyHovered }, "rgba(180, 35, 44, 0.42)", -5),
        }}
      >
        <Image
          src="/hero/hand-volunteer.png"
          alt=""
          width={HAND_WIDTH}
          height={HAND_HEIGHT}
          priority
          className="block h-auto w-full"
        />
      </div>

      {/* Organization (green) enters from the far right, also direction-independent.
          It rests higher than the volunteer hand so the hover rotation — negative,
          because the pivot sits off-screen to the right — swings the hand down into
          the meeting point instead of just tilting in place. */}
      <div
        className="absolute top-[34%] w-[min(54%,780px)] origin-[right_center]"
        style={{
          right: 0,
          ...handStyle({ hovered: side === "organization", anyHovered }, "rgba(11, 107, 58, 0.42)", -11),
        }}
      >
        <Image
          src="/hero/hand-organization.png"
          alt=""
          width={HAND_WIDTH}
          height={HAND_HEIGHT}
          priority
          className="block h-auto w-full"
        />
      </div>
    </div>
  );
}

/** Narrow viewports get the finger clusters only: the trailing arm is cropped away. */
export function HandsIllustrationMobile() {
  return (
    <div className="pointer-events-none relative mx-auto h-24 w-full max-w-sm overflow-hidden lg:hidden" aria-hidden="true">
      <div className="absolute top-2 h-20 w-[62%] overflow-hidden" style={{ left: 0 }}>
        <Image
          src="/hero/hand-volunteer.png"
          alt=""
          width={HAND_WIDTH}
          height={HAND_HEIGHT}
          className="absolute top-0 h-full w-auto max-w-none"
          style={{ right: 0, opacity: REST_OPACITY }}
        />
      </div>
      <div className="absolute top-6 h-20 w-[62%] overflow-hidden" style={{ right: 0 }}>
        <Image
          src="/hero/hand-organization.png"
          alt=""
          width={HAND_WIDTH}
          height={HAND_HEIGHT}
          className="absolute top-0 h-full w-auto max-w-none"
          style={{ left: 0, opacity: REST_OPACITY }}
        />
      </div>
    </div>
  );
}
