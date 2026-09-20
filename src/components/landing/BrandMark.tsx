import Image from "next/image";

/** The Tiwizi mark: two figures, volunteer and organization, leaning into each other. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.svg"
      alt=""
      width={64}
      height={40}
      className={className}
      aria-hidden="true"
      priority
    />
  );
}
