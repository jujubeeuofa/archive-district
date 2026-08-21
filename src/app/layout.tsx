import type { Metadata, Viewport } from "next";
import { Archivo, Archivo_Black, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import Navbar from "@/components/Navbar";

// Archive District type stack (see claude/brand-identity.md): Archivo Black
// for display/headlines/price, Archivo for body text, IBM Plex Mono for
// lot numbers/SKUs/dates. next/font self-hosts these at build time — no
// runtime dependency on fonts.googleapis.com.
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Archive District — Designer Resale",
  description:
    "Designer streetwear and accessories resale — Chrome Hearts, Rick Owens, and more. Inventory, sell-to-us, and client accounts.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Archive District",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#16130F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${archivo.variable} ${archivoBlack.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen bg-ink-950 font-sans text-bone antialiased">
        <AuthProvider>
          <ServiceWorkerRegister />
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-7xl px-4 py-10 font-mono text-xs uppercase tracking-widest text-ink-400">
            Archive District · Est. 2026 — designer resale CRM prototype
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
