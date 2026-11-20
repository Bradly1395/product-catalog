import Link from "next/link";

interface SiteHeaderProps {
  activePath?: "storefront" | "admin" | "login";
  isAdmin?: boolean;
}

export function SiteHeader({
  activePath = "storefront",
  isAdmin = false,
}: SiteHeaderProps) {
  const storeName =
    process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "Atelier Foundry";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span
            className="flex h-8 w-8 items-center justify-center border border-ink bg-ink text-surface transition-colors group-hover:border-accent group-hover:bg-accent"
            aria-hidden="true"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
              <rect x="3" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="14" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.6" />
              <line x1="11" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.6" />
              <line x1="6" y1="11" x2="6" y2="17" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-ink leading-none">
              {storeName}
            </span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted leading-none">
              Product Index
            </span>
          </div>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              activePath === "storefront"
                ? "text-ink underline decoration-accent decoration-2 underline-offset-8"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Catalog
          </Link>

          <Link
            href={isAdmin ? "/admin" : "/login"}
            className={`inline-flex items-center gap-2 border px-3.5 py-1.5 text-xs font-mono uppercase tracking-[0.1em] transition-colors ${
              activePath === "admin" || activePath === "login"
                ? "border-ink bg-ink text-surface"
                : "border-line-strong bg-surface text-ink hover:border-ink"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isAdmin ? "bg-moss" : "bg-ink-muted/60"
              }`}
              aria-hidden="true"
            />
            {isAdmin ? "Admin" : "Admin Login"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
