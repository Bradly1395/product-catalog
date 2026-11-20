import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const storeName =
  process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "Atelier Foundry";
const storeTagline =
  process.env.NEXT_PUBLIC_STORE_TAGLINE?.trim() ||
  "Architectural hardware, studio lighting, and modular objects.";

export const metadata: Metadata = {
  title: {
    default: `${storeName} — Product Catalog`,
    template: `%s | ${storeName}`,
  },
  description: storeTagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
