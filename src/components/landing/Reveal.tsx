"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Single scroll entrance, reused by every section: rise 24px and fade in.
 * Under `prefers-reduced-motion` the observer is never wired up and the CSS
 * rule on `[data-reveal]` leaves the content in its final state.
 */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal="" data-shown={shown ? "" : undefined} className={className}>
      {children}
    </div>
  );
}
