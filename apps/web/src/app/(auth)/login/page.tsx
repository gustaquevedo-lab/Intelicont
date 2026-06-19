"use client";

import { useState } from "react";
import { Mail, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { signInWithMagicLink } from "@/lib/auth-actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Ingresa un email válido");
      return;
    }

    setIsLoading(true);
    const result = await signInWithMagicLink(email);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Error al enviar el enlace");
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm">
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
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Revisa tu email
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Te enviamos un enlace mágico a <strong>{email}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Hacé clic en el enlace para iniciar sesión automáticamente
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setSent(false); setError(""); }}
                className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 no-tap-highlight"
              >
                ← Usar otro email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
