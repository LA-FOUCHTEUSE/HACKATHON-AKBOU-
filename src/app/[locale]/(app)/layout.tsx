import { SiteHeader } from "@/components/layout/SiteHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
