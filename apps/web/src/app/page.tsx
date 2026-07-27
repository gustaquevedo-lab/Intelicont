"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import {
  Sparkles, CheckCircle2, Shield, ArrowRight, Zap,
  BarChart3, Brain, FileText, Check, Star, HelpCircle
} from "lucide-react";

export default function LandingPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const pricingPlans = [
    {
      name: "Starter",
      price: "180.000",
      desc: "Ideal para profesionales independientes y microempresas.",
      features: [
        "Ingesta de 50 XMLs/mes",
        "Triple Imputación Inteligente (IA)",
        "Libro IVA Compras y Ventas",
        "Exportación RG90 (Form. 955/956)",
        "Soporte por Email"
      ],
      popular: false,
      cta: "Comenzar Starter"
    },
    {
      name: "Pro",
      price: "385.000",
      desc: "El plan definitivo para estudios contables y PYMEs en crecimiento.",
      features: [
        "Ingesta de 300 XMLs/mes",
        "Todo lo de Starter",
        "Formularios 120 (IVA) y 500 (IRE)",
        "Cruce automatizado SIFEN vs Libros",
        "Conciliación Bancaria Inteligente",
        "Soporte Prioritario WhatsApp"
      ],
      popular: true,
      cta: "Comenzar Pro"
    },
    {
      name: "InHouse / ESFL",
      price: "440.000",
      desc: "Especializado para ONGs, fundaciones y contabilidad corporativa.",
      features: [
        "Ingesta Ilimitada",
        "Módulo ESFL / Rendición de Convenios",
        "Generador de Reportes CGR (Contraloría)",
        "Control de Cuentas por Cobrar/Pagar",
        "Gestión de Caja Chica y Viáticos",
        "Integración Multimoneda / Cotizaciones BCP"
      ],
      popular: false,
      cta: "Comenzar InHouse"
    },
    {
      name: "Enterprise",
      price: "650.000",
      desc: "Para grandes contribuyentes y corporaciones multinacionales.",
      features: [
        "Infraestructura Dedicada",
        "Todo lo de InHouse/ESFL",
        "API abierta para ERPs",
        "Módulo de Activos Fijos Completo",
        "SLA de disponibilidad 99.9%",
        "Account Manager Dedicado"
      ],
      popular: false,
      cta: "Contactar Ventas"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary selection:text-white overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      {/* Navigation */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white uppercase">InteliCont</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#ia" className="hover:text-white transition-colors">Inteligencia Artificial</a>
            <a href="#pricing" className="hover:text-white transition-colors">Planes</a>
            <a href="#faq" className="hover:text-white transition-colors">Preguntas</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all text-sm"
              >
                Ir al Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-all">
                  Ingresar
                </Link>
                <Link
                  href="/login?signup=true"
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-sm"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6">
          <Brain className="h-3 w-3" />
          <span>Contabilidad con Inteligencia Artificial</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none max-w-5xl mx-auto">
          El primer Software Contable <br />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Totalmente Autónomo
          </span>{" "}
          en Paraguay
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-medium">
          Importá tus XMLs de SIFEN y dejá que nuestra IA realice la clasificación contable e imputación tributaria de forma inmediata. Diseñado para contadores y ESFLs exigentes.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-black rounded-xl shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-2 group text-base"
          >
            <span>{user ? "Ir al Dashboard Contable" : "Probar Gratis 7 días"}</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#pricing"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-black rounded-xl transition-all text-base"
          >
            Ver Planes de Precios
          </a>
        </div>

        {/* Feature Grid */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-left hover:border-primary/20 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Triple Imputación IA</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Clasifica cuentas contables del libro diario, imputación del IVA y del IRE simultáneamente analizando el concepto de cada XML de forma inteligente.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-left hover:border-secondary/20 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">RG90 en un Clic</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Cruce automatizado entre tus libros contables y lo registrado en la DNIT (SIFEN). Exporta los layouts oficiales 955 y 956 listos para Marangatú.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-left hover:border-amber-500/20 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Módulo ESFL / Convenios</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Estructura de convenios de donación, rendiciones de cuentas por proyecto y generación del reporte unificado de la Contraloría General (CGR).
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 border-t border-slate-900 bg-slate-950 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-white tracking-tight">Planes de Suscripción</h2>
            <p className="mt-4 text-slate-400 font-medium">
              Elegí el plan ideal para tu estudio contable, empresa u ONG. Sin contratos a largo plazo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((p, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-8 flex flex-col justify-between ${
                  p.popular
                    ? "bg-slate-900 border-2 border-primary shadow-2xl shadow-primary/10"
                    : "bg-slate-900/40 border border-slate-800"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 right-8 px-3 py-1 bg-primary text-white text-[10px] font-black uppercase rounded-full tracking-widest shadow-md">
                    Recomendado
                  </span>
                )}
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">{p.name}</h3>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-sm text-slate-400 font-semibold">Gs.</span>
                    <span className="text-4xl font-black text-white tracking-tight">{p.price}</span>
                    <span className="text-slate-500 font-medium text-xs">/ mes</span>
                  </div>
                  <p className="mt-4 text-xs text-slate-400 leading-relaxed font-semibold">{p.desc}</p>

                  <ul className="mt-8 space-y-4">
                    {p.features.map((f, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={user ? "/dashboard" : "/login"}
                  className={`mt-10 w-full py-3 rounded-xl font-bold text-center text-sm transition-all ${
                    p.popular
                      ? "bg-gradient-to-r from-primary to-secondary text-white hover:scale-[1.02] shadow-lg shadow-primary/20"
                      : "bg-slate-850 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 relative z-10 text-center text-xs text-slate-600 font-semibold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-black text-slate-300 uppercase tracking-widest text-[10px]">InteliCont Paraguay</span>
          </div>
          <p>© 2026 InteliCont. Todos los derechos reservados. Conforme a las normativas de la DNIT / SET.</p>
        </div>
      </footer>
    </div>
  );
}
