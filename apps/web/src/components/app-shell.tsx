"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { CommandPalette } from "@/components/command-palette";
import { usePathname } from "next/navigation";
import { PreviewBanner } from "@/components/preview-banner";
import { EntitySwitcher, isSwitcherShortcut } from "@/components/entity-switcher";
import { isPreviewPath } from "@/lib/nav-config";
import { usePreviewStore } from "@/lib/preview-store";
import { useKey } from "@/lib/use-keyboard-shortcuts";
import { useEntities } from "@/lib/trpc-hooks";
import { useAuthStore } from "@/lib/auth-store";
import { AiCopilotDrawer } from "@/components/ai-copilot-drawer";
import { Sparkles } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { void usePreviewStore.persist.rehydrate(); }, []);

  // Active-entity selector state comes from the server's entity list (real ids).
  const { data: entities } = useEntities();
  const setAvailableEntities = useAuthStore((s) => s.setAvailableEntities);
  useEffect(() => {
    if (entities) setAvailableEntities(entities);
  }, [entities, setAvailableEntities]);

  useKey("k", () => setCommandPaletteOpen(true), true);
  useKey(",", () => setCommandPaletteOpen(true), true);
  useKey("j", () => setAiDrawerOpen((prev) => !prev), true);
  // Ctrl/Cmd+E: entity switcher (UX principle 7); never while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isSwitcherShortcut(e)) { e.preventDefault(); setSwitcherOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-body-light dark:bg-body-dark">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[140] lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <main className="flex-1 overflow-auto w-full relative">
        <TopBar
          onMenuToggle={() => setMobileMenuOpen(true)}
          onCommandPalette={() => setCommandPaletteOpen(true)}
          onAiToggle={() => setAiDrawerOpen((prev) => !prev)}
        />
        <div className="p-4 sm:p-6 lg:p-8">
          {isPreviewPath(pathname) && <PreviewBanner />}
          {children}
        </div>

        {/* Floating AI launcher badge (always accessible) */}
        <button
          onClick={() => setAiDrawerOpen(true)}
          title="Copilot Contable AI (⌘J)"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-[70] cursor-pointer"
        >
          <Sparkles className="h-5 w-5" />
          <span className="sr-only">Abrir Copilot Contable</span>
        </button>
      </main>

      <EntitySwitcher open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <AiCopilotDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />
    </div>
  );
}
