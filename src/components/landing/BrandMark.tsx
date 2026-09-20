/**
 * Two figures leaning into each other: the volunteer and the organization.
 * Drawn inline so the mark scales with the wordmark's cap height.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="11" cy="9.5" r="3.6" fill="var(--volunteer)" />
      <path
        d="M4.4 25.5c0-4.2 2.9-7.1 6.6-7.1s6.6 2.9 6.6 7.1Z"
        fill="var(--volunteer)"
      />
      <circle cx="21" cy="9.5" r="3.6" fill="var(--org)" />
      <path
        d="M14.4 25.5c0-4.2 2.9-7.1 6.6-7.1s6.6 2.9 6.6 7.1Z"
        fill="var(--org)"
        fillOpacity="0.92"
      />
    </svg>
  );
}
