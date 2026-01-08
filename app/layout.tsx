
import type { Metadata } from "next";
import Script from "next/script";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.blama.shop";
const GA_MEASUREMENT_ID = "G-1RT9M8ZQK1";

export const metadata: Metadata = {
  title: {
    default: "Blama.shop",
    template: "%s | Blama.shop",
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: [
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
  },
  applicationName: "Blama.shop",
  description:
    "Blama.shop es una tienda online en Perú con productos seleccionados, compras simples y atención rápida por WhatsApp. Encuentra novedades, ofertas y envíos a domicilio.",
  openGraph: {
    title: "Blama.shop",
    description:
      "Compra en Blama.shop: productos seleccionados, ofertas y atención rápida por WhatsApp. Envíos a domicilio y experiencia de compra simple.",
    type: "website",
    locale: "es_ES",
    siteName: "Blama.shop",
    url: siteUrl,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Blama.shop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blama.shop",
    description:
      "Tienda online en Perú con atención rápida por WhatsApp. Novedades, ofertas y envíos a domicilio.",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', '${GA_MEASUREMENT_ID}');`}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-background`}
      >
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
