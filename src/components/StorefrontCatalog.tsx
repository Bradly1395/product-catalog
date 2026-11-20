"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { InquiryForm } from "./InquiryForm";
import { ProductMedia } from "./ProductMedia";

interface StorefrontCatalogProps {
  products: Product[];
  storeName: string;
  storeTagline: string;
}

export function StorefrontCatalog({
  products,
  storeName,
  storeTagline,
}: StorefrontCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (selectedCategory !== "All" && product.category !== selectedCategory) {
        return false;
      }
      if (onlyAvailable && !product.available) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        product.title,
        product.category,
        product.priceText,
        product.description,
        ...product.specifications.flatMap((spec) => [spec.label, spec.value]),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [products, selectedCategory, searchQuery, onlyAvailable]);

  const availableCount = useMemo(
    () => products.filter((product) => product.available).length,
    [products]
  );

  // Close product detail modal on Escape and lock body scrolling while open
  useEffect(() => {
    if (!activeProduct) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveProduct(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeProduct]);

  return (
    <div className="flex-1">
      {/* Editorial Intro Band */}
      <section className="border-b border-line bg-surface surface-paper">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                {storeName} · Complete Index
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl leading-[1.08]">
                Precision objects built for lasting spaces.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                {storeTagline} Inspect full technical specifications and submit
                direct studio inquiries on any piece.
              </p>
            </div>

            <dl className="flex items-center gap-8 border-t border-line pt-5 lg:border-t-0 lg:pt-0">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  Catalog Items
                </dt>
                <dd className="mt-1 font-mono text-2xl font-medium text-ink tabular-nums">
                  {String(products.length).padStart(2, "0")}
                </dd>
              </div>
              <div className="h-9 w-px bg-line" aria-hidden="true" />
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  Available Now
                </dt>
                <dd className="mt-1 font-mono text-2xl font-medium text-moss tabular-nums">
                  {String(availableCount).padStart(2, "0")}
                </dd>
              </div>
              <div className="h-9 w-px bg-line" aria-hidden="true" />
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  Categories
                </dt>
                <dd className="mt-1 font-mono text-2xl font-medium text-ink tabular-nums">
                  {String(categoryCounts.length).padStart(2, "0")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section
        aria-label="Catalog filters"
        className="border-b border-line bg-canvas"
      >
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Category Filter Tabs */}
            <div
              role="tablist"
              aria-label="Filter products by category"
              className="flex flex-wrap items-center gap-1.5"
            >
              <button
                id="category-tab-all"
                type="button"
                role="tab"
                aria-selected={selectedCategory === "All"}
                onClick={() => setSelectedCategory("All")}
                className={`inline-flex items-center gap-2 border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === "All"
                    ? "border-ink bg-ink text-surface"
                    : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                <span>All</span>
                <span className="font-mono text-[10px] opacity-75">
                  {products.length}
                </span>
              </button>

              {categoryCounts.map(([category, count]) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    id={`category-tab-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex items-center gap-2 border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-ink bg-ink text-surface"
                        : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    <span>{category}</span>
                    <span className="font-mono text-[10px] opacity-75">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Availability Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink-muted select-none">
                <input
                  id="filter-available-only"
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(event) => setOnlyAvailable(event.target.checked)}
                  className="h-4 w-4 accent-ink"
                />
                <span>Available only</span>
              </label>

              <div className="relative w-full sm:w-72">
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted"
                >
                  <circle
                    cx="9"
                    cy="9"
                    r="5.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M13.5 13.5L17 17"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  id="catalog-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search title, spec, material..."
                  aria-label="Search products"
                  className="w-full border border-line-strong bg-surface py-2 pr-3 pl-9 text-sm text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {filteredProducts.length === 0 ? (
          <div className="border border-line bg-surface px-6 py-16 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-muted">
              No Matching Products
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Try adjusting your search query or selecting a different category.
            </p>
            {(selectedCategory !== "All" || searchQuery || onlyAvailable) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                  setOnlyAvailable(false);
                }}
                className="mt-5 border border-ink bg-ink px-4 py-2 text-xs font-mono uppercase tracking-[0.1em] text-surface transition-colors hover:border-accent hover:bg-accent"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className={`group flex flex-col border border-line bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_12px_30px_-18px_rgba(24,23,21,0.22)] ${
                  !product.available ? "opacity-80" : ""
                }`}
              >
                {/* Uniform 4:3 Media Frame */}
                <button
                  type="button"
                  onClick={() => setActiveProduct(product)}
                  className="relative aspect-[4/3] w-full overflow-hidden border-b border-line text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  aria-label={`Inspect ${product.title}`}
                >
                  <ProductMedia
                    title={product.title}
                    category={product.category}
                    imagePath={product.imagePath}
                    variant="card"
                  />
                  {!product.available && (
                    <span className="absolute top-3 right-3 border border-ink/20 bg-surface/92 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted backdrop-blur-xs">
                      Unavailable
                    </span>
                  )}
                </button>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                      {product.category}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          product.available ? "bg-moss" : "bg-ink-muted/45"
                        }`}
                        aria-hidden="true"
                      />
                      {product.available ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <h2 className="mt-2.5 text-lg font-semibold tracking-tight text-ink">
                    <button
                      type="button"
                      onClick={() => setActiveProduct(product)}
                      className="text-left transition-colors hover:text-accent focus:outline-none focus-visible:underline"
                    >
                      {product.title}
                    </button>
                  </h2>

                  <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-muted">
                    {product.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                    <span className="font-mono text-sm font-medium text-ink tabular-nums">
                      {product.priceText}
                    </span>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/products/${product.slug}`}
                        className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted transition-colors hover:text-ink"
                      >
                        Page
                      </Link>
                      <button
                        id={`open-product-${product.id}`}
                        type="button"
                        onClick={() => setActiveProduct(product)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-accent transition-colors hover:text-accent-hover"
                      >
                        Details &amp; Inquire
                        <span aria-hidden="true">&rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Product Detail & Inquiry Modal */}
      {activeProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-product-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-3 sm:p-6 backdrop-blur-[2px]"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setActiveProduct(null);
            }
          }}
        >
          <div className="animate-modal-in relative max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-line-strong bg-surface shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface/95 px-5 py-3.5 backdrop-blur-sm sm:px-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                  {activeProduct.category}
                </span>
                <span className="text-line-strong" aria-hidden="true">
                  /
                </span>
                <Link
                  href={`/products/${activeProduct.slug}`}
                  className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent hover:underline"
                >
                  Open Permanent Page &nearr;
                </Link>
              </div>
              <button
                id="close-product-modal"
                type="button"
                onClick={() => setActiveProduct(null)}
                aria-label="Close product detail modal"
                className="inline-flex h-8 w-8 items-center justify-center border border-line bg-canvas text-ink transition-colors hover:border-ink hover:bg-ink hover:text-surface"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 gap-8 p-5 sm:p-7 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-6">
                <div className="aspect-[4/3] w-full overflow-hidden border border-line">
                  <ProductMedia
                    title={activeProduct.title}
                    category={activeProduct.category}
                    imagePath={activeProduct.imagePath}
                    variant="detail"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-lg font-medium text-ink tabular-nums">
                      {activeProduct.priceText}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] ${
                        activeProduct.available
                          ? "border-moss/30 bg-moss/10 text-moss"
                          : "border-line-strong bg-surface-muted text-ink-muted"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          activeProduct.available ? "bg-moss" : "bg-ink-muted"
                        }`}
                      />
                      {activeProduct.available
                        ? "Available"
                        : "Currently Unavailable"}
                    </span>
                  </div>

                  <h2
                    id="modal-product-title"
                    className="mt-3 text-2xl font-semibold tracking-tight text-ink"
                  >
                    {activeProduct.title}
                  </h2>

                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                    {activeProduct.description}
                  </p>
                </div>

                {activeProduct.specifications.length > 0 && (
                  <div>
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
                      Technical Specifications
                    </h3>
                    <dl className="mt-2.5 divide-y divide-line border-t border-b border-line">
                      {activeProduct.specifications.map((spec, index) => (
                        <div
                          key={`${spec.label}-${index}`}
                          className="grid grid-cols-12 gap-3 py-2.5 text-sm"
                        >
                          <dt className="col-span-5 font-mono text-xs text-ink-muted">
                            {spec.label}
                          </dt>
                          <dd className="col-span-7 text-ink">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>

              <div className="lg:col-span-6">
                <InquiryForm
                  key={activeProduct.id}
                  productId={activeProduct.id}
                  productTitle={activeProduct.title}
                  available={activeProduct.available}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
