import { Inter, Sora, Noto_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";

export const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-latin",
  display: "swap",
});

export const display = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const runiga = localFont({
  src: "./Runiga.otf",
  variable: "--font-runiga",
  display: "swap",
});

export const fontVariables = [body.variable, display.variable, arabic.variable, runiga.variable].join(" ");
