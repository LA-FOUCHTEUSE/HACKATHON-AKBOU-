"use client";

import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { landingCopy } from "./copy";
import { BrandMark } from "./BrandMark";

const { nav } = landingCopy;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState<string>(nav.languages[0].label);

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
        <a href="#top" className="flex items-center gap-2.5">
          <BrandMark className="size-[26px]" />
          <span className="font-wordmark text-[1.375rem] leading-none tracking-[0.14em] text-ink">
            {nav.wordmark}
          </span>
        </a>

        <div className="hidden items-center gap-[clamp(20px,3vw,40px)] lg:flex">
          {nav.links.map((link) => (
            <a key={link.href} href={link.href} className="text-[0.9375rem] text-ink hover:text-org">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              className="flex items-center gap-1.5 px-1 py-1.5 text-sm text-ink-muted"
              aria-expanded={langOpen}
            >
              <span>{lang}</span>
              <ChevronDown className="size-3" />
            </button>
            {langOpen ? (
              <div className="absolute start-0 top-9 z-95 min-w-[86px] border border-hairline bg-canvas-raised py-1">
                {nav.languages.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLang(item.label);
                      setLangOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-start text-sm hover:text-org"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <a
            href="#top"
            className="hidden shrink-0 whitespace-nowrap rounded-full border border-ink px-5 py-2.5 text-sm font-medium lg:inline-block"
          >
            {nav.signIn}
          </a>

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
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-3xl font-semibold"
            >
              {link.label}
            </a>
          ))}
          <a href="#top" onClick={() => setMenuOpen(false)} className="font-display text-3xl font-semibold">
            {nav.signIn}
          </a>
          <div className="mt-3 flex gap-4.5 text-[0.9375rem] text-ink-muted">
            {nav.languages.map((item) => (
              <button key={item.code} type="button" onClick={() => setLang(item.label)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
