"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import {
  Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle,
  CheckCircle2, ArrowRight, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthMode = "magic" | "password";
type FormState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error";   message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Production URL — magic link emails must always redirect here.
// NEVER use window.location.origin: if the user triggers login from localhost,
// the email would contain a localhost link which is inaccessible on mobile.
const PRODUCTION_URL = "https://intelicont.vercel.app";

function getRedirectTo() {
  return `${PRODUCTION_URL}/auth/callback`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const searchParams  = useSearchParams();
  const redirectTo    = searchParams.get("redirectTo") ?? "/";
  const callbackError = searchParams.get("error");

  const [mode, setMode]           = useState<AuthMode>("magic");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [formState, setFormState] = useState<FormState>(
    callbackError ? { status: "error", message: "El enlace expiró o es inválido. Intentá de nuevo." } : { status: "idle" }
  );
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  // ── Magic link ──────────────────────────────────────────────────────────────
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setFormState({ status: "loading" });
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${getRedirectTo()}?redirectTo=${redirectTo}`,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setFormState({ status: "error", message: error.message });
      } else {
        setFormState({
          status: "success",
          message: `¡Listo! Revisá tu bandeja de entrada en ${email}. El enlace expira en 1 hora.`,
        });
      }
    });
  }

  // ── Email + password ────────────────────────────────────────────────────────
  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setFormState({ status: "loading" });
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setFormState({ status: "error", message: error.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : error.message
        });
      } else {
        // Middleware will redirect after session is set
        setFormState({ status: "success", message: "Acceso correcto, redirigiendo…" });
        window.location.href = redirectTo;
      }
    });
  }

  const isLoading = formState.status === "loading" || isPending;

  return (
    <div className="min-h-screen flex bg-radial-light dark:bg-radial-dark">

      {/* ── Left panel — brand ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[480px] sidebar-gradient flex-col justify-between p-10 relative overflow-hidden shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-secondary/10" />

        {/* Logo */}
        <div className="relative">
          <Logo size="lg" dark />
          <p className="text-white/50 text-sm mt-2 font-medium">Ecosistema Inteli* · IntelliHouse E.A.S.</p>
        </div>

        {/* Value props */}
        <div className="relative space-y-6">
          <div>
            <h2 className="text-white text-3xl font-black leading-tight">
              La contabilidad de tu estudio,<br />
              <span className="text-secondary-300">automatizada de verdad.</span>
            </h2>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              Multi-contribuyente · SIFEN nativo · IA incluida · Cumplimiento DNIT garantizado
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Plan de cuentas DNIT estándar preconfigurado",
              "Importación automática de comprobantes SIFEN",
              "Hechauka y RG90 en un clic",
              "IA que sugiere asientos con score de confianza",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-secondary-300" />
                </div>
                <span className="text-white/70 text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-white/30 text-xs">
            © 2026 IntelliHouse Soluciones E.A.S. · RUC 80144114-5
          </p>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Logo size="md" />
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Accedé a tu estudio
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {mode === "magic"
                ? "Recibí un enlace mágico en tu email — sin contraseña."
                : "Ingresá con tu email y contraseña."}
            </p>
          </div>

          {/* Mode switcher */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl mb-6">
            {([
              { key: "magic",    label: "Magic Link", icon: Sparkles },
              { key: "password", label: "Contraseña", icon: Lock     },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setMode(key); setFormState({ status: "idle" }); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                  mode === key
                    ? "bg-white dark:bg-slate-700 text-primary dark:text-primary-300 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={mode === "magic" ? handleMagicLink : handlePassword} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contador@estudio.com.py"
                  required
                  autoComplete="email"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Password (only in password mode) */}
            {mode === "password" && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:text-primary-dark font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="input-field pl-10 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Feedback messages */}
            {formState.status === "error" && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400 text-sm">{formState.message}</p>
              </div>
            )}

            {formState.status === "success" && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800/50 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <p className="text-secondary-dark dark:text-secondary-300 text-sm">{formState.message}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || formState.status === "success"}
              className={cn(
                "w-full btn-secondary py-3 text-sm justify-center",
                (isLoading || formState.status === "success") && "opacity-70 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "magic" ? "Enviando enlace…" : "Verificando…"}
                </>
              ) : formState.status === "success" && mode === "magic" ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Enlace enviado
                </>
              ) : (
                <>
                  {mode === "magic" ? "Enviar enlace mágico" : "Ingresar"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Magic link explanation */}
          {mode === "magic" && formState.status !== "success" && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
              Te enviamos un enlace seguro por email. No necesitás recordar ninguna contraseña.
              El enlace expira en 1 hora.
            </p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">o</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          </div>

          {/* Info footer */}
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              ¿Todavía no tenés cuenta?{" "}
              <a href="https://wa.me/595994516360" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-primary-300 font-semibold hover:underline">
                Contactá al estudio
              </a>
            </p>
            <p className="text-[10px] text-gray-300 dark:text-gray-600">
              IntelliHouse Soluciones E.A.S. · RUC 80144114-5 · Paraguay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
