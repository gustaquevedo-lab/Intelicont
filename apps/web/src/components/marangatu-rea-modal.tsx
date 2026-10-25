"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/trpc/client";

interface Props {
  entityId: string;
  entityRuc?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncSuccess?: () => void;
  initialCookie?: string;
}

export default function MarangatuReaModal({
  entityId,
  entityRuc,
  open,
  onOpenChange,
  onSyncSuccess,
  initialCookie = "",
}: Props) {
  const [cookie, setCookie] = useState(initialCookie);
  const [copied, setCopied] = useState(false);
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
  const [tipo, setTipo] = useState<"ambos" | "compras" | "ventas">("ambos");
  const [verificando, setVerificando] = useState(false);
  const [sesionInfo, setSesionInfo] = useState<{
    valido: boolean;
    ruc?: string;
    nombre?: string;
    error?: string;
  } | null>(null);

  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState<{
    total: number;
    compras: number;
    ventas: number;
    duplicados: number;
    nuevos: number;
    cdcsValidados: number;
  } | null>(null);
  const [syncError, setSyncError] = useState("");

  const verificarMutation = api["tax-documents"].verificarMarangatu.useMutation();
  const syncMutation = api["tax-documents"].syncMarangatu.useMutation();

  useEffect(() => {
    if (initialCookie && open) {
      setCookie(initialCookie);
      handleVerificar(initialCookie);
    }
  }, [initialCookie, open]);

  const bookmarkletCode = `javascript:(function(){const c=document.cookie;if(!window.location.hostname.includes('marangatu')){alert('Por favor abrí este marcador dentro del portal Marangatú (marangatu.dnit.gov.py)');return;}const u=window.location.origin.includes('localhost')?'http://localhost:3000':'https://app.intelicont.com.py';const target=u+'/sifen?sync_cookie='+encodeURIComponent(c)+'&entityId=${entityId}';if(confirm('Sesión Marangatú detectada. ¿Sincronizar comprobantes con InteliCont?')){window.open(target,'_blank');}})();`;

  const handleCopiarBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleVerificar = async (cookieToVerify = cookie) => {
    if (!cookieToVerify.trim()) return;
    setVerificando(true);
    setSesionInfo(null);
    setSyncError("");
    try {
      const res = await verificarMutation.mutateAsync({ cookie: cookieToVerify.trim() });
      setSesionInfo(res);
    } catch (e: any) {
      setSesionInfo({
        valido: false,
        error: e.message || "Error al conectar con Marangatú",
      });
    } finally {
      setVerificando(false);
    }
  };

  const handleSincronizar = async () => {
    if (!cookie.trim()) return;
    setSincronizando(true);
    setSyncError("");
    setResultado(null);
    try {
      const res = await syncMutation.mutateAsync({
        entityId,
        cookie: cookie.trim(),
        periodo,
        tipo,
      });
      setResultado(res);
      onSyncSuccess?.();
    } catch (e: any) {
      setSyncError(e.message || "Error al sincronizar con Marangatú");
    } finally {
      setSincronizando(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Sincronizador Directo Marangatú
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                  Protocolo REA
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Descarga comprobantes de compras y ventas de la DNIT en ~300ms
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sección 1: Bookmarklet 1-Clic */}
        <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Opción A: Conector Bookmarklet (Recomendado)
            </span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">1-Clic</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Arrastrá este botón a tu barra de marcadores del navegador. Cuando estés en{" "}
            <strong className="text-gray-900 dark:text-white">marangatu.dnit.gov.py</strong>, hacé clic en él para
            enviar la sesión a InteliCont al instante.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={bookmarkletCode}
              onClick={(e) => {
                e.preventDefault();
                alert("Arrastrá este botón a tu barra de marcadores del navegador (Ctrl+Shift+B / Cmd+Shift+B).");
              }}
              draggable
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md cursor-grab active:cursor-grabbing transition-transform active:scale-95"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              ⚡ Sincronizar con InteliCont
            </a>
            <button
              type="button"
              onClick={handleCopiarBookmarklet}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar código"}
            </button>
            <a
              href="https://marangatu.dnit.gov.py"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Abrir Marangatú <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Sección 2: Conexión Directa */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Opción B: Pegar Cookie de Sesión (JSESSIONID)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="Pegar JSESSIONID=..."
                className="flex-1 px-3.5 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <button
                type="button"
                onClick={() => handleVerificar()}
                disabled={verificando || !cookie.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {verificando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Verificar
              </button>
            </div>
          </div>

          {/* Estado de verificación */}
          {sesionInfo && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                sesionInfo.valido
                  ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-800/40 dark:text-green-300"
                  : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-800/40 dark:text-red-300"
              }`}
            >
              {sesionInfo.valido ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                {sesionInfo.valido ? (
                  <>
                    <p className="font-semibold">Sesión activa verificada en Marangatú</p>
                    <p className="text-[11px] opacity-90">
                      RUC: {sesionInfo.ruc} · {sesionInfo.nombre}
                    </p>
                    {entityRuc && sesionInfo.ruc && !sesionInfo.ruc.includes(entityRuc.split("-")[0]) && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-bold mt-1">
                        ⚠️ Advertencia: El RUC logueado ({sesionInfo.ruc}) difiere de la empresa activa ({entityRuc}).
                      </p>
                    )}
                  </>
                ) : (
                  <p className="font-medium">{sesionInfo.error || "Sesión inválida o expirada"}</p>
                )}
              </div>
            </div>
          )}

          {/* Parámetros de Sincronización */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Período Fiscal
              </label>
              <input
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tipo de Comprobantes
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="ambos">Ambos (Compras y Ventas)</option>
                <option value="compras">Solo Compras</option>
                <option value="ventas">Solo Ventas</option>
              </select>
            </div>
          </div>

          {/* Resultado de la Sincronización */}
          {resultado && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-green-900 dark:text-green-300">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                Sincronización completada exitosamente
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-2">
                <div className="p-2 rounded-lg bg-white/80 dark:bg-gray-900/50">
                  <div className="text-base font-bold text-gray-900 dark:text-white">{resultado.total}</div>
                  <div className="text-[10px] text-gray-500">Total</div>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-gray-900/50">
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">{resultado.compras}</div>
                  <div className="text-[10px] text-gray-500">Compras</div>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-gray-900/50">
                  <div className="text-base font-bold text-indigo-600 dark:text-indigo-400">{resultado.ventas}</div>
                  <div className="text-[10px] text-gray-500">Ventas</div>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-gray-900/50">
                  <div className="text-base font-bold text-green-600 dark:text-green-400">{resultado.nuevos}</div>
                  <div className="text-[10px] text-gray-500">Nuevos</div>
                </div>
              </div>
            </div>
          )}

          {syncError && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-200 dark:border-red-800/40">
              {syncError}
            </p>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {resultado ? "Cerrar" : "Cancelar"}
            </button>
            <button
              type="button"
              onClick={handleSincronizar}
              disabled={sincronizando || !cookie.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {sincronizando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sincronizando con DNIT...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-amber-300 fill-amber-300" />
                  Sincronizar Comprobantes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
