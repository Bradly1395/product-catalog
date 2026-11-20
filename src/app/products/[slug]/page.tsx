import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/InquiryForm";
import { ProductMedia } from "@/components/ProductMedia";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/auth";
import { getProductBySlug } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.title,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const isAdmin = await isAdminAuthenticated();

  return (
    <>
      <SiteHeader activePath="storefront" isAdmin={isAdmin} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-ink"
          >
            <span aria-hidden="true">&larr;</span>
            Back to Catalog
          </Link>
        </nav>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Column: Media + Description + Specifications */}
          <div className="space-y-8 lg:col-span-7">
            <div className="aspect-[4/3] w-full overflow-hidden border border-line bg-surface">
              <ProductMedia
                title={product.title}
                category={product.category}
                imagePath={product.imagePath}
                variant="detail"
              />
            </div>

            <div className="border border-line bg-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
                  {product.category}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] ${
                    product.available
                      ? "border-moss/30 bg-moss/10 text-moss"
                      : "border-line-strong bg-surface-muted text-ink-muted"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      product.available ? "bg-moss" : "bg-ink-muted"
                    }`}
                  />
                  {product.available ? "Available" : "Currently Unavailable"}
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-ink sm:text-4xl">
                {product.title}
              </h1>

              <p className="mt-3 font-mono text-xl font-medium text-ink tabular-nums">
                {product.priceText}
              </p>

              <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-ink-muted">
                {product.description}
              </p>

              {product.specifications.length > 0 && (
                <section aria-labelledby="specs-heading" className="mt-8 pt-6 border-t border-line">
                  <h2
                    id="specs-heading"
                    className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted"
                  >
                    Technical Specifications
                  </h2>
                  <dl className="mt-3 divide-y divide-line border-t border-b border-line">
                    {product.specifications.map((spec, index) => (
                      <div
                        key={`${spec.label}-${index}`}
                        className="grid grid-cols-12 gap-4 py-3 text-sm"
                      >
                        <dt className="col-span-5 font-mono text-xs text-ink-muted">
                          {spec.label}
                        </dt>
                        <dd className="col-span-7 text-ink">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Inquiry Form */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <InquiryForm
                productId={product.id}
                productTitle={product.title}
                available={product.available}
              />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
