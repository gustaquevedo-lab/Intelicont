"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Building2,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { registerTenantAction } from "./actions";
import { authClient } from "@/lib/auth-client";

import { Logo } from "@/components/logo";

export default function RegistroPage() {
  const [ruc, setRuc] = useState("");
  const [legalName, setLegalName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await registerTenantAction({
      ruc,
      legalName,
      adminName: adminName.trim() || undefined,
      adminEmail: email,
      password,
    });

    if (!res.success) {
      setLoading(false);
      setError(res.error || "No se pudo registrar la cuenta.");
      return;
    }

    // Intento de inicio de sesión automático
    try {
      const signInRes = await authClient.signIn.email({ email, password });
      if (signInRes.data && !signInRes.error) {
        window.location.href = "/";
        return;
      }
    } catch {
      // Ignorar error de cliente y mostrar pantalla de confirmación
    }

    setLoading(false);
    setRegistered(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#081528] text-slate-100 p-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <Logo size="lg" showSlogan dark />
          </Link>
          <p className="text-xs text-slate-400 font-medium">
            Empezá gratis 14 días · Sin tarjeta de crédito
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1b63c4] via-[#33c1cc] to-[#08a14b]" />
          {registered ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  ¡Cuenta creada exitosamente!
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Bienvenido a InteliCont. Tu estudio <strong>{legalName}</strong> (RUC: {ruc}) está listo para operar con el Plan Starter de 14 días gratis.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors mt-2"
              >
                Ingresar al Sistema
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Alta de Estudio / Empresa
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Activación instantánea y segura
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  14 Días Gratis
                </span>
              </div>

              {/* RUC */}
              <div>
                <label
                  htmlFor="ruc"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  RUC de la Empresa / Estudio *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="ruc"
                    type="text"
                    required
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    placeholder="80012345-0"
                    className="w-full px-4 py-2.5 pl-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {/* Legal Name */}
              <div>
                <label
                  htmlFor="legalName"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Razón Social o Nombre Legal *
                </label>
                <input
                  id="legalName"
                  type="text"
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Estudio Contable & Asociados"
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Admin Name */}
              <div>
                <label
                  htmlFor="adminName"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nombre del Titular / Administrador
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="adminName"
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Lic. María Fernández"
                    className="w-full px-4 py-2.5 pl-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Correo Electrónico (Usuario de Acceso) *
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
                    placeholder="contacto@estudio.com.py"
                    className="w-full px-4 py-2.5 pl-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Contraseña (mínimo 8 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pl-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/20"
              >
                {loading ? "Creando cuenta..." : "Crear mi cuenta gratis"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ¿Ya tenés una cuenta registrada?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Iniciar Sesión
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
