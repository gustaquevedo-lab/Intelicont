"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  FileText,
  Sparkles,
  Zap,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";

const INPUT =
  "w-full px-4 py-3 bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#104c91] focus:border-transparent transition-all shadow-sm";

/** Hard navigation so the server-side guard (root layout) runs with the new session. */
function enterApp() {
  window.location.href = "/";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError("Email o contraseña incorrectos");
      return;
    }
    if (data && "twoFactorRedirect" in data && data.twoFactorRedirect) {
      setNeedsTotp(true);
      return;
    }
    enterApp();
  };

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const trimmed = code.trim();
    const { error } = /^\d{6}$/.test(trimmed)
      ? await authClient.twoFactor.verifyTotp({ code: trimmed })
      : await authClient.twoFactor.verifyBackupCode({ code: trimmed });
    setLoading(false);
    if (error) {
      setError("Código de verificación inválido");
      return;
    }
    enterApp();
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#081528] text-slate-100 selection:bg-[#00a651] selection:text-white">
      {/* ─── Left Panel: Brand Showcase (Desktop) ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-[#071325] via-[#0b2447] to-[#104c91]/90 border-r border-white/10">
        {/* Decorative background glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#1b63c4]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-[#00a651]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-[#33c1cc]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-block transition-transform hover:scale-105 duration-300">
            <Logo size="lg" showSlogan dark />
          </Link>
        </div>

        {/* Middle: Value Prop & Key Differentiators */}
        <div className="relative z-10 space-y-8 my-auto py-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SaaS Contable AI-First para Paraguay
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Contabilidad inteligente, <br />
            <span className="bg-gradient-to-r from-blue-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
              automatizada y 100% legal.
            </span>
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-[#104c91]/80 text-white shrink-0 mt-0.5">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">SIFEN & Timbrados DNIT en tiempo real</h4>
                <p className="text-xs text-slate-300/80 leading-relaxed mt-0.5">
                  Importación automática de facturas electrónicas, validación con Marangatú REA y emisión de KuDE.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-[#104c91]/80 text-white shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Copilot Contable entrenado con Ley 6380/19</h4>
                <p className="text-xs text-slate-300/80 leading-relaxed mt-0.5">
                  Generación de asientos por partida doble con reglas fiscales paraguayas y análisis de deducibilidad.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-2 rounded-xl bg-[#104c91]/80 text-white shrink-0 mt-0.5">
                <FileText className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Libros RG 90, Formulario 104 y Balance General</h4>
                <p className="text-xs text-slate-300/80 leading-relaxed mt-0.5">
                  Exportaciones compatibles con el software de la DNIT y reportes de Estados Financieros auditables.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Trust & Security Badges */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" /> Cifrado de grado bancario
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-400" /> Multi-empresa RLS
            </span>
          </div>
          <span>v1.1.0</span>
        </div>
      </div>

      {/* ─── Right Panel: Login Form ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 relative bg-[#06101e]">
        {/* Subtle background glow on mobile/desktop right */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-[#104c91]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex flex-col items-center justify-center text-center pb-2">
            <Link href="/" className="inline-block transition-transform active:scale-95">
              <Logo size="lg" showSlogan dark />
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Top gradient highlight strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1b63c4] via-[#33c1cc] to-[#08a14b]" />

            {!needsTotp ? (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                    <Shield className="w-3.5 h-3.5" /> Acceso al Portal
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight">Iniciar Sesión</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingresá tus credenciales para acceder a tus empresas y libros contables.
                  </p>
                </div>

                {/* Email input */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@tuempresa.com.py"
                      autoFocus
                      className={`${INPUT} pl-10`}
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Contraseña
                    </label>
                    <Link
                      href="/olvide-password"
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className={`${INPUT} pl-10 pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                      aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#104c91] via-[#1561e1] to-[#0d3d75] hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Iniciando sesión...
                    </span>
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Registration link */}
                <div className="pt-4 mt-2 border-t border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">
                    ¿Todavía no tenés cuenta en InteliCont?{" "}
                    <Link
                      href="/registro"
                      className="inline-block font-bold text-emerald-400 hover:text-emerald-300 transition-colors ml-1"
                    >
                      Empezá gratis 14 días →
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleTotp} className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                    <Shield className="w-3.5 h-3.5" /> Seguridad Adicional
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Verificación en dos pasos</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingresá el código temporal de 6 dígitos generado por tu aplicación autenticadora.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="totp" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Código de 6 dígitos
                  </label>
                  <input
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="000000"
                    autoFocus
                    className={`${INPUT} text-center tracking-widest text-lg font-mono font-bold`}
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#104c91] to-[#00a651] hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Verificando..." : "Verificar y Continuar"}
                  <Shield className="h-4 w-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setNeedsTotp(false)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ← Volver a inicio de sesión
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* System Footer Info */}
          <div className="text-center text-[11px] text-slate-500 space-y-1">
            <p>InteliCont ERP & Fiscal · Pedro Juan Caballero, Paraguay</p>
            <p>Conforme a la Ley N° 6380/19 y RG N° 90/21 de la DNIT</p>
          </div>
        </div>
      </div>
    </div>
  );
}
