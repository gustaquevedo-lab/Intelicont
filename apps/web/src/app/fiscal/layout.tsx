"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Calculator, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/fiscal/formulario-104", label: "Formulario 104", icon: Calculator },
  { href: "/fiscal/hechauka", label: "Hechauka", icon: FileText },
];

export default function FiscalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      {/* Sub-nav */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 flex items-center gap-1 sm:gap-2 py-1.5 overflow-x-auto">
          <Link
            href="/"
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 no-tap-highlight"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
          <span className="text-gray-300 dark:text-gray-700 mx-1">|</span>
          <span className="text-xs font-medium text-gray-900 dark:text-white shrink-0">Fiscal</span>
          {LINKS.map((link) => {
            const Icon = link.icon;
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 no-tap-highlight",
                  active
                    ? "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
