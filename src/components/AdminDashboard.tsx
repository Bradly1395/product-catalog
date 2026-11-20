"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { logoutAction } from "@/app/actions/auth";
import {
  deleteProductAction,
  saveProductAction,
  toggleAvailabilityAction,
} from "@/app/actions/products";
import type { ActionState, Product, ProductSpec } from "@/lib/types";
import { ProductMedia } from "./ProductMedia";
import { ProductPlaceholder } from "./ProductPlaceholder";

interface AdminDashboardProps {
  products: Product[];
}

const INITIAL_ACTION_STATE: ActionState = { status: "idle" };

const DEFAULT_EMPTY_SPECS: ProductSpec[] = [{ label: "", value: "" }];

export function AdminDashboard({ products }: AdminDashboardProps) {
  const [formState, formAction, isSaving] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await saveProductAction(prevState, formData);
      if (result.status === "success") {
        resetFormToCreate();
      }
      return result;
    },
    INITIAL_ACTION_STATE
  );
  const [isMutatingList, startListTransition] = useTransition();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  // Controlled form inputs so editing & live preview stay seamlessly synchronized
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priceText, setPriceText] = useState("");
  const [description, setDescription] = useState("");
  const [available, setAvailable] = useState(true);
  const [specs, setSpecs] = useState<ProductSpec[]>(DEFAULT_EMPTY_SPECS);
  const [removeImage, setRemoveImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Inventory list UI state
  const [listSearch, setListSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [busyProductId, setBusyProductId] = useState<number | null>(null);
  const [listBanner, setListBanner] = useState<ActionState | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);

  const existingCategories = useMemo(() => {
    return Array.from(new Set(products.map((item) => item.category))).sort(
      (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.priceText.toLowerCase().includes(q)
    );
  }, [products, listSearch]);

  const stats = useMemo(() => {
    const availableCount = products.filter((p) => p.available).length;
    return {
      total: products.length,
      available: availableCount,
      unavailable: products.length - availableCount,
      categories: existingCategories.length,
    };
  }, [products, existingCategories]);

  // Revoke object URL whenever previewUrl changes or unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetFormToCreate() {
    setEditingProduct(null);
    setTitle("");
    setCategory("");
    setPriceText("");
    setDescription("");
    setAvailable(true);
    setSpecs(DEFAULT_EMPTY_SPECS);
    setRemoveImage(false);
    setPreviewUrl(null);
    setSelectedFileName(null);
    setFormResetKey((prev) => prev + 1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function startEditing(product: Product) {
    setEditingProduct(product);
    setTitle(product.title);
    setCategory(product.category);
    setPriceText(product.priceText);
    setDescription(product.description);
    setAvailable(product.available);
    setSpecs(
      product.specifications.length > 0
        ? product.specifications.map((s) => ({ ...s }))
        : DEFAULT_EMPTY_SPECS
    );
    setRemoveImage(false);
    setPreviewUrl(null);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      setSelectedFileName(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFileName(file.name);
    setRemoveImage(false);
  }

  function handleClearSelectedFile() {
    setPreviewUrl(null);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function updateSpecRow(index: number, field: "label" | "value", next: string) {
    setSpecs((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: next } : row))
    );
  }

  function addSpecRow() {
    setSpecs((prev) => [...prev, { label: "", value: "" }]);
  }

  function removeSpecRow(index: number) {
    setSpecs((prev) => {
      if (prev.length <= 1) return [{ label: "", value: "" }];
      return prev.filter((_, idx) => idx !== index);
    });
  }

  function handleToggleAvailability(product: Product) {
    setBusyProductId(product.id);
    setListBanner(null);
    startListTransition(async () => {
      const result = await toggleAvailabilityAction(product.id);
      setListBanner(result);
      setBusyProductId(null);
    });
  }

  function handleDeleteProduct(product: Product) {
    setBusyProductId(product.id);
    setListBanner(null);
    startListTransition(async () => {
      const result = await deleteProductAction(product.id);
      setListBanner(result);
      setConfirmDeleteId(null);
      setBusyProductId(null);
      if (editingProduct?.id === product.id) {
        resetFormToCreate();
      }
    });
  }

  const effectivePreviewImage =
    previewUrl ?? (!removeImage ? editingProduct?.imagePath ?? null : null);

  const cleanedSpecsJson = JSON.stringify(
    specs
      .filter((row) => row.label.trim() && row.value.trim())
      .map((row) => ({ label: row.label.trim(), value: row.value.trim() }))
  );

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Admin Header & Summary Strip */}
      <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            Self-Contained SQLite Catalog
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="border border-line-strong bg-surface px-3.5 py-2 font-mono text-xs uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink"
          >
            View Storefront &nearr;
          </Link>
          <form action={logoutAction}>
            <button
              id="admin-logout-button"
              type="submit"
              className="border border-ink bg-ink px-3.5 py-2 font-mono text-xs uppercase tracking-[0.08em] text-surface transition-colors hover:border-accent hover:bg-accent"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Compact Metric Strip */}
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-line bg-surface px-4 py-3.5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Total Products
          </dt>
          <dd className="mt-1 font-mono text-2xl font-medium text-ink tabular-nums">
            {stats.total}
          </dd>
        </div>
        <div className="border border-line bg-surface px-4 py-3.5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Available
          </dt>
          <dd className="mt-1 font-mono text-2xl font-medium text-moss tabular-nums">
            {stats.available}
          </dd>
        </div>
        <div className="border border-line bg-surface px-4 py-3.5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Unavailable
          </dt>
          <dd className="mt-1 font-mono text-2xl font-medium text-ink-muted tabular-nums">
            {stats.unavailable}
          </dd>
        </div>
        <div className="border border-line bg-surface px-4 py-3.5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Categories
          </dt>
          <dd className="mt-1 font-mono text-2xl font-medium text-ink tabular-nums">
            {stats.categories}
          </dd>
        </div>
      </dl>

      {/* Main Split Workspace */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Add / Edit Form */}
        <div ref={formPanelRef} className="lg:col-span-5">
          <div className="border border-line bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  {editingProduct
                    ? `Editing Item #${editingProduct.id}`
                    : "Create Catalog Entry"}
                </p>
                <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-ink">
                  {editingProduct ? editingProduct.title : "Add New Product"}
                </h2>
              </div>

              {editingProduct && (
                <button
                  type="button"
                  onClick={resetFormToCreate}
                  className="border border-line-strong px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted hover:border-ink hover:text-ink"
                >
                  Cancel
                </button>
              )}
            </div>

            {formState.status === "success" && formState.message && (
              <div
                role="status"
                className="mt-4 border border-moss/35 bg-moss/10 px-3.5 py-2.5 text-sm text-moss"
              >
                {formState.message}
              </div>
            )}

            {formState.status === "error" && formState.message && (
              <div
                role="alert"
                className="mt-4 border border-danger/35 bg-danger/8 px-3.5 py-2.5 text-sm text-danger"
              >
                {formState.message}
              </div>
            )}

            <form
              key={formResetKey}
              action={formAction}
              className="mt-5 space-y-4"
              noValidate
            >
              {editingProduct && (
                <input type="hidden" name="id" value={editingProduct.id} />
              )}
              <input
                type="hidden"
                name="removeImage"
                value={removeImage ? "true" : "false"}
              />
              <input
                type="hidden"
                name="specifications"
                value={cleanedSpecsJson}
              />

              {/* Live Visual Preview (Uploaded Image or Geometric Placeholder) */}
              <div>
                <span className="block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                  Card Preview
                </span>
                <div className="mt-2 aspect-[4/3] w-full overflow-hidden border border-line">
                  {effectivePreviewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={effectivePreviewImage}
                      alt={title || "Product preview"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ProductPlaceholder
                      title={title || "Untitled Product"}
                      category={category || "Catalog"}
                      variant="card"
                      className="h-full w-full"
                    />
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="product-title"
                  className="block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted"
                >
                  Title <span className="text-accent">*</span>
                </label>
                <input
                  id="product-title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Arc-04 Linear Desk Lamp"
                  className="mt-1.5 w-full border border-line-strong bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
                />
                {formState.fieldErrors?.title && (
                  <p className="mt-1 text-xs text-danger">
                    {formState.fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="product-category"
                    className="block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted"
                  >
                    Category <span className="text-accent">*</span>
                  </label>
                  <input
                    id="product-category"
                    name="category"
                    type="text"
                    required
                    list="catalog-category-suggestions"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    placeholder="Lighting"
                    className="mt-1.5 w-full border border-line-strong bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
                  />
                  <datalist id="catalog-category-suggestions">
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                  {formState.fieldErrors?.category && (
                    <p className="mt-1 text-xs text-danger">
                      {formState.fieldErrors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="product-price"
                    className="block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted"
                  >
                    Price / Quote Text <span className="text-accent">*</span>
                  </label>
                  <input
                    id="product-price"
                    name="priceText"
                    type="text"
                    required
                    value={priceText}
                    onChange={(event) => setPriceText(event.target.value)}
                    placeholder="$420 or Request Quote"
                    className="mt-1.5 w-full border border-line-strong bg-canvas px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
                  />
                  {formState.fieldErrors?.priceText && (
                    <p className="mt-1 text-xs text-danger">
                      {formState.fieldErrors.priceText}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="product-description"
                  className="block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted"
                >
                  Description <span className="text-accent">*</span>
                </label>
                <textarea
                  id="product-description"
                  name="description"
                  rows={4}
                  required
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Materials, fabrication details, intended use..."
                  className="mt-1.5 w-full resize-y border border-line-strong bg-canvas px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
                />
                {formState.fieldErrors?.description && (
                  <p className="mt-1 text-xs text-danger">
                    {formState.fieldErrors.description}
                  </p>
                )}
              </div>

              {/* Technical Specifications Builder */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
                    Specifications (Optional)
                  </span>
                  <button
                    type="button"
                    onClick={addSpecRow}
                    className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent hover:underline"
                  >
                    + Add Spec
                  </button>
                </div>

                <div className="mt-2 space-y-2">
                  {specs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(event) =>
                          updateSpecRow(idx, "label", event.target.value)
                        }
                        placeholder="Label (e.g., Dimensions)"
                        aria-label={`Specification ${idx + 1} label`}
                        className="w-2/5 border border-line-strong bg-canvas px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
                      />
                      <input
                        type="text"
                        value={spec.value}
                        onChange={(event) =>
                          updateSpecRow(idx, "value", event.target.value)
                        }
                        placeholder="Value (e.g., 580 × 160 mm)"
                        aria-label={`Specification ${idx + 1} value`}
                        className="flex-1 border border-line-strong bg-canvas px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-muted/55 focus:border-ink focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpecRow(idx)}
                        aria-label={`Remove specification ${idx + 1}`}
                        className="px-2 py-1 text-sm text-ink-muted hover:text-danger"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Image Upload */}
              <div>
                <label
                  htmlFor="product-image"
                  className="block font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted"
                >
                  Product Image (Optional · Saved to ./public/uploads)
                </label>
                <div className="mt-1.5 border border-dashed border-line-strong bg-canvas p-3.5">
                  <input
                    ref={fileInputRef}
                    id="product-image"
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-ink-muted file:mr-3 file:border file:border-ink file:bg-ink file:px-3 file:py-1.5 file:font-mono file:text-[11px] file:uppercase file:tracking-[0.08em] file:text-surface hover:file:border-accent hover:file:bg-accent"
                  />
                  <p className="mt-2 text-[11px] text-ink-muted">
                    JPG, PNG, WebP, GIF, or AVIF up to 5 MB. Leave blank to use
                    the built-in geometric SVG placeholder.
                  </p>

                  {selectedFileName && (
                    <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-xs">
                      <span className="truncate font-mono text-ink">
                        Selected: {selectedFileName}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSelectedFile}
                        className="shrink-0 font-mono text-[11px] uppercase text-danger hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {editingProduct?.imagePath && !previewUrl && (
                    <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-xs">
                      <span className="font-mono text-ink-muted">
                        {removeImage
                          ? "Will revert to geometric placeholder on save"
                          : "Currently using uploaded photo"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRemoveImage((prev) => !prev)}
                        className="font-mono text-[11px] uppercase text-accent hover:underline"
                      >
                        {removeImage ? "Keep Photo" : "Remove Photo"}
                      </button>
                    </div>
                  )}
                </div>
                {formState.fieldErrors?.image && (
                  <p className="mt-1 text-xs text-danger">
                    {formState.fieldErrors.image}
                  </p>
                )}
              </div>

              {/* Availability Switch */}
              <div className="flex items-center justify-between border border-line bg-canvas px-3.5 py-3">
                <div>
                  <label
                    htmlFor="product-available"
                    className="block text-sm font-medium text-ink"
                  >
                    Available in Catalog
                  </label>
                  <p className="text-xs text-ink-muted">
                    Toggle off to display as currently unavailable.
                  </p>
                </div>
                <input
                  id="product-available"
                  name="available"
                  type="checkbox"
                  checked={available}
                  onChange={(event) => setAvailable(event.target.checked)}
                  className="h-4 w-4 accent-ink"
                />
              </div>

              <button
                id="save-product-submit"
                type="submit"
                disabled={isSaving}
                className="w-full bg-ink px-4 py-2.5 text-sm font-medium text-surface transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : editingProduct
                    ? "Save Product Changes"
                    : "Add Product to Catalog"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Product Inventory List */}
        <div className="lg:col-span-7">
          <div className="border border-line bg-surface">
            <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
                  Inventory Management
                </p>
                <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-ink">
                  Existing Products ({products.length})
                </h2>
              </div>

              <input
                id="admin-inventory-search"
                type="search"
                value={listSearch}
                onChange={(event) => setListSearch(event.target.value)}
                placeholder="Filter inventory..."
                aria-label="Filter existing products"
                className="w-full border border-line-strong bg-canvas px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none sm:w-56"
              />
            </div>

            {listBanner?.message && (
              <div
                role="status"
                className={`border-b px-5 py-2.5 text-xs font-medium ${
                  listBanner.status === "error"
                    ? "border-danger/30 bg-danger/8 text-danger"
                    : "border-moss/30 bg-moss/10 text-moss"
                }`}
              >
                {listBanner.message}
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-ink-muted">
                {products.length === 0
                  ? "No products in SQLite yet. Add your first product using the form."
                  : "No products match your filter."}
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {filteredProducts.map((product) => {
                  const isBusy = isMutatingList && busyProductId === product.id;
                  const isEditingThis = editingProduct?.id === product.id;

                  return (
                    <li
                      key={product.id}
                      className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
                        isEditingThis ? "bg-canvas" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="h-16 w-22 shrink-0 overflow-hidden border border-line">
                          <ProductMedia
                            title={product.title}
                            category={product.category}
                            imagePath={product.imagePath}
                            variant="thumbnail"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                              {product.category}
                            </span>
                            <span className="text-line-strong" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-mono text-xs font-medium text-ink">
                              {product.priceText}
                            </span>
                            {product.imagePath ? (
                              <span className="border border-line bg-canvas px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-muted">
                                Photo
                              </span>
                            ) : (
                              <span className="border border-line bg-canvas px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-muted">
                                SVG Placeholder
                              </span>
                            )}
                          </div>

                          <h3 className="mt-1 truncate text-sm font-semibold text-ink">
                            {product.title}
                          </h3>
                          <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                            {product.description}
                          </p>
                        </div>
                      </div>

                      {/* Instant Controls: Availability Toggle, Edit, Delete */}
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                        <button
                          id={`toggle-availability-${product.id}`}
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleAvailability(product)}
                          aria-pressed={product.available}
                          className={`inline-flex items-center gap-2 border px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] transition-colors disabled:opacity-50 ${
                            product.available
                              ? "border-moss/35 bg-moss/10 text-moss hover:bg-moss/20"
                              : "border-line-strong bg-canvas text-ink-muted hover:border-ink hover:text-ink"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              product.available ? "bg-moss" : "bg-ink-muted/60"
                            }`}
                          />
                          {product.available ? "Available" : "Unavailable"}
                        </button>

                        <button
                          id={`edit-product-${product.id}`}
                          type="button"
                          onClick={() => startEditing(product)}
                          className="border border-line-strong bg-surface px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-ink transition-colors hover:border-ink"
                        >
                          Edit
                        </button>

                        {confirmDeleteId === product.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              id={`confirm-delete-${product.id}`}
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDeleteProduct(product)}
                              className="border border-danger bg-danger px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-surface hover:opacity-90 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="border border-line-strong px-2 py-1.5 font-mono text-[11px] uppercase text-ink-muted hover:text-ink"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`delete-product-${product.id}`}
                            type="button"
                            disabled={isBusy}
                            onClick={() => setConfirmDeleteId(product.id)}
                            className="border border-line px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-danger transition-colors hover:border-danger hover:bg-danger/8 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
