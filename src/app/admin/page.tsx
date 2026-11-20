import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/auth";
import { listProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Add, edit, toggle availability, and delete catalog products.",
};

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/login?next=/admin");
  }

  const products = listProducts();

  return (
    <>
      <SiteHeader activePath="admin" isAdmin />
      <AdminDashboard products={products} />
      <SiteFooter />
    </>
  );
}
