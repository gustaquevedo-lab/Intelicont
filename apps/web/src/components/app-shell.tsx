"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { CommandPalette } from "@/components/command-palette";
import { useKey } from "@/lib/use-keyboard-shortcuts";
import { useEntities } from "@/lib/trpc-hooks";
import { useAuthStore } from "@/lib/auth-store";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Active-entity selector state comes from the server's entity list (real ids).
  const { data: entities } = useEntities();
  const setAvailableEntities = useAuthStore((s) => s.setAvailableEntities);
  useEffect(() => {
    if (entities) setAvailableEntities(entities);
  }, [entities, setAvailableEntities]);

  useKey("k", () => setCommandPaletteOpen(true), true);
  useKey(",", () => setCommandPaletteOpen(true), true);

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
      <main className="flex-1 overflow-auto w-full">
        <TopBar
          onMenuToggle={() => setMobileMenuOpen(true)}
          onCommandPalette={() => setCommandPaletteOpen(true)}
        />
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
