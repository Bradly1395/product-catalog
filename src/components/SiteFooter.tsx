import Link from "next/link";

export function SiteFooter() {
  const storeName =
    process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "Atelier Foundry";

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="font-medium text-ink">{storeName}</span>
          <span className="text-line-strong" aria-hidden="true">
            ·
          </span>
          <span className="font-mono text-[11px]">
            Self-contained catalog · Local SQLite &amp; SMTP
          </span>
        </div>

        <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.1em]">
          <Link href="/" className="transition-colors hover:text-ink">
            Catalog
          </Link>
          <Link href="/admin" className="transition-colors hover:text-ink">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
