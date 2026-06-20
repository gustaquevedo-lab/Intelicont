import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";
import { ThemeProvider } from "@/lib/theme-context";
import { TRPCProvider } from "@/components/trpc-provider";
import { PostHogProvider } from "@/lib/posthog-provider";
import { ToastProvider } from "@/components/ui/toast";
import { NotificationProvider } from "@/components/notifications";
import { ServiceWorkerRegistrar } from "@/components/pwa/sw-registrar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "InteliCont — SaaS Contable AI-First para Paraguay",
    template: "%s | InteliCont",
  },
  description:
    "Plataforma contable inteligente para Paraguay. Carga facturas SIFEN, genera asientos con IA, cumple con DNIT/SET. Multi-tenant, libro inmutable, conciliación bancaria automática.",
  keywords: [
    "contabilidad",
    "paraguay",
    "SIFEN",
    "DNIT",
    "SET",
    "IVA",
    "IRE",
    "IRP",
    "facturación electrónica",
    "Hechauka",
    "libro electrónico",
    "asientos contables",
    "conciliación bancaria",
    "multi-tenant",
    "IA contable",
  ],
  authors: [{ name: "InteliCont" }],
  creator: "InteliCont",
  publisher: "InteliCont",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "InteliCont",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "es_PY",
    url: "https://intelicont.com",
    siteName: "InteliCont",
    title: "InteliCont — SaaS Contable AI-First para Paraguay",
    description:
      "Plataforma contable inteligente para Paraguay. Carga facturas SIFEN, genera asientos con IA, cumple con DNIT/SET.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "InteliCont - Contabilidad Inteligente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InteliCont — SaaS Contable AI-First para Paraguay",
    description:
      "Plataforma contable inteligente para Paraguay. Carga facturas SIFEN, genera asientos con IA.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#104c91",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="InteliCont" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ServiceWorkerRegistrar />
        <ThemeProvider>
          <PostHogProvider>
            <TRPCProvider>
              <ToastProvider>
                <NotificationProvider>
                  <AppShell>{children}</AppShell>
                </NotificationProvider>
              </ToastProvider>
            </TRPCProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
