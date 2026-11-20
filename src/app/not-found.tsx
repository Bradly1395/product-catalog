import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md border border-line bg-surface p-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
            404 · Not Found
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            Item not in catalog
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            The product or page you requested could not be found.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.1em] text-surface transition-colors hover:bg-accent"
          >
            Back to Catalog
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
