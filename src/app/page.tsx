import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StorefrontCatalog } from "@/components/StorefrontCatalog";
import { isAdminAuthenticated } from "@/lib/auth";
import { listProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = listProducts();
  const isAdmin = await isAdminAuthenticated();

  const storeName =
    process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "Atelier Foundry";
  const storeTagline =
    process.env.NEXT_PUBLIC_STORE_TAGLINE?.trim() ||
    "Architectural hardware, studio lighting, and modular objects.";

  return (
    <>
      <SiteHeader activePath="storefront" isAdmin={isAdmin} />
      <StorefrontCatalog
        products={products}
        storeName={storeName}
        storeTagline={storeTagline}
      />
      <SiteFooter />
    </>
  );
}
