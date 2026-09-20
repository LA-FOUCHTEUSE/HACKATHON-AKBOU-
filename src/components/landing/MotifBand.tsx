const BAND_HEIGHT = 140;
const CELL_WIDTH = 120;
const MOTIF_COUNT = 12;

const MOTIFS: string[][] = [
  ["M6 34L24 16L42 34", "M6 24L24 6L42 24"],
  ["M24 6L42 24L24 42L6 24Z", "M24 16L32 24L24 32L16 24Z"],
  ["M4 32L12 18L20 32L28 18L36 32L44 18"],
  ["M9 9L39 39", "M39 9L9 39", "M6 14L14 6", "M34 6L42 14", "M6 34L14 42", "M34 42L42 34"],
  ["M6 38H42", "M10 38V18", "M18 38V12", "M26 38V18", "M34 38V12", "M42 38V22"],
  ["M6 40H16V30H26V20H36V10", "M6 40L36 10"],
  ["M7 7H41V41H7Z", "M14 14H34V34H14Z", "M21 21H27V27H21Z"],
  ["M24 8A16 16 0 1 1 24 40A16 16 0 1 1 24 8Z", "M24 18A6 6 0 1 1 24 30A6 6 0 1 1 24 18Z", "M24 2V8", "M24 40V46", "M2 24H8", "M40 24H46"],
  ["M10 8H38L24 24Z", "M10 40H38L24 24Z"],
  ["M24 4V44", "M24 14L14 6", "M24 14L34 6", "M24 26L14 18", "M24 26L34 18", "M24 38L14 30", "M24 38L34 30"],
  ["M8 24L14 18L20 24L14 30Z", "M24 24L30 18L36 24L30 30Z", "M2 24H8", "M20 24H24", "M36 24H46"],
  ["M6 12H42", "M6 36H42", "M14 12L24 24L14 36", "M34 12L24 24L34 36"],
];

const WAVE_AMPLITUDE = 17;
const WAVE_LENGTH = 720;
const WAVE_WIDTH = 5760;
const WAVE_OFFSET = -29;

/** Same sinusoid the drifting wave line traces, so the motifs ride along it. */
function waveY(x: number, offset: number): number {
  return BAND_HEIGHT / 2 + offset + WAVE_AMPLITUDE * Math.sin((x / WAVE_LENGTH) * 2 * Math.PI);
}

function wavePath(offset: number): string {
  let d = "";
  for (let x = 0; x <= WAVE_WIDTH; x += 24) {
    const y = waveY(x, offset);
    d += `${x ? " L" : "M"}${x},${y.toFixed(1)}`;
  }
  return d;
}

// Only the upper line is drawn: a lower one would trail past the band and read as
// a stray rule crossing the Algeria map beneath it.
const WAVES = [{ d: wavePath(WAVE_OFFSET), duration: "33s", delay: "0s" }];

// Three copies of the row: the marquee shifts by exactly one row width, so the
// seam always lands on an identical cell. Each motif sits on the wave's curve
// offset downward, so the row rides *inside* the band rather than along its edge.
const MOTIF_DROP = 30;
const CELLS = Array.from({ length: MOTIF_COUNT * 3 }, (_, i) => {
  const x = i * CELL_WIDTH + CELL_WIDTH / 2;
  return { index: i, y: waveY(x, WAVE_OFFSET) + MOTIF_DROP };
});

export function MotifBand() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-10 z-5 overflow-hidden"
      style={{
        height: BAND_HEIGHT,
        maskImage:
          "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, #000 14%, #000 86%, transparent 100%)",
      }}
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          {MOTIFS.map((paths, i) => (
            <g
              key={i}
              id={`tw-motif-${i}`}
              fill="none"
              stroke="var(--motif)"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {paths.map((d, j) => (
                <path key={j} d={d} />
              ))}
            </g>
          ))}
        </defs>
      </svg>

      <svg
        data-wavedrift=""
        width={WAVE_WIDTH}
        height={BAND_HEIGHT}
        viewBox={`0 0 ${WAVE_WIDTH} ${BAND_HEIGHT}`}
        fill="none"
        className="absolute top-0 start-0 overflow-visible"
        style={{ animation: "tw-wavedrift 30s linear infinite" }}
        aria-hidden="true"
      >
        {WAVES.map((wave, i) => (
          <path
            key={i}
            data-contour=""
            d={wave.d}
            fill="none"
            stroke="var(--motif)"
            strokeWidth="1.25"
            style={{
              opacity: 0.45,
              animation: `tw-swell ${wave.duration} ease-in-out infinite`,
              animationDelay: wave.delay,
            }}
          />
        ))}
      </svg>

      <div
        data-marquee=""
        className="absolute start-0 flex w-max opacity-30"
        style={{ top: 0, animation: "tw-marquee 60s linear infinite" }}
        aria-hidden="true"
      >
        {CELLS.map((cell) => {
          const motif = cell.index % MOTIF_COUNT;
          const phase = (motif + 1) / MOTIF_COUNT;
          return (
            <div
              key={cell.index}
              data-bob=""
              className="relative flex flex-none items-center justify-center"
              style={{
                width: CELL_WIDTH,
                height: BAND_HEIGHT,
                animation: "tw-bob 30s ease-in-out infinite",
                animationDelay: `${(-30 * (1 - phase)).toFixed(2)}s`,
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 48 48"
                className="absolute"
                style={{ top: cell.y - 20 }}
              >
                <use href={`#tw-motif-${motif}`} />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}
