"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const INPUT =
  "w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50";
const BUTTON =
  "w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50";

/** Mandatory TOTP enrollment (admins are sent here by the root-layout guard). */
export default function TwoFactorSetupPage() {
  const [password, setPassword] = useState("");
  const [setup, setSetup] = useState<{ totpURI: string; backupCodes: string[] } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error } = await authClient.twoFactor.enable({ password, method: "totp" });
    setLoading(false);
    if (error || !data || data.method !== "totp") {
      setError("Contraseña incorrecta");
      return;
    }
    setSetup({ totpURI: data.totpURI, backupCodes: data.backupCodes });
    setPassword("");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code: code.trim() });
    setLoading(false);
    if (error) {
      setError("Código inválido, probá de nuevo");
      return;
    }
    window.location.href = "/";
  };

  const secret = setup ? new URL(setup.totpURI).searchParams.get("secret") : null;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Configurar verificación en dos pasos</h1>
        </div>

        {!setup ? (
          <form onSubmit={start} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tu cuenta administra empresas: la verificación en dos pasos (TOTP) es obligatoria. Confirmá tu contraseña
              para empezar.
            </p>
            <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT}
            />
            {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className={BUTTON}>
              Continuar
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <ol className="text-sm text-gray-600 dark:text-gray-400 list-decimal pl-5 space-y-2">
              <li>
                En tu app autenticadora agregá una cuenta con esta clave (o abrí{" "}
                <a href={setup.totpURI} className="text-blue-600 underline">este enlace</a> en el celular):
                <code className="block mt-1 p-2 rounded bg-gray-100 dark:bg-gray-800 break-all font-mono text-xs" data-testid="totp-secret">
                  {secret}
                </code>
              </li>
              <li>
                Guardá estos códigos de respaldo en un lugar seguro. <strong>No se vuelven a mostrar.</strong>
                <ul className="mt-1 grid grid-cols-2 gap-1 font-mono text-xs">
                  {setup.backupCodes.map((c) => (
                    <li key={c} className="p-1 rounded bg-gray-100 dark:bg-gray-800">{c}</li>
                  ))}
                </ul>
              </li>
              <li>Ingresá el código de 6 dígitos que muestra la app.</li>
            </ol>
            <input
              aria-label="Código"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className={`${INPUT} text-center tracking-widest`}
            />
            {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className={BUTTON}>
              Activar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
