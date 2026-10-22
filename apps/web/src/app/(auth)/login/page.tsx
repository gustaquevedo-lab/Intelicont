"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Sparkles, Shield } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const { login, verifyOtp, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Ingresa un email válido");
      return;
    }
    await login(email);
    setSent(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (token.length < 4) {
      setError("El código debe tener al menos 4 caracteres");
      return;
    }
    await verifyOtp(email, token);
    router.push("/");
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">InteliCont</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Contabilidad inteligente para Paraguay
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          {!sent ? (
            <form onSubmit={handleSendLink} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Iniciar Sesión
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Te enviaremos un enlace mágico a tu email
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contador@estudio.com.py"
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 no-tap-highlight"
              >
                {isLoading ? "Enviando..." : "Enviar Enlace Mágico"}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                MVP — Cualquier email funciona en modo demo
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Verificar Código
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Revisa tu email ({email}) e ingresa el código
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="123456"
                  autoFocus
                  maxLength={6}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white text-center tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 no-tap-highlight"
              >
                {isLoading ? "Verificando..." : "Ingresar"}
                <Shield className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => { setSent(false); setToken(""); }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 no-tap-highlight"
              >
                ← Volver y usar otro email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
