"use client";

import { useState, useTransition, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle, Save, Loader2,
  Building2, Calendar, FileText, ShoppingBag, Landmark, CreditCard,
  Layers, Package, Monitor, Briefcase, ChevronRight, Upload, Sparkles, X,
  DollarSign, RefreshCw, Globe, ChevronDown
} from "lucide-react";
import { fetchExchangeRate, type ExchangeRateSource } from "../exchange-rate-actions";
import { cn } from "@/lib/utils";
import {
  createManualComprobante,
  loadEntidadesParaComprobantes,
  processInvoiceOCR,
  createInlineProduct,
  createInlineFixedAsset,
  loadInventoryItems,
  loadFixedAssets,
  loadRecentDocuments,
  loadChartOfAccountsFlat,
} from "../actions";
import { validateRUC } from "@/lib/ruc";
import { validateTimbrado as dbValidateTimbrado } from "../../timbrados/actions";

// ── Currency definitions with inline SVG flags ──────────────────────────────
const CURRENCIES: Array<{ code: string; label: string; symbol: string; flag: React.ReactNode }> = [
  {
    code: "PYG", label: "Guaraní", symbol: "₲",
    flag: (
      /* Paraguay: rojo | blanco | azul con estrella de cinco puntas */
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" className="h-3.5 w-5 rounded-[2px] shrink-0" aria-label="Paraguay">
        <rect width="30" height="6.67" y="0"     fill="#D52B1E"/>
        <rect width="30" height="6.66" y="6.67"  fill="#FFFFFF"/>
        <rect width="30" height="6.67" y="13.33" fill="#0038A8"/>
        {/* Estrella de 5 puntas centrada en la franja blanca */}
        <polygon
          points="15,7.3 15.75,9.4 18.0,9.4 16.3,10.65 16.95,12.7 15,11.45 13.05,12.7 13.7,10.65 12.0,9.4 14.25,9.4"
          fill="#D52B1E"
        />
      </svg>
    ),
  },
  {
    code: "USD", label: "Dólar", symbol: "$",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14" className="h-3.5 w-5 rounded-[2px] shrink-0">
        <rect width="20" height="14" fill="#B22234"/>
        {[0,2,4,6,8,10,12].map(y => <rect key={y} y={y} width="20" height="1.08" fill="#fff"/>)}
        <rect width="8" height="7.5" fill="#3C3B6E"/>
        {[[2,1],[5,1],[3.5,2.5],[1.5,2.5],[4.5,4],[2.5,4],[6.5,4],[1,1],[4,2.5],[6,2.5],[1.5,4.5],[3.5,4.5],[5.5,4.5],[1,3],[6,1],[3,4],[5,3],[2,3.5]].map(([x,y],i)=>
          <circle key={i} cx={x as number} cy={y as number} r="0.4" fill="#fff"/>
        )}
      </svg>
    ),
  },
  {
    code: "EUR", label: "Euro", symbol: "€",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14" className="h-3.5 w-5 rounded-[2px] shrink-0">
        <rect width="20" height="14" fill="#039"/>
        {Array.from({length:12},(_,i) => {
          const angle = (i/12)*2*Math.PI - Math.PI/2;
          return <circle key={i} cx={10+3.5*Math.cos(angle)} cy={7+3.5*Math.sin(angle)} r="0.55" fill="#FC0"/>;
        })}
      </svg>
    ),
  },
  {
    code: "BRL", label: "Real", symbol: "R$",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14" className="h-3.5 w-5 rounded-[2px] shrink-0">
        <rect width="20" height="14" fill="#009C3B"/>
        <polygon points="10,1.4 18.5,7 10,12.6 1.5,7" fill="#FEDF00"/>
        <circle cx="10" cy="7" r="2.8" fill="#002776"/>
      </svg>
    ),
  },
  {
    code: "ARS", label: "Peso Arg.", symbol: "$",
    flag: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 14" className="h-3.5 w-5 rounded-[2px] shrink-0">
        <rect width="20" height="14" fill="#74ACDF"/>
        <rect y="4.67" width="20" height="4.66" fill="#fff"/>
        <circle cx="10" cy="7" r="1.5" fill="#F6B40E"/>
      </svg>
    ),
  },
];

interface LineaDetalle {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  ivaRate: number;
  lineTotal: number;
  destination: "gasto" | "mercaderia" | "activo_fijo";
  productCode?: string;
  productDescription?: string;
  usefulLifeMonths?: number;
  accountId?: string; // GL account override selected by user
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function formatGs(value: number) {
  return value.toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

export default function RegistrarComprobantePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [ocrPending, setOcrPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Schema lists
  const [entities, setEntities] = useState<Array<{ id: string; legalName: string; ruc: string }>>([]);
  const [inventoryList, setInventoryList] = useState<Array<{ code: string; description: string }>>([]);
  const [fixedAssetsList, setFixedAssetsList] = useState<Array<{ code: string; name: string }>>([]);
  const [chartAccounts, setChartAccounts] = useState<Array<{ id: string; code: string; name: string; nature: string | null }>>([]);

  // Currency picker open state
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Form Header States
  const [entityId, setEntityId] = useState("");
  const [direction, setDirection] = useState<"received" | "issued">("received");
  const [docType, setDocType] = useState<"factura" | "nota_credito" | "nota_debito" | "autofactura" | "retencion">("factura");
  const [number, setNumber] = useState("");
  const [timbrado, setTimbrado] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [partnerRuc, setPartnerRuc] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [condition, setCondition] = useState<"cash" | "credit">("credit");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "card" | "credit">("credit");
  const [bankAccountId, setBankAccountId] = useState("");

  // ── Documento de Origen (NC/ND) ──
  const [documentOrigenId, setDocumentOrigenId] = useState("");
  const [recentDocs, setRecentDocs] = useState<Array<{ id: string; number: string; docType: string; issueDate: string; total: number; partnerName: string }>>([]);

  // ── Multimoneda ──
  const [currency, setCurrency] = useState<"PYG" | "USD" | "EUR" | "BRL" | "ARS">("PYG");
  const [tcSource, setTcSource] = useState<ExchangeRateSource>("manual");
  const [tcBuy, setTcBuy] = useState<number>(0);   // Gs. compra
  const [tcSell, setTcSell] = useState<number>(0);  // Gs. venta (usado para conversión)
  const [tcDate, setTcDate] = useState("");
  const [tcSourceName, setTcSourceName] = useState("");
  const [tcLoading, setTcLoading] = useState(false);
  const [tcError, setTcError] = useState<string | null>(null);

  const [lines, setLines] = useState<LineaDetalle[]>([
    { id: uid(), description: "", quantity: 1, unitPrice: 0, ivaRate: 10, lineTotal: 0, destination: "gasto" }
  ]);

  // ── Credit installments ──
  const [creditInstallmentsCount, setCreditInstallmentsCount] = useState(1);
  const [creditIntervalDays, setCreditIntervalDays] = useState(30);

  // Inline Modals States
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProdCode, setNewProdCode] = useState("");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [activeLineForProduct, setActiveLineForProduct] = useState<string | null>(null);

  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAssetCode, setNewAssetCode] = useState("");
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetLife, setNewAssetLife] = useState(60);
  const [activeLineForAsset, setActiveLineForAsset] = useState<string | null>(null);

  // Load Initial Lists
  useEffect(() => {
    loadEntidadesParaComprobantes().then((r) => {
      if (r.ok) {
        setEntities(r.data);
        if (r.data.length > 0) {
          setEntityId(r.data[0].id);
          refreshInventoryAndAssets(r.data[0].id);
        }
      }
    });
  }, []);

  const refreshInventoryAndAssets = async (entId: string) => {
    if (!entId) return;
    const [invRes, assetRes] = await Promise.all([
      loadInventoryItems(entId),
      loadFixedAssets(entId)
    ]);
    if (invRes.ok) setInventoryList(invRes.data);
    if (assetRes.ok) setFixedAssetsList(assetRes.data);
    // Also load chart of accounts
    const acctRes = await loadChartOfAccountsFlat(entId);
    if (acctRes.ok) setChartAccounts(acctRes.data);
  };

  // Load recent docs when NC/ND selected
  useEffect(() => {
    if ((docType === "nota_credito" || docType === "nota_debito") && entityId) {
      loadRecentDocuments(entityId, direction).then((r) => {
        if (r.ok) setRecentDocs(r.data);
      });
    } else {
      setRecentDocs([]);
      setDocumentOrigenId("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType, entityId, direction]);

  // Close currency dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (entityId) refreshInventoryAndAssets(entityId);
  }, [entityId]);

  // ── TC Fetch Handler ──
  const handleFetchTC = async () => {
    if (currency === "PYG" || tcSource === "manual") return;
    setTcLoading(true);
    setTcError(null);
    const res = await fetchExchangeRate(currency, tcSource);
    setTcLoading(false);
    if (res.ok) {
      setTcBuy(res.data.buyRate);
      setTcSell(res.data.sellRate);
      setTcDate(res.data.date);
      setTcSourceName(res.data.sourceName);
    } else {
      setTcError(res.error);
    }
  };

  // Reset TC when currency changes back to PYG
  useEffect(() => {
    if (currency === "PYG") {
      setTcBuy(0);
      setTcSell(0);
      setTcDate("");
      setTcSourceName("");
      setTcError(null);
    } else if (tcSource !== "manual") {
      handleFetchTC();
    }
  }, [currency, tcSource]);

  // Sync paymentMethod with condition
  useEffect(() => {
    if (condition === "credit") {
      setPaymentMethod("credit");
    } else if (paymentMethod === "credit") {
      setPaymentMethod("cash");
    }
  }, [condition]);

  // RUC local validation
  const rucValidation = useMemo(() => {
    if (!partnerRuc) return null;
    return validateRUC(partnerRuc);
  }, [partnerRuc]);

  // Timbrado status from DB
  const [timbradoDbCheck, setTimbradoDbCheck] = useState<{ checked: boolean; valid: boolean; reason?: string }>({ checked: false, valid: true });

  // Cross-check timbrado in DB (applicable to issued bills, and optional warning for received bills)
  useEffect(() => {
    if (!entityId || !timbrado || timbrado.length !== 8) {
      setTimbradoDbCheck({ checked: false, valid: true });
      return;
    }
    const d = new Date(issueDate);
    if (isNaN(d.getTime())) return;

    dbValidateTimbrado(entityId, timbrado, d).then((res) => {
      setTimbradoDbCheck({ checked: true, valid: res.valid, reason: res.reason });
    });
  }, [entityId, timbrado, issueDate]);

  // Timbrado simple active verification (must be 8 digits and not expired)
  const timbradoValidation = useMemo(() => {
    if (!timbrado) return null;
    if (timbrado.length !== 8) return { valid: false, error: "El timbrado debe tener exactamente 8 dígitos" };
    if (direction === "issued" && timbradoDbCheck.checked && !timbradoDbCheck.valid) {
      return { valid: false, error: "Timbrado no habilitado en base de datos para esta fecha/empresa" };
    }
    return { valid: true };
  }, [timbrado, timbradoDbCheck, direction]);

  // Totals calculations — convierte a PYG si hay moneda extranjera
  const tcRate = currency !== "PYG" && tcSell > 0 ? tcSell : 1;

  const totals = useMemo(() => {
    let subtotal = 0;
    let gravado10 = 0;
    let gravado5 = 0;
    let exento = 0;
    let iva10 = 0;
    let iva5 = 0;

    lines.forEach((l) => {
      // Si hay moneda extranjera con TC, convertimos el precio a PYG
      const unitInPyg = currency !== "PYG" && tcSell > 0
        ? l.unitPrice * tcSell
        : l.unitPrice;
      const lineTotal = l.quantity * unitInPyg;
      subtotal += lineTotal;

      if (l.ivaRate === 10) {
        iva10 += lineTotal * (10 / 110);
        gravado10 += lineTotal - (lineTotal * (10 / 110));
      } else if (l.ivaRate === 5) {
        iva5 += lineTotal * (5 / 105);
        gravado5 += lineTotal - (lineTotal * (5 / 105));
      } else {
        exento += lineTotal;
      }
    });

    return {
      subtotal: Math.round(subtotal),
      gravado10: Math.round(gravado10),
      gravado5: Math.round(gravado5),
      exento: Math.round(exento),
      iva10: Math.round(iva10),
      iva5: Math.round(iva5),
      total: Math.round(subtotal)
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, currency, tcSell]);

  // ── Installments preview (computed) ──
  const installmentsPreview = useMemo(() => {
    if (condition !== "credit" || creditInstallmentsCount < 1 || !issueDate) return [];
    const baseDate = new Date(issueDate + "T12:00:00");
    const amountPerQuota = Math.round(totals.total / creditInstallmentsCount);
    const remainder = totals.total - amountPerQuota * creditInstallmentsCount;
    return Array.from({ length: creditInstallmentsCount }, (_, i) => {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + creditIntervalDays * (i + 1));
      return {
        installmentNumber: i + 1,
        dueDate: dueDate.toISOString().split("T")[0],
        amount: i === creditInstallmentsCount - 1 ? amountPerQuota + remainder : amountPerQuota,
      };
    });
  }, [condition, creditInstallmentsCount, creditIntervalDays, issueDate, totals.total]);

  const addLine = () => {
    setLines([
      ...lines,
      { id: uid(), description: "", quantity: 1, unitPrice: 0, ivaRate: 10, lineTotal: 0, destination: "gasto" }
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: keyof LineaDetalle, value: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.lineTotal = updated.quantity * updated.unitPrice;
        }
        return updated;
      })
    );
  };

  // OCR Processing
  const handleOcrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrPending(true);
    setFeedback(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Raw = reader.result as string;
        const base64Data = base64Raw.split(",")[1];
        
        const res = await processInvoiceOCR(base64Data, file.type);
        setOcrPending(false);

        if (res.ok) {
          const d = res.data;
          if (d.docNumber) setNumber(d.docNumber);
          if (d.timbrado) setTimbrado(d.timbrado);
          if (d.issueDate) setIssueDate(d.issueDate);
          if (d.partnerRuc) setPartnerRuc(d.partnerRuc);
          if (d.partnerName) setPartnerName(d.partnerName);

          if (d.lines && d.lines.length > 0) {
            setLines(
              d.lines.map((l) => ({
                id: uid(),
                description: l.description,
                quantity: l.quantity || 1,
                unitPrice: l.unitPrice || 0,
                ivaRate: l.ivaRate || 10,
                lineTotal: l.lineTotal || ((l.quantity || 1) * (l.unitPrice || 0)),
                destination: "gasto"
              }))
            );
          }
          setFeedback({ type: "success", message: "✓ Factura digitalizada. Verificá los campos precargados." });
        } else {
          setFeedback({ type: "error", message: res.error || "No se pudo extraer información de la factura." });
        }
      };
    } catch (err) {
      setOcrPending(false);
      setFeedback({ type: "error", message: "Error al leer el archivo." });
    }
  };

  // Create Product Inline
  const handleCreateProductInline = async () => {
    if (!entityId || !newProdCode || !newProdDesc || !activeLineForProduct) return;
    const res = await createInlineProduct(entityId, newProdCode, newProdDesc);
    if (res.ok) {
      updateLine(activeLineForProduct, "productCode", newProdCode);
      updateLine(activeLineForProduct, "productDescription", newProdDesc);
      updateLine(activeLineForProduct, "description", newProdDesc);
      refreshInventoryAndAssets(entityId);
      setShowProductModal(false);
      setNewProdCode("");
      setNewProdDesc("");
    } else {
      alert(res.error);
    }
  };

  // Create Fixed Asset Inline
  const handleCreateAssetInline = async () => {
    if (!entityId || !newAssetCode || !newAssetName || !activeLineForAsset) return;
    const line = lines.find((l) => l.id === activeLineForAsset);
    const value = line ? line.quantity * line.unitPrice : 0;
    const res = await createInlineFixedAsset(entityId, newAssetCode, newAssetName, value, newAssetLife);
    if (res.ok) {
      updateLine(activeLineForAsset, "productCode", newAssetCode);
      updateLine(activeLineForAsset, "productDescription", newAssetName);
      updateLine(activeLineForAsset, "description", newAssetName);
      updateLine(activeLineForAsset, "usefulLifeMonths", newAssetLife);
      refreshInventoryAndAssets(entityId);
      setShowAssetModal(false);
      setNewAssetCode("");
      setNewAssetName("");
    } else {
      alert(res.error);
    }
  };

  const handleSave = () => {
    setFeedback(null);
    if (!entityId || !number || !partnerRuc || !partnerName || !issueDate) {
      setFeedback({ type: "error", message: "Completá todos los campos obligatorios." });
      return;
    }
    if (rucValidation && !rucValidation.valid) {
      setFeedback({ type: "error", message: `El RUC es inválido: ${rucValidation.error}` });
      return;
    }

    startTransition(async () => {
      const result = await createManualComprobante({
        entityId,
        direction,
        docType,
        number,
        timbrado,
        issueDate,
        partnerRuc,
        partnerName,
        condition,
        gravado10: totals.gravado10,
        gravado5: totals.gravado5,
        exento: totals.exento,
        iva10: totals.iva10,
        iva5: totals.iva5,
        total: totals.total,
        lines: lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          ivaRate: l.ivaRate,
          lineTotal: l.lineTotal || (l.quantity * l.unitPrice),
          destination: l.destination,
          productCode: l.productCode,
          productDescription: l.productDescription || l.description,
          usefulLifeMonths: l.usefulLifeMonths,
          accountId: l.accountId || undefined,
        })),
        paymentMethod,
        bankAccountId: bankAccountId || undefined,
        documentOrigenId: documentOrigenId || undefined,
        installments: condition === "credit" && installmentsPreview.length > 0
          ? installmentsPreview
          : undefined,
      });

      if (result.ok) {
        setFeedback({
          type: "success",
          message: `✓ Comprobante y Asiento ${result.data.entryNumber} generados correctamente. Redireccionando...`
        });
        setTimeout(() => router.push("/comprobantes"), 2000);
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  const isFormValid = entityId && number && partnerRuc && partnerName && lines.every((l) => l.description && l.unitPrice > 0);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/comprobantes" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </a>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
              Registrar Comprobante Manual
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Carga facturas de compra/venta y vincula automáticamente inventario, activos fijos y asientos.
            </p>
          </div>
        </div>

        <button
          disabled={!isFormValid || isPending || ocrPending}
          onClick={handleSave}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg",
            isFormValid && !isPending && !ocrPending
              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10"
              : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50"
          )}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Registrando..." : "Guardar Comprobante"}
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-xl border animate-in fade-in slide-in-from-top-1",
          feedback.type === "success"
            ? "bg-green-950/20 border-green-800/40 text-green-400"
            : "bg-red-950/20 border-red-800/40 text-red-400"
        )}>
          {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* OCR Subida Uploader */}
      <div className="bg-gray-900/30 border-2 border-dashed border-gray-800 hover:border-blue-600/40 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative"
           onClick={() => fileInputRef.current?.click()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleOcrFile}
          className="hidden"
        />
        {ocrPending ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-sm text-gray-300 font-semibold">Gemini está analizando tu factura...</p>
            <p className="text-xs text-gray-500">Extrayendo RUC, Timbrado, Montos e Ítems</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 text-gray-500 mx-auto" />
            <p className="text-sm font-semibold text-gray-300">¿Tenés la foto o PDF del comprobante?</p>
            <p className="text-xs text-gray-500">Arrastrá el archivo o hacé clic acá para precargar con **Gemini IA**</p>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header Metadata */}
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-gray-200 border-b border-gray-800 pb-2">Cabecera de Factura</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Empresa *</label>
                <select
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                >
                  <option value="">Selecciona Empresa</option>
                  {entities.map((e) => <option key={e.id} value={e.id}>{e.legalName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Perspectiva</label>
                <div className="flex bg-gray-800/30 p-1 rounded-xl border border-gray-700/30">
                  <button
                    type="button"
                    onClick={() => setDirection("received")}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                      direction === "received" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                  >
                    Compra (Recibido)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("issued")}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                      direction === "issued" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                    )}
                  >
                    Venta (Emitido)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Tipo Documento *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                >
                  <option value="factura">Factura</option>
                  <option value="autofactura">Autofactura</option>
                  <option value="nota_credito">Nota de Crédito</option>
                  <option value="nota_debito">Nota de Débito</option>
                  <option value="retencion">Retención</option>
                </select>
              </div>
            </div>

            {/* Documento de Origen — solo visible para NC y ND */}
            {(docType === "nota_credito" || docType === "nota_debito") && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40">
                <label className="block text-xs font-semibold text-amber-400 mb-1.5">
                  📎 Comprobante de Origen (Factura que genera la NC/ND)
                </label>
                {recentDocs.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No se encontraron facturas previas para esta empresa/perspectiva.</p>
                ) : (
                  <select
                    value={documentOrigenId}
                    onChange={(e) => setDocumentOrigenId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-amber-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                  >
                    <option value="">— Sin vincular (opcional) —</option>
                    {recentDocs
                      .filter((d) => d.docType === "factura" || d.docType === "invoice")
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.number} · {d.partnerName} · Gs. {Number(d.total).toLocaleString("es-PY")} · {d.issueDate}
                        </option>
                      ))
                    }
                  </select>
                )}
                {documentOrigenId && (
                  <p className="mt-1 text-[10px] text-amber-400">
                    ✓ Esta nota quedará vinculada a la factura seleccionada.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nro. Comprobante *</label>
                <input
                  type="text"
                  placeholder="Ej: 001-001-0001234"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-400">Timbrado Nro.</label>
                  {timbradoValidation && !timbradoValidation.valid && (
                    <span className="text-[9px] text-red-400 font-semibold">{timbradoValidation.error}</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Ej: 12345678"
                  value={timbrado}
                  onChange={(e) => setTimbrado(e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 bg-gray-800/50 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 transition-all font-mono",
                    timbradoValidation && !timbradoValidation.valid ? "border-red-500/60 focus:ring-red-500/20" : "border-gray-700/50 focus:ring-blue-500/30"
                  )}
                />
                {timbrado && timbrado.length === 8 && timbradoDbCheck.checked && (
                  <div className="mt-1 flex items-center gap-1 text-[10px]">
                    {timbradoDbCheck.valid ? (
                      <span className="text-green-400 font-semibold">✓ Timbrado registrado y vigente</span>
                    ) : (
                      <span className={cn("font-semibold", direction === "issued" ? "text-red-400" : "text-amber-400")}>
                        {direction === "issued" ? "❌ Error: No registrado para esta fecha" : "⚠️ Nota: No registrado para emitir (vigente para compras)"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Fecha Emisión *</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-400">RUC Contraparte *</label>
                  {rucValidation && (
                    <span className={cn("text-[9px] font-bold", rucValidation.valid ? "text-green-400" : "text-red-400")}>
                      {rucValidation.valid ? "✓ RUC Válido" : `✗ ${rucValidation.error}`}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Ej: 80012345-0"
                  value={partnerRuc}
                  onChange={(e) => setPartnerRuc(e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 bg-gray-800/50 border rounded-xl text-sm text-white focus:outline-none focus:ring-2 transition-all font-mono",
                    rucValidation && !rucValidation.valid ? "border-red-500/60 focus:ring-red-500/20" : "border-gray-700/50 focus:ring-blue-500/30"
                  )}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Razón Social *</label>
                <input
                  type="text"
                  placeholder="Ej: Distribuidora Central S.A."
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Moneda y Tipo de Cambio ── */}
          <div className="relative z-10 bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-gray-200 border-b border-gray-800 pb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" /> Moneda y Tipo de Cambio
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Moneda — custom picker with SVG flags */}
              <div className="relative">
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Moneda del Comprobante</label>
                <div className="relative z-30" ref={currencyDropdownRef}>
                  {/* Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDropdown((p) => !p)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all hover:border-gray-600/70"
                  >
                    {CURRENCIES.find((c) => c.code === currency)?.flag}
                    <span className="font-semibold">{currency}</span>
                    <span className="text-gray-400">—</span>
                    <span className="text-gray-300 flex-1 text-left">{CURRENCIES.find((c) => c.code === currency)?.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-gray-500 transition-transform", showCurrencyDropdown && "rotate-180")} />
                  </button>

                  {/* Dropdown */}
                  {showCurrencyDropdown && (
                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-900 border border-gray-700/80 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-60 overflow-y-auto">
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => { setCurrency(c.code as any); setShowCurrencyDropdown(false); }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-gray-800",
                            currency === c.code ? "bg-cyan-500/10 text-cyan-300" : "text-gray-300"
                          )}
                        >
                          {c.flag}
                          <span className="font-semibold w-8">{c.code}</span>
                          <span className="text-gray-400 text-xs">{c.label}</span>
                          {currency === c.code && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-cyan-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fuente TC */}
              {currency !== "PYG" && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Fuente Tipo de Cambio</label>
                  <select
                    value={tcSource}
                    onChange={(e) => setTcSource(e.target.value as ExchangeRateSource)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                  >
                    <option value="manual">Manual — Ingreso propio</option>
                    <option value="bcp">BCP — Banco Central PY</option>
                    <option value="dnit">DNIT — Cotización fiscal</option>
                  </select>
                </div>
              )}

              {/* Botón traer / Input manual */}
              {currency !== "PYG" && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    TC Venta (Gs. por {currency})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Ej: 7450"
                      value={tcSell || ""}
                      onChange={(e) => setTcSell(parseFloat(e.target.value) || 0)}
                      readOnly={tcSource !== "manual"}
                      className={cn(
                        "flex-1 px-3 py-2 border rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 transition-all",
                        tcSource === "manual"
                          ? "bg-gray-800/50 border-gray-700/50 focus:ring-cyan-500/30"
                          : "bg-gray-800/20 border-gray-700/30 text-gray-400 cursor-not-allowed"
                      )}
                    />
                    {tcSource !== "manual" && (
                      <button
                        type="button"
                        onClick={handleFetchTC}
                        disabled={tcLoading}
                        title={`Traer TC del ${tcSource.toUpperCase()}`}
                        className="px-3 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-xl transition-all disabled:opacity-50"
                      >
                        {tcLoading
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <RefreshCw className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* TC Info Banner */}
            {currency !== "PYG" && tcSell > 0 && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-xs animate-in fade-in duration-300">
                <DollarSign className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="text-gray-300">
                  <span className="font-bold text-cyan-300">1 {currency} = Gs. {tcSell.toLocaleString("es-PY")}</span>
                  {tcBuy > 0 && <span className="text-gray-500 ml-2">(Compra: {tcBuy.toLocaleString("es-PY")})</span>}
                </span>
                {tcDate && <span className="text-gray-500">• Fecha: {tcDate}</span>}
                {tcSourceName && <span className="text-gray-500">• {tcSourceName}</span>}
                <span className="text-emerald-400 font-semibold ml-auto">
                  Los montos se convierten automáticamente a Gs.
                </span>
              </div>
            )}

            {/* TC Error */}
            {tcError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-800/30 rounded-xl text-xs text-red-400 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {tcError}. Podés ingresar la cotización manualmente.
              </div>
            )}

            {/* TC Warning — moneda seleccionada sin TC */}
            {currency !== "PYG" && tcSell === 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {tcSource === "manual"
                  ? `Ingresá el TC de venta en Gs. por ${currency} para calcular los totales en PYG.`
                  : `Hacé clic en 🔄 para traer el TC del ${tcSource.toUpperCase()} automáticamente.`
                }
              </div>
            )}
          </div>

          {/* Payment & Conditions */}
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-gray-200 border-b border-gray-800 pb-2">Condiciones y Pago</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Condición Fiscal</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                >
                  <option value="credit">Crédito</option>
                  <option value="cash">Contado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Forma de Pago (Asiento)</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  disabled={condition === "credit"}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all disabled:opacity-50"
                >
                  {condition === "credit" ? (
                    <option value="credit">Crédito (A Pagar/Cobrar)</option>
                  ) : (
                    <>
                      <option value="cash">Efectivo / Caja</option>
                      <option value="bank">Banco / Transferencia</option>
                      <option value="card">Tarjeta de Crédito/Débito</option>
                    </>
                  )}
                </select>
              </div>

              {paymentMethod === "bank" && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cuenta Bancaria</label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                  >
                    <option value="">Selecciona Cuenta</option>
                    <option value="b1">Banco Itaú Gs. - Cta 7001456</option>
                    <option value="b2">Banco Atlas Gs. - Cta 332490</option>
                  </select>
                </div>
              )}
            </div>

            {/* ── Credit Installments Setup ── */}
            {condition === "credit" && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-4">
                <div className="h-px bg-gray-800/60" />
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Condiciones de Crédito</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Cantidad de Cuotas</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCreditInstallmentsCount(Math.max(1, creditInstallmentsCount - 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-lg font-bold transition-colors"
                      >−</button>
                      <input
                        type="number"
                        min={1}
                        max={36}
                        value={creditInstallmentsCount}
                        onChange={(e) => setCreditInstallmentsCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setCreditInstallmentsCount(Math.min(36, creditInstallmentsCount + 1))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-lg font-bold transition-colors"
                      >+</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Días entre Cuotas</label>
                    <select
                      value={creditIntervalDays}
                      onChange={(e) => setCreditIntervalDays(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value={7}>7 días (semanal)</option>
                      <option value={15}>15 días (quincenal)</option>
                      <option value={30}>30 días (mensual)</option>
                      <option value={60}>60 días (bimestral)</option>
                      <option value={90}>90 días (trimestral)</option>
                    </select>
                  </div>
                </div>

                {/* Installments Preview Table */}
                {installmentsPreview.length > 0 && totals.total > 0 && (
                  <div className="rounded-xl border border-amber-800/30 overflow-hidden">
                    <div className="px-3 py-2 bg-amber-950/20 border-b border-amber-800/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">Vista previa de cuotas</span>
                      <span className="text-[10px] text-gray-500">{installmentsPreview.length} cuota{installmentsPreview.length !== 1 ? "s" : ""} · Total: ₲ {formatGs(totals.total)}</span>
                    </div>
                    <div className="divide-y divide-gray-800/40">
                      {installmentsPreview.map((inst) => {
                        const today = new Date();
                        const due = new Date(inst.dueDate);
                        const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={inst.installmentNumber} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-800/20 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-[10px]">
                                {inst.installmentNumber}
                              </span>
                              <span className="font-mono text-gray-300">{inst.dueDate}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-gray-500">
                                {daysUntil > 0 ? `en ${daysUntil} días` : "hoy"}
                              </span>
                              <span className="font-bold font-mono text-amber-300">₲ {formatGs(inst.amount)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lines Table Section */}
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-200">Ítems del Comprobante</h2>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-all px-2.5 py-1.5 bg-blue-500/10 rounded-lg hover:bg-blue-500/20"
              >
                <Plus className="h-3.5 w-3.5" /> Agregar Ítem
              </button>
            </div>

            <div className="divide-y divide-gray-800/60 p-4 space-y-4">
              {lines.map((linea, idx) => (
                <div key={linea.id} className="pt-4 first:pt-0 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-500">Ítem #{idx + 1}</span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(linea.id)}
                        className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Descripción *</label>
                      <input
                        type="text"
                        placeholder="Ej: Servicio de consultoría"
                        value={linea.description}
                        onChange={(e) => updateLine(linea.id, "description", e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-800/40 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Destino / Destinación</label>
                      <select
                        value={linea.destination}
                        onChange={(e) => updateLine(linea.id, "destination", e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-gray-800/40 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none"
                      >
                        <option value="gasto">📉 Gasto / Costo</option>
                        <option value="mercaderia">🛍️ Mercadería (Stock)</option>
                        <option value="activo_fijo">🏢 Activo Fijo (Bien)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Tasa IVA</label>
                      <select
                        value={linea.ivaRate}
                        onChange={(e) => updateLine(linea.id, "ivaRate", parseInt(e.target.value))}
                        className="w-full px-3 py-1.5 bg-gray-800/40 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none"
                      >
                        <option value={10}>IVA 10%</option>
                        <option value={5}>IVA 5%</option>
                        <option value={0}>Exento</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={linea.quantity}
                        onChange={(e) => updateLine(linea.id, "quantity", parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-1.5 bg-gray-800/40 border border-gray-700/50 rounded-xl text-sm text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Precio Unitario ({currency !== "PYG" ? currency : "Gs."})
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={linea.unitPrice || ""}
                        onChange={(e) => updateLine(linea.id, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-gray-800/40 border border-gray-700/50 rounded-xl text-sm text-white font-mono text-right"
                      />
                      {currency !== "PYG" && tcSell > 0 && (
                        <p className="text-[9px] text-cyan-400 text-right mt-0.5 font-mono">
                          ≈ Gs. {(linea.unitPrice * tcSell).toLocaleString("es-PY", { maximumFractionDigits: 0 })}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2 flex items-end">
                      <div className="w-full px-3 py-2 bg-gray-800/20 border border-gray-700/30 rounded-xl text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 font-medium">Subtotal Línea:</span>
                          {currency !== "PYG" ? (
                            <span className="font-bold text-cyan-300 font-mono">
                              {currency} {(linea.quantity * linea.unitPrice).toLocaleString("es-PY", { maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="font-bold text-white font-mono">₲ {formatGs(linea.quantity * linea.unitPrice)}</span>
                          )}
                        </div>
                        {currency !== "PYG" && tcSell > 0 && (
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[9px] text-gray-600">En Guaraníes:</span>
                            <span className="text-[10px] font-mono text-gray-400">₲ {formatGs(linea.quantity * linea.unitPrice * tcSell)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Extra Fields based on Destination */}
                  {linea.destination === "mercaderia" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl animate-in slide-in-from-left-2 duration-200">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1">Producto / Mercadería (Catálogo)</label>
                        <select
                          value={linea.productCode || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateLine(linea.id, "productCode", val);
                            const found = inventoryList.find((i) => i.code === val);
                            if (found) {
                              updateLine(linea.id, "productDescription", found.description);
                              updateLine(linea.id, "description", found.description);
                            }
                          }}
                          className="w-full px-3 py-1.5 bg-gray-800/50 border border-blue-500/20 rounded-lg text-xs text-white"
                        >
                          <option value="">Selecciona un Producto</option>
                          {inventoryList.map((i) => (
                            <option key={i.code} value={i.code}>{i.code} - {i.description}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLineForProduct(linea.id);
                            setShowProductModal(true);
                          }}
                          className="w-full py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-semibold transition-all"
                        >
                          + Nuevo Producto Inline
                        </button>
                      </div>
                    </div>
                  )}

                  {linea.destination === "activo_fijo" && direction === "received" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl animate-in slide-in-from-left-2 duration-200">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold text-purple-400 uppercase tracking-wider mb-1">Activo Fijo / Bien (Catálogo)</label>
                        <select
                          value={linea.productCode || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateLine(linea.id, "productCode", val);
                            const found = fixedAssetsList.find((i) => i.code === val);
                            if (found) {
                              updateLine(linea.id, "productDescription", found.name);
                              updateLine(linea.id, "description", found.name);
                            }
                          }}
                          className="w-full px-3 py-1.5 bg-gray-800/50 border border-purple-500/20 rounded-lg text-xs text-white"
                        >
                          <option value="">Selecciona un Bien</option>
                          {fixedAssetsList.map((i) => (
                            <option key={i.code} value={i.code}>{i.code} - {i.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLineForAsset(linea.id);
                            setShowAssetModal(true);
                          }}
                          className="w-full py-1.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-xs font-semibold transition-all"
                        >
                          + Nuevo Activo Inline
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Cuenta Contable por Línea (Gasto / Activo Fijo) ── */}
                  {(linea.destination === "gasto" || linea.destination === "activo_fijo") && chartAccounts.length > 0 && (
                    <div className="flex items-center gap-3 p-2.5 bg-gray-800/20 border border-gray-700/30 rounded-xl animate-in fade-in duration-150">
                      <Briefcase className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <div className="flex-1">
                        <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Cuenta Contable (opcional — reemplaza la predeterminada)
                        </label>
                        <select
                          value={linea.accountId || ""}
                          onChange={(e) => updateLine(linea.id, "accountId", e.target.value || undefined)}
                          className="w-full px-2 py-1.5 bg-gray-800/50 border border-gray-700/40 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                        >
                          <option value="">— Cuenta predeterminada del sistema —</option>
                          {chartAccounts
                            .filter((a) =>
                              linea.destination === "gasto"
                                ? (a.nature === "expense" || a.code.startsWith("5.") || a.code.startsWith("6."))
                                : (a.nature === "asset" || a.code.startsWith("1.2"))
                            )
                            .map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.code} — {a.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      {linea.accountId && (
                        <button
                          type="button"
                          onClick={() => updateLine(linea.id, "accountId", undefined)}
                          className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                          title="Quitar cuenta específica"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Summary Panel */}
        <div className="space-y-6">
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-sm sticky top-6">
            <h2 className="text-sm font-bold text-gray-200 border-b border-gray-800 pb-2">Resumen Impositivo (RG90)</h2>

            {currency !== "PYG" && (
              <div className="flex items-center gap-2 p-2.5 bg-cyan-950/30 border border-cyan-800/30 rounded-lg">
                <DollarSign className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <div className="text-[10px]">
                  <span className="text-cyan-300 font-bold">{currency}</span>
                  <span className="text-gray-400"> × TC {tcSell > 0 ? `Gs. ${tcSell.toLocaleString("es-PY")}` : "(sin TC)"}</span>
                  {tcSell === 0 && <span className="text-amber-400 ml-1">← Ingresá el TC</span>}
                </div>
              </div>
            )}
            
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between text-gray-400">
                <span>Gravado 10%</span>
                <span className="text-white">₲ {formatGs(totals.gravado10)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>IVA 10%</span>
                <span className="text-blue-400 font-bold">₲ {formatGs(totals.iva10)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Gravado 5%</span>
                <span className="text-white">₲ {formatGs(totals.gravado5)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>IVA 5%</span>
                <span className="text-blue-400 font-bold">₲ {formatGs(totals.iva5)}</span>
              </div>
              <div className="flex justify-between text-gray-400 border-b border-gray-800 pb-2">
                <span>Exento</span>
                <span className="text-white">₲ {formatGs(totals.exento)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2">
                <span className="text-gray-200">TOTAL FACTURA</span>
                <span className="text-green-400">₲ {formatGs(totals.total)}</span>
              </div>
            </div>

            {/* Smart Side-effects preview */}
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 space-y-3.5">
              <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Procesamiento en Cascada
              </h3>
              
              <ul className="text-xs space-y-2.5 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span>Crea factura en el Libro IVA de la empresa.</span>
                </li>

                {lines.some((l) => l.destination === "mercaderia") && (
                  <li className="flex items-start gap-2">
                    <Package className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>Actualiza inventarios y ajusta costos promedios.</span>
                  </li>
                )}

                {lines.some((l) => l.destination === "activo_fijo") && (
                  <li className="flex items-start gap-2">
                    <Monitor className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span>Registra bienes de uso y habilita depreciación.</span>
                  </li>
                )}

                <li className="flex items-start gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Genera y publica asiento por partida doble.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Product Modal Inline */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-gray-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" /> Crear Producto Inline (Mercadería)
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Código del Producto (SKU/Code)</label>
                <input
                  type="text"
                  placeholder="Ej: PROD-999"
                  value={newProdCode}
                  onChange={(e) => setNewProdCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Descripción Comercial</label>
                <input
                  type="text"
                  placeholder="Ej: Impresora Láser HP"
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                disabled={!newProdCode || !newProdDesc}
                onClick={handleCreateProductInline}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Crear y Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Modal Inline */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-gray-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Monitor className="h-4 w-4 text-purple-400" /> Crear Activo Fijo Inline (Bien)
              </h3>
              <button onClick={() => setShowAssetModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Código de Activo Fijo</label>
                <input
                  type="text"
                  placeholder="Ej: ACT-024"
                  value={newAssetCode}
                  onChange={(e) => setNewAssetCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nombre / Identificador del Bien</label>
                <input
                  type="text"
                  placeholder="Ej: Servidor Dell PowerEdge"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Vida Útil Estimada (Meses)</label>
                <select
                  value={newAssetLife}
                  onChange={(e) => setNewAssetLife(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white"
                >
                  <option value={12}>12 Meses (1 Año)</option>
                  <option value={36}>36 Meses (3 Años)</option>
                  <option value={60}>60 Meses (5 Años)</option>
                  <option value={120}>120 Meses (10 Años)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAssetModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                disabled={!newAssetCode || !newAssetName}
                onClick={handleCreateAssetInline}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
              >
                Crear y Asignar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
