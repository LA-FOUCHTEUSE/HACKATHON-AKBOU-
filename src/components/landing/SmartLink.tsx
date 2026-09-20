import { Link } from "@/i18n/navigation";

/**
 * The landing mixes in-page anchors with real routes. Anchors stay plain <a> so
 * the browser scrolls; routes go through Link so they keep the locale prefix.
 */
export function SmartLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
