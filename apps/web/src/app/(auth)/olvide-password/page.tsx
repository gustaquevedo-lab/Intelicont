"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { solicitarRecuperacionAction } from "./actions";

import { Logo } from "@/components/logo";

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await solicitarRecuperacionAction(email);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error || "Ocurrió un error.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#081528] text-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <Link href="/login" className="inline-block transition-transform hover:scale-105">
            <Logo size="lg" showSlogan dark />
          </Link>
          <p className="text-xs text-slate-400 font-medium">
            Recuperá el acceso a tu estudio contable
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1b63c4] via-[#33c1cc] to-[#08a14b]" />
          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Correo enviado</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Si tu correo <strong>{email}</strong> está registrado, recibirás un enlace seguro para restablecer tu contraseña.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a Iniciar Sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">¿Olvidaste tu contraseña?</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ingresá tu correo electrónico registrado y te enviaremos las instrucciones de recuperación.
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contador@estudio.com.py"
                    className="w-full px-4 py-2.5 pl-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/20"
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
