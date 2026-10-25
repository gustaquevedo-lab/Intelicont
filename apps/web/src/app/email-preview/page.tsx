"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Smartphone,
  Monitor,
  CheckCircle2,
  Sparkles,
  Shield,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { getEmailHtmlTemplatesAction, sendLiveTestEmailAction } from "./actions";

export default function EmailPreviewPage() {
  const [activeTab, setActiveTab] = useState<"welcome" | "reset" | "alert">("welcome");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [templates, setTemplates] = useState<{ welcome: string; reset: string; alert: string } | null>(null);
  const [testEmail, setTestEmail] = useState("intellihousepy@gmail.com");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    getEmailHtmlTemplatesAction().then((res) => setTemplates(res));
  }, []);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    setSending(true);
    setSendResult(null);

    const res = await sendLiveTestEmailAction({
      to: testEmail,
      template: activeTab,
    });

    setSending(false);
    if (res.success && "id" in res) {
      setSendResult({
        success: true,
        message: `¡Correo enviado exitosamente a ${testEmail}! (ID: ${res.id})`,
      });
    } else {
      setSendResult({
        success: false,
        message: ("error" in res && res.error) || "Ocurrió un error al enviar el correo con Resend.",
      });
    }
  };

  const currentHtml = templates ? templates[activeTab] : "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
            IC
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Preview & Aprobación de Emails Transaccionales
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Resend Activo
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Branding oficial InteliCont · Desarrollado por IntelliHouse Soluciones E.A.S.
            </p>
          </div>
        </div>

        {/* Live Test Sender */}
        <form onSubmit={handleSendTest} className="flex items-center gap-2">
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="tu-correo@gmail.com"
              className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? "Enviando..." : "Enviar Prueba Real"}
          </button>
        </form>
      </header>

      {/* Control Sub-bar */}
      <div className="bg-slate-900/50 border-b border-slate-800/80 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Template Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 mr-2 font-medium">Plantilla:</span>
          <button
            onClick={() => {
              setActiveTab("welcome");
              setSendResult(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "welcome"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            1. Bienvenida (14 días gratis)
          </button>
          <button
            onClick={() => {
              setActiveTab("reset");
              setSendResult(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "reset"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            2. Recuperación de Contraseña
          </button>
          <button
            onClick={() => {
              setActiveTab("alert");
              setSendResult(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "alert"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            3. Alerta Fiscal DNIT
          </button>
        </div>

        {/* Viewport switch */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setDevice("desktop")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
              device === "desktop" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Desktop
          </button>
          <button
            onClick={() => setDevice("mobile")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
              device === "mobile" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
        </div>
      </div>

      {/* Result Alert */}
      {sendResult && (
        <div
          className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
            sendResult.success
              ? "bg-emerald-950/80 text-emerald-300 border-b border-emerald-800"
              : "bg-red-950/80 text-red-300 border-b border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {sendResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{sendResult.message}</span>
          </div>
          <button onClick={() => setSendResult(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Preview Frame */}
      <main className="flex-1 p-6 flex justify-center items-start overflow-y-auto bg-slate-900/30">
        <div
          className={`transition-all duration-300 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-white ${
            device === "mobile" ? "w-[390px] h-[750px]" : "w-[680px] h-[780px]"
          }`}
        >
          {templates ? (
            <iframe
              title="Email Template Preview"
              srcDoc={currentHtml}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              Cargando vistas previas...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
