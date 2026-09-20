import { landingCopy } from "./copy";
import { SmartLink } from "./SmartLink";
import { BrandMark } from "./BrandMark";

const { footer, nav } = landingCopy;

const FOOTER_MOTIFS = [
  ["M6 34L24 16L42 34", "M6 24L24 6L42 24"],
  ["M24 6L42 24L24 42L6 24Z", "M24 16L32 24L24 32L16 24Z"],
  ["M4 32L12 18L20 32L28 18L36 32L44 18"],
  ["M9 9L39 39", "M39 9L9 39", "M6 14L14 6", "M34 6L42 14", "M6 34L14 42", "M34 42L42 34"],
  ["M7 7H41V41H7Z", "M14 14H34V34H14Z", "M21 21H27V27H21Z"],
  ["M10 8H38L24 24Z", "M10 40H38L24 24Z"],
];

export function LandingFooter() {
  return (
    <footer className="border-t border-hairline px-[clamp(20px,5vw,56px)] pb-7 pt-[clamp(56px,7vw,88px)]">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-[22px]" />
              <span className="font-wordmark text-[1.25rem] leading-none tracking-[0.14em]">
                {nav.wordmark}
              </span>
            </div>
            <p className="m-0 mt-3.5 max-w-[30ch] text-[0.9375rem] text-ink-muted">
              {footer.description}
            </p>
          </div>

          {footer.columns.map((column) => (
            <div key={column.title} className="flex flex-col gap-2.5">
              <div className="text-xs uppercase tracking-[0.14em] text-ink-muted">{column.title}</div>
              {column.links.map((link) => (
                <SmartLink key={link.label} href={link.href} className="text-[0.9375rem] transition-colors hover:text-org">
                  {link.label}
                </SmartLink>
              ))}
            </div>
          ))}

          <div className="flex flex-col gap-2.5">
            <div className="text-xs uppercase tracking-[0.14em] text-ink-muted">
              {footer.contactTitle}
            </div>
            <a href={`mailto:${footer.contact.email}`} className="text-[0.9375rem] hover:text-org">
              {footer.contact.email}
            </a>
            <span className="text-[0.9375rem] text-ink-muted">{footer.contact.city}</span>
            {footer.contact.social.map((link) => (
              <SmartLink key={link.label} href={link.href} className="text-[0.9375rem] transition-colors hover:text-org">
                {link.label}
              </SmartLink>
            ))}
          </div>
        </div>

        <div className="mt-14 flex justify-center gap-10 overflow-hidden opacity-[0.18]" aria-hidden="true">
          {FOOTER_MOTIFS.map((paths, i) => (
            <svg
              key={i}
              width="34"
              height="34"
              viewBox="0 0 48 48"
              fill="none"
              stroke="var(--motif)"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {paths.map((d, j) => (
                <path key={j} d={d} />
              ))}
            </svg>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-5 text-sm text-ink-muted">
          <span>{footer.copyright}</span>
          <div className="flex gap-4.5">
            {nav.languages.map((item) => (
              <span key={item.code}>{item.label}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
