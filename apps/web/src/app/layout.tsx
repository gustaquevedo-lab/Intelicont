import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";
import { ThemeProvider } from "@/lib/theme-context";
import { TRPCProvider } from "@/components/trpc-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InteliCont — SaaS Contable AI-First para Paraguay",
  description: "Plataforma contable inteligente para Paraguay. Carga facturas SIFEN, genera asientos con IA y cumple con DNIT.",
  keywords: ["contabilidad", "paraguay", "SIFEN", "DNIT", "IVA", "IRE", "facturación electrónica"],
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
          <TRPCProvider>
            <AppShell>{children}</AppShell>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
