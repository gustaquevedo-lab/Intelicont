"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Zap, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
  feature: "sifen" | "brainAi" | "bankApi" | "multiUser";
  children: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureGate({ feature, children, title, description }: FeatureGateProps) {
  const { selectedEntity } = useAuthStore();

  const isEnabled = selectedEntity?.features?.[feature] ?? true;

  if (isEnabled) {
    return <>{children}</>;
  }

  const featureLabels = {
    sifen: "Módulo de Facturación Electrónica SIFEN (DNIT)",
    brainAi: "Auditor Inteligente Brain AI™ (Gemini Engine)",
    bankApi: "Conciliación Bancaria y Conexión de Cuentas Nativas",
    multiUser: "Multi-usuario y Colaboración en Tiempo Real",
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-white dark:bg-gray-900/60 border border-red-200/60 dark:border-red-950/40 rounded-3xl p-6 lg:p-8 text-center relative overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#104c91]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#00a651]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6 shadow-md border border-red-100 dark:border-red-900/30 relative">
          <Lock className="h-7 w-7" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00a651] rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
        </div>

        {/* Labels */}
        <div className="space-y-2 mb-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#104c91] dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
            Función Desactivada por Plan
          </span>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mt-3 leading-tight">{title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
            El tenant <strong className="text-gray-900 dark:text-white">{selectedEntity?.legalName}</strong> no tiene habilitado {featureLabels[feature]}.
          </p>
        </div>

        {/* Visual Plan Comparison card */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-2xl text-left text-xs mb-6 space-y-2">
          <p className="font-bold text-gray-700 dark:text-gray-300">Plan Actual: <span className="text-[#104c91] dark:text-blue-400 capitalize">{selectedEntity?.plan || "Starter"}</span></p>
          <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <Link
            href="/superadmin"
            className="w-full py-3 bg-[#104c91] hover:bg-[#0d3d75] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.01]"
          >
            <Zap className="h-3.5 w-3.5 text-yellow-400" /> Ir a Consola Superadmin (Activar)
          </Link>
          
          <Link
            href="/"
            className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
