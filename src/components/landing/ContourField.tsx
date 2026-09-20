const CONTOUR_COUNT = 12;

function contourPath(index: number): string {
  const base = 40 + index * 64;
  const amplitude = 12 + ((index * 11) % 22);
  const phase = index * 0.83;
  let d = `M0,${(base + Math.sin(phase) * amplitude).toFixed(1)}`;
  for (let x = 25; x <= 2000; x += 25) {
    const y =
      base +
      Math.sin((x / 500) * Math.PI * 2 + phase) * amplitude +
      Math.sin((x / 250) * Math.PI * 2 + phase * 1.7) * amplitude * 0.34;
    d += ` L${x},${y.toFixed(1)}`;
  }
  return d;
}

const CONTOURS = Array.from({ length: CONTOUR_COUNT }, (_, i) => ({
  d: contourPath(i),
  duration: `${(40 + i * 2.6).toFixed(1)}s`,
}));

export function ContourField() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <svg viewBox="0 0 2000 800" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
        {CONTOURS.map((contour, i) => (
          <path
            key={i}
            data-contour=""
            d={contour.d}
            fill="none"
            stroke="var(--motif)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            style={{
              opacity: 0.06,
              animation: `tw-drift ${contour.duration} linear infinite`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
