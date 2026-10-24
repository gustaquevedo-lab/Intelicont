"use client";

import { useState } from "react";
import { Mail, Lock, ArrowRight, Sparkles, Shield } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const INPUT =
  "w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight";
const BUTTON =
  "w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 no-tap-highlight";

/** Hard navigation so the server-side guard (root layout) runs with the new session. */
function enterApp() {
  window.location.href = "/";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    // 6 digits = authenticator code; anything else is treated as a backup code.
    const { error } = /^\d{6}$/.test(trimmed)
      ? await authClient.twoFactor.verifyTotp({ code: trimmed })
      : await authClient.twoFactor.verifyBackupCode({ code: trimmed });
    setLoading(false);
    if (error) {
      setError("Código inválido");
      return;
    }
    enterApp();
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
          <p className="text-sm text-gray-500 dark:text-gray-400">Contabilidad inteligente para Paraguay</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          {!needsTotp ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Iniciar Sesión</h2>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contador@estudio.com.py"
                    autoFocus
                    className={`${INPUT} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${INPUT} pl-10`}
                  />
                </div>
              </div>

              {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

              <button type="submit" disabled={loading} className={BUTTON}>
                {loading ? "Ingresando..." : "Ingresar"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotp} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Verificación en dos pasos</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ingresá el código de 6 dígitos de tu app autenticadora o un código de respaldo.
                </p>
              </div>

              <div>
                <label htmlFor="totp" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Código
                </label>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  autoFocus
                  className={`${INPUT} text-center tracking-widest`}
                />
              </div>

              {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

              <button type="submit" disabled={loading} className={BUTTON}>
                {loading ? "Verificando..." : "Verificar"}
                <Shield className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
