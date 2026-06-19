"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileCode,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Calendar,
  Receipt,
  CreditCard,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseSifenXML, suggestJournalEntry, SifenInvoice } from "@/lib/sifen-parser";
import { createAsiento } from "@/lib/actions";
import { useUploadSifenXml, useApproveTaxDocument, useOpenPeriod } from "@/hooks/use-data";
import { useEntity } from "@/hooks/use-entity";
import { useUser } from "@/hooks/use-user";

type Step = "upload" | "review" | "success";

export default function SifenPage() {
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);
  const entityId = selectedEntity?.id ?? null;
  const { data: openPeriod } = useOpenPeriod(entityId);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [invoiceData, setInvoiceData] = useState<{
    parsed: SifenInvoice;
    suggestion: ReturnType<typeof suggestJournalEntry>;
    documentId: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [pendingDocs, setPendingDocs] = useState<SifenInvoice[]>([]);
  
  const invoice = invoiceData?.parsed;
  const suggestion = invoiceData?.suggestion;

  // Upload SIFEN XML mutation
  const uploadMutation = useUploadSifenXml();
  const approveMutation = useApproveTaxDocument();

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".xml")) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processXML(content);
    };
    reader.readAsText(file);
  }, []);

  const handleBatchFiles = useCallback(async (files: FileList) => {
    const xmlFiles = Array.from(files).filter((f) => f.name.endsWith(".xml"));
    if (xmlFiles.length === 0) return;

    if (xmlFiles.length === 1) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        setFileName(xmlFiles[0].name);
        await processXML(content);
      };
      reader.readAsText(xmlFiles[0]);
    } else {
      // Process multiple files sequentially to avoid overwhelming the API
      for (const file of xmlFiles) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          await processXML(content);
        };
        reader.readAsText(file);
      }
    }
  }, []);

  const processXML = async (content: string) => {
    if (!entityId) {
      setIsProcessing(false);
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await uploadMutation.mutateAsync({
        entityId,
        xmlContent: content,
      });
      if (result.success && result.parsed && result.suggestion && result.id) {
        setInvoiceData({
          parsed: result.parsed,
          suggestion: result.suggestion,
          documentId: result.id,
        });
        setStep("review");
      } else {
        console.error("Upload failed:", result.message);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) handleBatchFiles(files);
    },
    [handleBatchFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleApprove = async () => {
    if (!invoiceData || !entityId || !openPeriod?.id) {
      console.error("Missing invoiceData, entityId, or openPeriod");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await approveMutation.mutateAsync({
        documentId: invoiceData.documentId,
        entityId,
        periodId: openPeriod.id,
      });
      
      if (result.success) {
        setStep("success");
      } else {
        console.error("Approval failed:", result.message);
      }
    } catch (error) {
      console.error("Approval error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    if (!entityId || !openPeriod?.id) return;
    setIsProcessing(true);
    for (const doc of pendingDocs) {
      const sug = suggestJournalEntry(doc);
      if (sug.balanced) {
        await createAsiento({
          entityId,
          periodId: openPeriod.id,
          date: doc.fechaEmision || new Date().toISOString().split("T")[0],
          descripcion: `${doc.tipoDoc === "factura" ? "Factura" : "Documento"} ${doc.numero}`,
          lineas: sug.lines.map((l) => ({
            accountId: l.accountCode,
            debit: l.debit,
            credit: l.credit,
            currencyCode: "PYG",
            description: l.description,
          })),
        });
      }
    }
    setIsProcessing(false);
    setStep("success");
  };

  const handleDemo = () => {
    const demoXml = `<?xml version="1.0" encoding="UTF-8"?>
<dFE>
  <dEmis>5897185478912345678901234567890123456789012345</dEmis>
  <dTimbrado>12345678</dTimbrado>
  <dNroEstab>001</dNroEstab>
  <dPtoExp>001</dPtoExp>
  <dNroDoc>00234</dNroDoc>
  <dFEEmis>2026-05-01</dFEEmis>
  <cTiOpe>1</cTiOpe>
  <cCond>2</cCond>
  <dRucEmis>80012345-1</dRucEmis>
  <dNomEmis>Importadora del Este S.A.</dNomEmis>
  <dNomFanEmis>ImportEste</dNomFanEmis>
  <dRucRece>80023456-2</dRucRece>
  <dNomRece>Tecnología Asunción SRL</dNomRece>
  <dTot Grav 10>10000000</dTot Grav 10>
  <dTot Grav 5>0</dTot Grav 5>
  <dTot Exe>0</dTot Exe>
  <dTotIVA10>1000000</dTotIVA10>
  <dTotIVA5>0</dTotIVA5>
  <dTotOpe>11000000</dTotOpe>
</dFE>`;
    setFileName("demo-factura-001-001-00234.xml");
    processXML(demoXml);
  };

  const reset = () => {
    setStep("upload");
    setInvoiceData(null);
    setFileName("");
  };

  if (step === "success") {
    return (
      <div className="p-4 sm:p-8 lg:p-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4">
        <div className="glass-card rounded-3xl p-8 sm:p-16 text-center premium-shadow overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl shadow-primary/20 animate-ai-pulse">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {pendingDocs.length > 0 ? `${pendingDocs.length} Facturas Procesadas` : "Asiento Publicado"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 text-sm">
            {pendingDocs.length > 0
              ? `Se crearon los asientos contables automáticamente para ${pendingDocs.length} documentos.`
              : `La factura ${invoice?.numero} fue procesada y el asiento contable fue creado exitosamente.`}
          </p>
{invoiceData && (
             <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 max-w-sm mx-auto mb-6 sm:mb-8 text-left">
               <div className="flex items-center justify-between text-sm mb-2">
                 <span className="text-gray-500 dark:text-gray-400">Proveedor</span>
                 <span className="text-gray-900 dark:text-white font-medium">{invoiceData.parsed.emisor.nombre}</span>
               </div>
               <div className="flex items-center justify-between text-sm mb-2">
                 <span className="text-gray-500 dark:text-gray-400">Total</span>
                 <span className="text-gray-900 dark:text-white font-mono font-medium">₲ {invoiceData.parsed.montos.total.toLocaleString("es-PY")}</span>
               </div>
               <div className="flex items-center justify-between text-sm">
                 <span className="text-gray-500 dark:text-gray-400">Líneas</span>
                 <span className="text-gray-900 dark:text-white">{invoiceData.suggestion.lines.length}</span>
               </div>
             </div>
           )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={reset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 glass-card hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl text-sm font-black uppercase tracking-widest transition-all"
              >
                <Upload className="h-4 w-4" />
                Cargar otra
              </button>
              <Link
                href="/asientos"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white hover:bg-primary-dark rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all"
              >
                Ver Asientos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "review" && invoice && suggestion) {
return (
       <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <button
               onClick={reset}
               className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors no-tap-highlight"
             >
               <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
             </button>
             <div>
               <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Revisar Factura SIFEN</h1>
               <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Verificar datos y aprobar asiento sugerido por IA</p>
             </div>
           </div>
           <button
             disabled={isProcessing}
             onClick={handleApprove}
             className={cn(
               "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all no-tap-highlight",
               isProcessing
                 ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                 : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20"
             )}
           >
             {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
             {isProcessing ? "Procesando..." : "Aprobar y Publicar"}
           </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
           {/* Invoice Data */}
           <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
             <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <FileCode className="h-5 w-5 text-blue-500 dark:text-blue-400" />
               <h2 className="text-gray-900 dark:text-white text-sm sm:text-base font-medium">Datos de la Factura</h2>
               </div>
               <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded truncate max-w-[120px]">{fileName}</span>
             </div>
             <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
               <div className="grid grid-cols-2 gap-2 sm:gap-3">
                 <InfoBlock icon={Receipt} label="Número" value={invoiceData.parsed.numero} />
                 <InfoBlock icon={Calendar} label="Fecha" value={invoiceData.parsed.fechaEmision || "N/A"} />
                 <InfoBlock icon={Building2} label="Emisor" value={invoiceData.parsed.emisor.nombre || "N/A"} />
                 <InfoBlock icon={CreditCard} label="Condición" value={invoiceData.parsed.condicion === "contado" ? "Contado" : "Crédito"} />
               </div>
               <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 space-y-2">
                 <h3 className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wide mb-2 sm:mb-3">Desglose de Montos</h3>
                 {invoiceData.parsed.montos.gravado10 > 0 && <AmountRow label="Gravado 10%" value={invoiceData.parsed.montos.gravado10} />}

{invoiceData.parsed.montos.gravado5 > 0 && <AmountRow label="Gravado 5%" value={invoiceData.parsed.montos.gravado5} />}
                 {invoiceData.parsed.montos.exento > 0 && <AmountRow label="Exento" value={invoiceData.parsed.montos.exento} />}
                 {invoiceData.parsed.montos.iva10 > 0 && <AmountRow label="IVA 10%" value={invoiceData.parsed.montos.iva10} />}
                 {invoiceData.parsed.montos.iva5 > 0 && <AmountRow label="IVA 5%" value={invoiceData.parsed.montos.iva5} />}
                 <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                   <AmountRow label="Total" value={invoiceData.parsed.montos.total} bold />
                </div>
              </div>
{invoiceData.parsed.items.length > 0 && (
                 <>
                   <button
                     onClick={() => setShowDetails(!showDetails)}
                     className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors no-tap-highlight"
                   >
                     {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                     {invoiceData.parsed.items.length} ítems
                   </button>
                   {showDetails && (
                     <div className="space-y-1">
                       {invoiceData.parsed.items.map((item, i) => (
                         <div key={i} className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2">
                           <span className="truncate flex-1">{item.descripcion || item.codigo}</span>
                           <span className="font-mono ml-2">₲ {item.total.toLocaleString("es-PY")}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </>
               )}
             </div>
           </div>
 
           {/* AI Suggested Entry */}
           <div className="bg-white dark:bg-gray-900/50 border border-purple-200 dark:border-purple-800/50 rounded-xl overflow-hidden">
             <div className="p-3 sm:p-4 border-b border-purple-200 dark:border-purple-800/30 flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/10">
               <div className="flex items-center gap-2">
                 <Sparkles className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                 <h2 className="text-gray-900 dark:text-white text-sm sm:text-base font-medium">Asiento Sugerido por IA</h2>
               </div>
               <div className="flex items-center gap-1.5 sm:gap-2">
                 <span className={cn(
                   "text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
                   invoiceData.suggestion.balanced ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                 )}>
                   {invoiceData.suggestion.balanced ? "✓ Balanceado" : "⚠ Ajustar"}
                 </span>
                 <span className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-purple-200 dark:border-purple-800/50">
                   {(invoiceData.suggestion.confidence * 100).toFixed(0)}%
                 </span>
               </div>
            </div>
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Empresa destino</label>
                <select
                  value={empresaSeleccionada}
                  onChange={(e) => setEmpresaSeleccionada(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 no-tap-highlight"
                >
                  <option value="">Seleccionar empresa</option>
                  <option value="mock-1">Importadora del Este S.A.</option>
                  <option value="mock-2">Tecnología Asunción SRL</option>
                  <option value="mock-3">Distribuciones Ñandutí SA</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left py-2 text-gray-400 text-[10px] sm:text-xs">Cuenta</th>
                      <th className="text-right py-2 text-gray-400 text-[10px] sm:text-xs">Débito</th>
                      <th className="text-right py-2 text-gray-400 text-[10px] sm:text-xs">Crédito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                    {suggestion.lines.map((line, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                        <td className="py-2 pr-2">
                          <span className="text-purple-500 dark:text-purple-400 font-mono text-[10px] sm:text-xs">{line.accountCode}</span>{" "}
                          <span className="text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs">{line.accountName}</span>
                        </td>
                        <td className="py-2 text-right font-mono text-[10px] sm:text-xs text-gray-900 dark:text-white tabular-nums">
                          {line.debit ? `₲ ${parseFloat(line.debit).toLocaleString("es-PY")}` : "—"}
                        </td>
                        <td className="py-2 text-right font-mono text-[10px] sm:text-xs text-gray-900 dark:text-white tabular-nums">
                          {line.credit ? `₲ ${parseFloat(line.credit).toLocaleString("es-PY")}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                      <td className="py-2 text-right text-gray-500 dark:text-gray-400 font-medium text-[10px] sm:text-xs">TOTALES</td>
                      <td className="py-2 text-right font-mono font-bold text-xs sm:text-sm text-green-600 dark:text-green-400 tabular-nums">
                        ₲ {suggestion.totalDebit.toLocaleString("es-PY")}
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-xs sm:text-sm text-green-600 dark:text-green-400 tabular-nums">
                        ₲ {suggestion.totalCredit.toLocaleString("es-PY")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2.5 sm:p-3 border border-gray-200 dark:border-gray-700/50">
                <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">{suggestion.rationale}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Carga de Facturas SIFEN</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Arrastra archivos XML de facturas electrónicas paraguayas. La IA sugerirá el asiento contable automáticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sifen/historial"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Bandeja ({pendingDocs.length})</span>
          </Link>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-8 sm:p-16 text-center cursor-pointer transition-all no-tap-highlight overflow-hidden",
          isDragging
            ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10"
            : "glass-card border-gray-300 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-900/50"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none opacity-50" />
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={(e) => { const files = e.target.files; if (files && files.length > 0) handleBatchFiles(files); }}
        />

        {isProcessing ? (
          <div className="space-y-3 sm:space-y-4">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 animate-spin mx-auto" />
            <p className="text-gray-900 dark:text-white text-base sm:text-lg font-medium">Procesando factura...</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Extrayendo datos y generando asiento con IA</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mx-auto">
              <FileCode className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-white text-base sm:text-lg font-medium">
                {fileName || "Arrastra tus archivos XML aquí"}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
                {fileName ? "Archivo cargado — procesando..." : "o hacé clic para seleccionar — múltiples archivos permitidos"}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-gray-400">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">.xml</span>
              <span>Facturas SIFEN — DNIT Paraguay</span>
            </div>
          </div>
        )}
      </div>

      {/* Demo Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={handleDemo}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight"
        >
          <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          Probar con factura de demostración
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <InfoCard icon={FileCode} title="Parseo automático" desc="Extrae CDC, timbrado, montos, IVA y datos del emisor" />
        <InfoCard icon={Sparkles} title="Asiento inteligente" desc="Genera automáticamente débitos, créditos y cuentas contables" />
        <InfoCard icon={CheckCircle2} title="Revisión humana" desc="Verificá y aprobá el asiento antes de publicar" />
      </div>
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5 sm:p-3">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
        <span className="text-gray-400 text-[10px] sm:text-xs">{label}</span>
      </div>
      <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium truncate">{value}</p>
    </div>
  );
}

function AmountRow({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{label}</span>
      <span className={cn("font-mono tabular-nums text-xs sm:text-sm", bold ? "text-gray-900 dark:text-white font-bold" : "text-gray-700 dark:text-gray-300")}>
        ₲ {value.toLocaleString("es-PY")}
      </span>
    </div>
  );
}

function InfoCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2 sm:mb-3">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </div>
      <h3 className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">{title}</h3>
      <p className="text-gray-400 text-[10px] sm:text-xs">{desc}</p>
    </div>
  );
}
