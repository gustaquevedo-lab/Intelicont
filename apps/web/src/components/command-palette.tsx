"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ArrowRight,
  LayoutDashboard,
  Building2,
  FileText,
  BookOpen,
  Users,
  Settings,
  Calculator,
  Calendar,
  FileCode,
  CreditCard,
  BarChart3,
  Plus,
  RotateCcw,
  Download,
  Moon,
  Sun,
  Monitor,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CommandGroup = {
  label: string;
  items: CommandItem[];
};

type CommandItem = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  FileText,
  BookOpen,
  Users,
  Settings,
  Calculator,
  Calendar,
  FileCode,
  CreditCard,
  BarChart3,
  Plus,
  RotateCcw,
  Download,
  Moon,
  Sun,
  Monitor,
  Hash,
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<CommandGroup[]>(() => {
    const navigate = (href: string) => {
      router.push(href);
      onClose();
    };

    return [
      {
        label: "Navegación",
        items: [
          { id: "dashboard", label: "Panel General", icon: iconMap.LayoutDashboard, shortcut: "G D", action: () => navigate("/"), keywords: ["inicio", "home", "dashboard"] },
          { id: "sifen", label: "Carga SIFEN", icon: iconMap.FileCode, action: () => navigate("/sifen"), keywords: ["factura", "electrónica", "cargar", "xml"] },
          { id: "sifen-historial", label: "Historial SIFEN", icon: iconMap.FileCode, action: () => navigate("/sifen/historial"), keywords: ["factura", "historial", "documentos"] },
          { id: "empresas", label: "Empresas", icon: iconMap.Building2, shortcut: "G E", action: () => navigate("/empresas"), keywords: ["compañía", "entidad"] },
          { id: "asientos", label: "Asientos Contables", icon: iconMap.FileText, shortcut: "G A", action: () => navigate("/asientos"), keywords: ["journal", "entrada", "ledger"] },
          { id: "cuentas", label: "Plan de Cuentas", icon: iconMap.Hash, shortcut: "G C", action: () => navigate("/cuentas"), keywords: ["cuenta", "chart", "árbol", "estructura"] },
          { id: "libros", label: "Libros", icon: iconMap.BookOpen, action: () => navigate("/libros"), keywords: ["diario", "mayor", "iva"] },
          { id: "terceros", label: "Clientes / Proveedores", icon: iconMap.Users, action: () => navigate("/terceros"), keywords: ["partner", "contacto", "persona"] },
          { id: "banco", label: "Conciliación Bancaria", icon: iconMap.CreditCard, action: () => navigate("/banco"), keywords: ["banco", "movimientos", "conciliar"] },
          { id: "calendario", label: "Calendario Fiscal", icon: iconMap.Calendar, action: () => navigate("/calendario"), keywords: ["vencimiento", "fecha", "obligación"] },
          { id: "impuestos", label: "Impuestos", icon: iconMap.Calculator, action: () => navigate("/impuestos"), keywords: ["iva", "ire", "retención"] },
          { id: "reportes", label: "Reportes", icon: iconMap.BarChart3, action: () => navigate("/reportes"), keywords: ["informe", "estadística"] },
          { id: "config", label: "Configuración", icon: iconMap.Settings, shortcut: ",", action: () => navigate("/configuracion"), keywords: ["settings", "tema", "preferencias"] },
        ],
      },
      {
        label: "Acciones rápidas",
        items: [
          { id: "new-asiento", label: "Nuevo Asiento", icon: iconMap.Plus, shortcut: "N", action: () => { router.push("/asientos/nuevo"); onClose(); }, keywords: ["crear", "entrada", "journal"] },
          { id: "new-empresa", label: "Nueva Empresa", icon: iconMap.Plus, action: () => { router.push("/empresas/nueva"); onClose(); }, keywords: ["crear", "compañía"] },
          { id: "export-asientos", label: "Exportar Asientos", icon: iconMap.Download, action: () => { router.push("/asientos"); onClose(); }, keywords: ["descargar", "csv", "excel"] },
        ],
      },
      {
        label: "Tema",
        items: [
          { id: "theme-light", label: "Modo Claro", icon: iconMap.Sun, action: () => { document.documentElement.classList.remove("dark"); localStorage.setItem("theme", "light"); onClose(); } },
          { id: "theme-dark", label: "Modo Oscuro", icon: iconMap.Moon, action: () => { document.documentElement.classList.add("dark"); localStorage.setItem("theme", "dark"); onClose(); } },
          { id: "theme-auto", label: "Automático", icon: iconMap.Monitor, action: () => { localStorage.setItem("theme", "auto"); const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches; document.documentElement.classList.toggle("dark", prefersDark); onClose(); } },
        ],
      },
    ];
  }, [router, onClose]);

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return commands;

    const q = query.toLowerCase();
    return commands
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.keywords?.some((kw) => kw.toLowerCase().includes(q))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [commands, query]);

  const flatItems = useMemo(() => filteredGroups.flatMap((g) => g.items), [filteredGroups]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const executeAction = useCallback(
    (item: CommandItem) => {
      item.action();
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          executeAction(flatItems[selectedIndex]);
        }
      }
    },
    [flatItems, selectedIndex, executeAction, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg glass-card rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 premium-shadow">
        {/* Search Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="¿Qué necesitás hacer hoy?..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none font-medium"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors no-tap-highlight"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2" onKeyDown={handleKeyDown}>
          {flatItems.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron resultados</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Probá con otros términos</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.label} className="mb-2 last:mb-0">
                <div className="px-2 py-1.5 text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const globalIndex = flatItems.findIndex((i) => i.id === item.id);
                  return (
                    <button
                      key={item.id}
                      data-index={globalIndex}
                      onClick={() => executeAction(item)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors no-tap-highlight",
                        globalIndex === selectedIndex
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      )}
                    >
                      {item.icon && <item.icon className={cn("h-4 w-4 shrink-0 transition-transform", globalIndex === selectedIndex ? "text-white scale-110" : "text-gray-400")} />}
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.shortcut && (
                          <div className="flex items-center gap-1">
                            {item.shortcut.split(" ").map((key) => (
                              <kbd
                                key={key}
                                className={cn(
                                  "px-1.5 py-0.5 text-[10px] font-mono rounded border",
                                  globalIndex === selectedIndex
                                    ? "text-blue-400 border-blue-200 dark:border-blue-500/30 bg-blue-100 dark:bg-blue-500/10"
                                    : "text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                                )}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                        {globalIndex === selectedIndex && <ArrowRight className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">↵</kbd> seleccionar
          </span>
        </div>
      </div>
    </div>
  );
}
