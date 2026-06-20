"use client";

import dynamic from "next/dynamic";

const AppShell = dynamic(() => import("@/components/app-shell"), { ssr: false });
const ThemeProvider = dynamic(
  () => import("@/lib/theme-context").then(m => ({ default: m.ThemeProvider })),
  { ssr: false }
);
const TRPCProvider = dynamic(
  () => import("@/components/trpc-provider").then(m => ({ default: m.TRPCProvider })),
  { ssr: false }
);
const PostHogProvider = dynamic(
  () => import("@/lib/posthog-provider").then(m => ({ default: m.PostHogProvider })),
  { ssr: false }
);
const ToastProvider = dynamic(
  () => import("@/components/ui/toast").then(m => ({ default: m.ToastProvider })),
  { ssr: false }
);
const NotificationProvider = dynamic(
  () => import("@/components/notifications").then(m => ({ default: m.NotificationProvider })),
  { ssr: false }
);
const ServiceWorkerRegistrar = dynamic(
  () => import("@/components/pwa/sw-registrar").then(m => ({ default: m.ServiceWorkerRegistrar })),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
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
    </>
  );
}
