import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/app-shell";
import { ThemeProvider } from "@/lib/theme-context";
import { TRPCProvider } from "@/components/trpc-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ServiceWorkerRegistrar } from "@/components/pwa/sw-registrar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOGIN_PATH, TOTP_SETUP_PATH, pageGuardRedirect } from "@/lib/auth-guard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InteliCont — SaaS Contable AI-First para Paraguay",
  description: "Plataforma contable inteligente para Paraguay. Carga facturas SIFEN, genera asientos con IA y cumple con DNIT.",
  keywords: ["contabilidad", "paraguay", "SIFEN", "DNIT", "IVA", "IRE", "facturación electrónica"],
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const path = h.get("x-pathname") ?? "/";
  const target = await pageGuardRedirect(h, path);
  if (target) redirect(target);
  const bare = path === LOGIN_PATH || path === TOTP_SETUP_PATH;

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider>
          <TRPCProvider>
            <ToastProvider>
              <ServiceWorkerRegistrar />
              {bare ? children : <AppShell>{children}</AppShell>}
            </ToastProvider>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
