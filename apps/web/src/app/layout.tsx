import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";
import { ThemeProvider } from "@/lib/theme-context";
import { TRPCProvider } from "@/components/trpc-provider";
import { PostHogProvider } from "@/lib/posthog-provider";
import { ToastProvider } from "@/components/ui/toast";
import { NotificationProvider } from "@/components/notifications";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://intelicont.vercel.app"),
  title: {
    default: "InteliCont — SaaS Contable AI-First para Paraguay",
    template: "%s | InteliCont",
  },
  description:
    "Plataforma contable inteligente para Paraguay. Carga facturas SIFEN, genera asientos con IA, cumple con la DNIT. Multi-tenant, libro inmutable, conciliación bancaria automática.",
  keywords: [
    "contabilidad",
    "paraguay",
    "SIFEN",
    "DNIT",
    "IVA",
    "IRE",
    "IRP",
    "facturación electrónica",
    "RG90",
    "libro electrónico",
    "asientos contables",
    "conciliación bancaria",
    "multi-tenant",
    "IA contable",
  ],
  authors: [{ name: "InteliCont" }],
  creator: "InteliCont",
  publisher: "InteliCont",
  openGraph: {
    type: "website",
    locale: "es_PY",
    url: "https://intelicont.com",
    siteName: "InteliCont",
    title: "InteliCont — SaaS Contable AI-First para Paraguay",
    description:
      "Plataforma contable inteligente para Paraguay. Carga facturas SIFEN, genera asientos con IA, cumple con la DNIT.",
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
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
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
