"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { type AppLocale } from "@/i18n/routing";
import { landingCopy } from "./copy";
import { BrandMark } from "./BrandMark";
import { SmartLink } from "./SmartLink";

const { nav } = landingCopy;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();
  const activeLabel =
    nav.languages.find((item) => item.code === locale)?.label ?? nav.languages[0].label;

  // Switching language re-renders the current page under the new locale prefix.
  const switchLocale = (next: AppLocale) => {
    setLangOpen(false);
    setMenuOpen(false);
    startTransition(() => router.replace(pathname, { locale: next }));
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className="fixed inset-x-0 top-0 z-90 flex h-[78px] items-center justify-between px-[clamp(20px,5vw,56px)] transition-[background-color,border-color] duration-250"
        style={{
          backgroundColor: scrolled ? "rgba(247, 245, 241, 0.72)" : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
          borderBottom: `1px solid ${scrolled ? "var(--hairline)" : "transparent"}`,
        }}
      >
        <a href="#top" className="group/brand flex items-center gap-2.5">
          <BrandMark className="size-[26px] transition-transform duration-300 group-hover/brand:scale-110" />
          <span className="font-wordmark text-[1.375rem] leading-none tracking-[0.14em] text-ink">
            {nav.wordmark}
          </span>
        </a>

        <div className="hidden items-center gap-[clamp(20px,3vw,40px)] lg:flex">
          {nav.links.map((link) => (
            <SmartLink
              key={link.href}
              href={link.href}
              className="group/nav relative text-[0.9375rem] text-ink transition-colors hover:text-org"
            >
              {link.label}
              <span className="absolute -bottom-1 inset-x-0 h-px origin-center scale-x-0 bg-org transition-transform duration-300 group-hover/nav:scale-x-100" />
            </SmartLink>
          ))}
        </div>

        <div className="flex items-center gap-3.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              className="flex items-center gap-1.5 px-1 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
              aria-expanded={langOpen}
              aria-haspopup="menu"
            >
              <span>{activeLabel}</span>
              <ChevronDown
                className={`size-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`}
              />
            </button>
            {langOpen ? (
              <div
                role="menu"
                className="tw-glass absolute start-0 top-9 z-95 min-w-[86px] overflow-hidden py-1"
              >
                {nav.languages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    role="menuitem"
                    onClick={() => switchLocale(item.code as AppLocale)}
                    aria-current={item.code === locale || undefined}
                    className={`block w-full px-4 py-2 text-start text-sm transition-colors hover:text-org ${
                      item.code === locale ? "text-org" : ""
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            href={nav.signInHref}
            className="hidden shrink-0 whitespace-nowrap rounded-full border border-ink px-5 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-ink hover:text-canvas lg:inline-block"
          >
            {nav.signIn}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex items-center p-1.5 lg:hidden"
            aria-label={nav.menu}
          >
            <Menu className="size-[22px]" strokeWidth={1.6} />
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-100 flex flex-col justify-center gap-4.5 bg-canvas px-[clamp(24px,7vw,56px)]">
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="absolute end-6 top-6 p-2"
            aria-label={nav.close}
          >
            <X className="size-6" strokeWidth={1.6} />
          </button>
          {nav.links.map((link) => (
            <SmartLink
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-3xl font-semibold transition-colors hover:text-org"
            >
              {link.label}
            </SmartLink>
          ))}
          <Link
            href={nav.signInHref}
            onClick={() => setMenuOpen(false)}
            className="font-display text-3xl font-semibold transition-colors hover:text-org"
          >
            {nav.signIn}
          </Link>
          <div className="mt-3 flex gap-4.5 text-[0.9375rem] text-ink-muted">
            {nav.languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => switchLocale(item.code as AppLocale)}
                aria-current={item.code === locale || undefined}
                className={`transition-colors hover:text-org ${item.code === locale ? "text-org" : ""}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
