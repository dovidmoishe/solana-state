"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["Overview", "/"],
  ["Network", "/network"],
  ["Validators", "/validators"],
  ["Economics", "/economics"],
  ["Activity", "/activity"],
] as const;

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Primary navigation">
      {items.map(([label, href]) => {
        const active = href === "/" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} className="nav-link" data-active={active}>{label}</Link>;
      })}
    </nav>
  );
}
