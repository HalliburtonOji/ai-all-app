"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/auth/actions";
import { SearchPaletteTrigger } from "@/components/SearchPalette";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Locale } from "@/lib/i18n/locales";

interface NavItem {
  href: string;
  label: string;
  /** Match if the current pathname starts with this prefix. */
  matchPrefix?: string;
}

interface NavLabels {
  dashboard: string;
  projects: string;
  learn: string;
  work: string;
  wins: string;
  earnings: string;
  clients: string;
  opportunities: string;
  failures: string;
  mates: string;
  keys: string;
  logout: string;
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.matchPrefix) {
    return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + "/");
  }
  return pathname === item.href;
}

export function NavBar({
  email,
  labels,
  locale,
}: {
  email: string;
  labels: NavLabels;
  locale: Locale;
}) {
  const pathname = usePathname() ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const PRIMARY_LINKS: NavItem[] = [
    { href: "/dashboard", label: labels.dashboard },
    { href: "/projects", label: labels.projects, matchPrefix: "/projects" },
    { href: "/learn", label: labels.learn, matchPrefix: "/learn" },
    { href: "/me/work", label: labels.work, matchPrefix: "/me/work" },
    { href: "/wins", label: labels.wins },
  ];

  const SECONDARY_LINKS: NavItem[] = [
    { href: "/me/earnings", label: labels.earnings },
    { href: "/me/clients", label: labels.clients, matchPrefix: "/me/clients" },
    { href: "/me/opportunities", label: labels.opportunities },
    { href: "/community/failures", label: labels.failures },
    { href: "/community/mates", label: labels.mates, matchPrefix: "/community/mates" },
    { href: "/me/settings", label: labels.keys, matchPrefix: "/me/settings" },
  ];

  // Close the mobile sheet on route change.
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Close the More dropdown on outside click.
  useEffect(() => {
    if (!moreOpen) return;
    function onDocClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [moreOpen]);

  return (
    <nav
      data-navbar="true"
      className="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[var(--surface)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/70"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        {/* Brand + primary links */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap text-base font-semibold tracking-tight text-[var(--brand-strong)] sm:text-base"
            aria-label="AI All App home"
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--brand)]"
            />
            <span className="text-[var(--foreground)]">AI All App</span>
          </Link>

          <ul className="hidden items-center gap-1 text-sm md:flex">
            {PRIMARY_LINKS.map((l) => (
              <NavLink key={l.href} item={l} active={isActive(pathname, l)} />
            ))}
          </ul>
        </div>

        {/* Right cluster: more dropdown + search + lang + email + logout */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* "More" dropdown holds the secondary links so the bar
              never overflows. md:visible. */}
          <div className="relative hidden md:block" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              data-navbar-more-toggle="true"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={
                "rounded-md px-3 py-1.5 text-sm transition-colors " +
                (SECONDARY_LINKS.some((l) => isActive(pathname, l))
                  ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-ink)]"
                  : "text-zinc-700 hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] dark:text-zinc-300 dark:hover:text-white")
              }
            >
              More
              <span aria-hidden className="ml-1 text-xs">▾</span>
            </button>
            {moreOpen && (
              <ul
                role="menu"
                data-navbar-more-menu="true"
                className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] py-1 shadow-lg"
              >
                {SECONDARY_LINKS.map((l) => (
                  <li key={l.href} role="none">
                    <Link
                      href={l.href}
                      role="menuitem"
                      onClick={() => setMoreOpen(false)}
                      className={
                        "block whitespace-nowrap px-3 py-2 text-sm transition-colors " +
                        (isActive(pathname, l)
                          ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-ink)]"
                          : "text-zinc-700 hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] dark:text-zinc-300 dark:hover:text-white")
                      }
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SearchPaletteTrigger />

          <LanguageSwitcher current={locale} />

          <span
            className="hidden max-w-[140px] shrink-0 truncate text-xs text-zinc-500 lg:inline"
            title={email}
          >
            {email}
          </span>

          <form action={logout} className="hidden sm:block">
            <button
              type="submit"
              className="whitespace-nowrap rounded-md border border-[var(--border-soft)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
            >
              {labels.logout}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            data-navbar-mobile-toggle="true"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="rounded-md border border-[var(--border-soft)] bg-transparent p-2 md:hidden"
          >
            <span aria-hidden className="block text-base leading-none">
              {mobileOpen ? "×" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile sheet — visible below the bar when toggled */}
      {mobileOpen && (
        <div
          data-navbar-mobile-sheet="true"
          className="border-t border-[var(--border-soft)] bg-[var(--surface)] md:hidden"
        >
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {[...PRIMARY_LINKS, ...SECONDARY_LINKS].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={
                    "block rounded-md px-3 py-2 text-sm transition-colors " +
                    (isActive(pathname, l)
                      ? "bg-[var(--brand-soft)] text-[var(--brand-ink)] font-semibold"
                      : "text-[var(--foreground)] hover:bg-[var(--surface-muted)]")
                  }
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-2">
              <span
                className="truncate text-xs text-zinc-500"
                title={email}
              >
                {email}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md border border-[var(--border-soft)] bg-transparent px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                >
                  {labels.logout}
                </button>
              </form>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        data-nav-active={active ? "true" : "false"}
        className={
          "whitespace-nowrap rounded-md px-3 py-1.5 transition-colors " +
          (active
            ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-ink)]"
            : "text-zinc-700 hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] dark:text-zinc-300 dark:hover:text-white")
        }
      >
        {item.label}
      </Link>
    </li>
  );
}
