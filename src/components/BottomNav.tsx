"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { t } from "@/lib/strings";

const ITEMS = [
  {
    href: "/",
    label: t.nav.wheel,
    icon: "M10 2.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 5.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0-3.2v3.2m0 4v3.2m-5.66-5.2h3.2m4.92 0h3.2",
  },
  { href: "/meals", label: t.nav.meals, icon: "M4 4.5h12M4 10h12M4 15.5h12" },
  {
    href: "/history",
    label: t.nav.history,
    icon: "M10 5.5v5l3 1.8M10 3a7 7 0 1 0 7 7",
  },
  {
    href: "/settings",
    label: t.nav.settings,
    icon: "M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm7-2.5-1.6-.6a5.6 5.6 0 0 0-.5-1.2l.7-1.6-1.2-1.2-1.6.7a5.6 5.6 0 0 0-1.2-.5L10.9 3H9.1l-.6 1.6a5.6 5.6 0 0 0-1.2.5l-1.6-.7L4.5 5.6l.7 1.6a5.6 5.6 0 0 0-.5 1.2L3 10v1.8l1.6.6c.13.42.3.82.5 1.2l-.7 1.6 1.2 1.2 1.6-.7c.38.2.78.37 1.2.5l.6 1.6h1.8l.6-1.6c.42-.13.82-.3 1.2-.5l1.6.7 1.2-1.2-.7-1.6c.2-.38.37-.78.5-1.2l1.6-.6V10Z",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border-soft bg-bg-elevated/95 backdrop-blur-lg">
      <div className="wf-safe-bottom mx-auto flex max-w-lg items-stretch justify-around px-2 pt-1.5">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-16 flex-col items-center gap-1 rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-semibold transition-colors",
                active ? "text-primary" : "text-ink-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-12 place-items-center rounded-full transition-colors",
                  active && "bg-primary-soft",
                )}
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
