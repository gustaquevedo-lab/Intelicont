import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";

const inter = Inter({ subsets: ["latin"], weight: ["300","400","500","600","700","800","900"] });

export const metadata: Metadata = {
  title: {
    default: "InteliCont — Software Contable AI-First para Paraguay",
    template: "%s | InteliCont",
  },
  description:
    "Gestioná múltiples empresas, automatizá SIFEN, generá Hechauka y RG90 automáticamente. El software contable más avanzado de Paraguay, con IA incluida.",
  keywords: [
    "software contable Paraguay",
    "contabilidad SIFEN",
    "Hechauka automático",
    "RG90 Paraguay",
    "software DNIT",
    "multi-empresa contabilidad",
    "InteliCont",
    "Intellihouse",
  ],
  authors: [{ name: "IntelliHouse Soluciones E.A.S.", url: "https://intelicont.com.py" }],
  creator: "IntelliHouse Soluciones E.A.S.",
  metadataBase: new URL("https://intelicont.com.py"),
  openGraph: {
    type: "website",
    locale: "es_PY",
    url: "https://intelicont.com.py",
    siteName: "InteliCont",
    title: "InteliCont — La contabilidad de tu estudio, automatizada",
    description:
      "Gestioná N empresas con SIFEN integrado, IA que sugiere asientos y cierre de período en horas. Hecho para Paraguay.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#104c91",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
