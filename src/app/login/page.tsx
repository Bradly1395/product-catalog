import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Sign In",
  description: "Authenticate to manage catalog inventory.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authenticated = await isAdminAuthenticated();
  if (authenticated) {
    redirect("/admin");
  }

  const { next } = await searchParams;
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/admin";

  return (
    <>
      <SiteHeader activePath="login" isAdmin={false} />

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md border border-line bg-surface p-7 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            Protected Workspace
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            Admin Sign In
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Enter the password configured in{" "}
            <code className="border border-line bg-canvas px-1.5 py-0.5 font-mono text-xs text-ink">
              ADMIN_PASSWORD
            </code>{" "}
            to add, edit, or remove catalog products.
          </p>

          <div className="mt-6">
            <LoginForm nextPath={safeNext} />
          </div>

          <div className="mt-6 border-t border-line pt-4 text-center">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-ink"
            >
              &larr; Return to Public Storefront
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
