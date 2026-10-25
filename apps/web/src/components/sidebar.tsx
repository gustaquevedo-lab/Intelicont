"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { X, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { visibleNavGroups } from "@/lib/nav-config";
import { usePreviewStore } from "@/lib/preview-store";
import { useCurrentUser } from "@/lib/auth-store";
import { DEFAULT_SUPERADMIN_EMAILS } from "@/lib/superadmin-constants";
import { api } from "@/trpc/client";
import { Logo } from "./logo";

export function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const showPreview = usePreviewStore((s) => s.showPreview);
  const { user, logout } = useCurrentUser();

  const checkAccessQuery = api.superadmin.checkAccess.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });

  const isSuperadmin =
    checkAccessQuery.data?.isSuperadmin ??
    Boolean(
      user?.email &&
      DEFAULT_SUPERADMIN_EMAILS.includes(user.email.toLowerCase().trim())
    );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <Logo size={collapsed ? "sm" : "md"} showSlogan={!collapsed} dark={true} />
        <button
          onClick={onMobileClose}
          className="lg:hidden p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-6">
        {/* SuperAdmin Panel Section if authorized */}
        {isSuperadmin && (
          <div className="pb-2 border-b border-amber-400/20">
            {!collapsed && (
              <h3 className="px-4 text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                <Shield size={12} className="text-amber-400" />
                Superadministrador
              </h3>
            )}
            <div className="space-y-1.5">
              <Link
                href="/superadmin"
                onClick={() => onMobileClose?.()}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-[13px] font-bold border",
                  pathname === "/superadmin"
                    ? "bg-amber-400 text-gray-950 shadow-xl shadow-amber-400/20 scale-[1.02] border-amber-300"
                    : "bg-amber-400/10 text-amber-300 border-amber-400/20 hover:bg-amber-400/20 hover:text-white"
                )}
              >
                <div className="shrink-0">
                  <Shield size={18} className={pathname === "/superadmin" ? "text-gray-950" : "text-amber-400"} />
                </div>
                {!collapsed && (
                  <span className="truncate">Consola Superadmin</span>
                )}
                {!collapsed && (
                  <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 font-black uppercase tracking-widest">
                    Root
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}

        {visibleNavGroups(showPreview).map((group, groupIdx) => (
          <div key={groupIdx}>
            {!collapsed && (
              <h3 className="px-4 text-[10px] font-black text-blue-300/40 uppercase tracking-[0.2em] mb-4">
                {group.title}
              </h3>
            )}
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => onMobileClose?.()}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-[13px] font-bold",
                      isActive
                        ? "bg-white text-primary shadow-xl shadow-black/20 scale-[1.02]"
                        : "text-blue-100/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="shrink-0">
                      <Icon size={18} />
                    </div>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!collapsed && item.preview && (
                      <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-300/20 font-black uppercase tracking-widest">
                        Vista previa
                      </span>
                    )}
                    {!collapsed && item.highlight && (
                      <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-secondary-light border border-white/10 font-black uppercase tracking-widest">
                        IA
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/5 space-y-4">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2">
            <div className={cn(
              "w-10 h-10 rounded-2xl border flex items-center justify-center font-black text-sm overflow-hidden shrink-0 shadow-inner",
              isSuperadmin
                ? "bg-amber-400/20 border-amber-400/30 text-amber-300"
                : "bg-white/10 border-white/10 text-white"
            )}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "IC"}
            </div>
            <div className="text-sm flex-1 min-w-0">
              <p className="font-black text-white leading-tight truncate">
                {user?.name || "Usuario"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isSuperadmin ? (
                  <span className="text-[9px] font-black text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded border border-amber-400/30 uppercase tracking-widest">
                    SuperAdmin
                  </span>
                ) : (
                  <p className="text-[10px] font-bold text-blue-200/50 truncate uppercase tracking-widest">
                    {user?.email || "Administrador"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          title="Cerrar Sesión"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await logout();
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-blue-200/50 hover:text-white hover:bg-white/10 active:scale-95 transition-all border border-white/5 cursor-pointer"
        >
          <LogOut size={14} />
          {!collapsed && "Cerrar Sesión"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col sidebar-gradient text-white shadow-2xl transition-all duration-300 ease-in-out relative",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[150] w-64 sidebar-gradient text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
