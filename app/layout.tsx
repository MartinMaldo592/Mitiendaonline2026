
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/layout-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Blama Shop",
    template: "%s | Blama Shop",
  },
  applicationName: "Blama Shop",
  description: "Blama Shop - Tienda online con pedidos directos a WhatsApp.",
  openGraph: {
    title: "Blama Shop",
    description: "Blama Shop - Tienda online con pedidos directos a WhatsApp.",
    type: "website",
    locale: "es_ES",
    siteName: "Blama Shop",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blama Shop",
    description: "Blama Shop - Tienda online con pedidos directos a WhatsApp.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background`}
      >
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
