"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Calculator, Printer, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { type Formulario501, calcularIRE501 } from "../actions";

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(n));
}

// ─── Year options ─────────────────────────────────────────────────────────────

function buildYearOptions(defaultYear: number) {
  const years = [];
  for (let y = defaultYear + 1; y >= defaultYear - 5; y--) {
    years.push(y);
  }
  return years;
}

// ─── Régimen options ──────────────────────────────────────────────────────────

const REGIMENES = [
  { value: "general",  label: "IRE General — 10%" },
  { value: "simple",   label: "IRE Simplificado — 7%" },
  { value: "resimple", label: "IRE ReSimple — 3.5%" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  entities: Array<{ id: string; legalName: string; ruc: string }>;
  defaultYear: number;
  dbError?: string;
}

// ─── Print view ───────────────────────────────────────────────────────────────

function PrintView({ data }: { data: Formulario501 }) {
  return (
    <div className="hidden print:block font-mono text-xs space-y-2">
      <div className="text-center font-bold text-sm border-b pb-2 mb-4">
        FORMULARIO 501 — IMPUESTO A LA RENTA EMPRESARIAL (IRE)
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><strong>Empresa:</strong> {data.entityName}</div>
        <div><strong>RUC:</strong> {data.ruc}</div>
        <div><strong>Ejercicio fiscal:</strong> {data.ejercicio}</div>
        <div><strong>Régimen:</strong> {data.regimen.toUpperCase()}</div>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1 w-12">Cód.</th>
            <th className="text-left py-1">Concepto</th>
            <th className="text-right py-1 w-32">Monto (Gs.)</th>
          </tr>
        </thead>
        <tbody>
          {data.lineas.map((l) => (
            <tr key={l.codigo} className={`border-b ${l.esSeccion ? "font-bold bg-gray-100" : ""}`}>
              <td className="py-1 pr-2">{l.codigo}</td>
              <td className="py-1">{l.concepto}</td>
              <td className="py-1 text-right">
                {l.esSeccion ? "" : `Gs. ${fmt(l.monto)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-gray-400 mt-4">
        Generado: {new Date(data.generatedAt).toLocaleString("es-PY")} — InteliCont
      </div>
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function Formulario501Client({ entities, defaultYear, dbError }: Props) {
  const [entityId, setEntityId] = useState("");
  const [year, setYear]         = useState(String(defaultYear));
  const [regimen, setRegimen]   = useState<"general" | "simple" | "resimple">("general");
  const [result, setResult]     = useState<Formulario501 | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [pending, startCalc]    = useTransition();

  const yearOptions = buildYearOptions(defaultYear);

  function handleCalcular() {
    if (!entityId) { setError("Seleccioná una empresa"); return; }
    setError(null);
    startCalc(async () => {
      const r = await calcularIRE501(entityId, parseInt(year), regimen);
      if (!r.ok) { setError(r.error); return; }
      setResult(r.data);
    });
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Formulario 501 — IRE</h1>
          <p className="text-sm text-muted-foreground">
            Impuesto a la Renta Empresarial — Liquidación anual DNIT
          </p>
        </div>
        {result && (
          <Button variant="outline" className="gap-2 no-print" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        )}
      </div>

      {dbError && (
        <Alert variant="destructive">
          <AlertDescription>{dbError}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Card className="no-print">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 items-end">
            {/* Empresa */}
            <div className="col-span-2 space-y-1">
              <Label>Empresa</Label>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná empresa" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.legalName} — {e.ruc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ejercicio */}
            <div className="space-y-1">
              <Label>Ejercicio</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Régimen */}
            <div className="space-y-1">
              <Label>Régimen</Label>
              <Select value={regimen} onValueChange={(v) => setRegimen(v as typeof regimen)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIMENES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mt-4">
            <Button onClick={handleCalcular} disabled={pending} className="gap-2">
              <Calculator className="h-4 w-4" />
              {pending ? "Calculando…" : "Calcular IRE"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <>
          {/* Print version */}
          <PrintView data={result} />

          {/* Screen version */}
          <div className="space-y-4 print:hidden">
            {/* Entity header */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="font-bold text-lg">{result.entityName}</p>
                    <p className="text-sm text-muted-foreground">RUC {result.ruc} — Ejercicio {result.ejercicio}</p>
                  </div>
                  <Badge className="text-sm px-3 py-1" variant="outline">
                    IRE {result.regimen.toUpperCase()} — {(result.tasaIRE * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Warning if no posted entries */}
            {result.ingresosBrutos === 0 && result.costosYGastos === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No se encontraron asientos contables <strong>posteados</strong> para el ejercicio {result.ejercicio}.
                  Asegurate de postear los asientos antes de calcular.
                </AlertDescription>
              </Alert>
            )}

            {/* Calculation lines */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Liquidación IRE — Ejercicio {result.ejercicio}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-2 text-left w-16 text-muted-foreground">Cód.</th>
                      <th className="px-4 py-2 text-left text-muted-foreground">Concepto</th>
                      <th className="px-4 py-2 text-right text-muted-foreground w-40">Monto (Gs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lineas.map((l, i) => (
                      <tr
                        key={l.codigo}
                        className={`border-b ${
                          l.esSeccion
                            ? "bg-muted/50 font-semibold"
                            : "hover:bg-muted/20"
                        }`}
                      >
                        <td className="px-4 py-2 text-muted-foreground">{l.codigo}</td>
                        <td className="px-4 py-2">{l.concepto}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {!l.esSeccion && `Gs. ${fmt(l.monto)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Renta neta imponible
                  </p>
                  <p className="text-2xl font-bold text-blue-900 font-mono mt-1">
                    Gs. {fmt(result.rentaNeta)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-purple-700 font-medium">
                    IRE calculado ({(result.tasaIRE * 100).toFixed(1)}%)
                  </p>
                  <p className="text-2xl font-bold text-purple-900 font-mono mt-1">
                    Gs. {fmt(result.ireCalculado)}
                  </p>
                  {result.retencionesAcum > 0 && (
                    <p className="text-xs text-purple-600 mt-1">
                      − Gs. {fmt(result.retencionesAcum)} retenciones
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className={`border-2 ${result.ireSaldo > 0 ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
                <CardContent className="pt-4 pb-3">
                  <p className={`text-xs font-medium flex items-center gap-1 ${result.ireSaldo > 0 ? "text-red-700" : "text-green-700"}`}>
                    {result.ireSaldo > 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {result.ireSaldo > 0 ? "Saldo a pagar" : "A favor"}
                  </p>
                  <p className={`text-2xl font-bold font-mono mt-1 ${result.ireSaldo > 0 ? "text-red-900" : "text-green-900"}`}>
                    Gs. {fmt(result.ireSaldo)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs text-muted-foreground">
                Cálculo generado el {new Date(result.generatedAt).toLocaleString("es-PY")}.
                Esta liquidación es <strong>estimativa</strong> y no reemplaza la declaración oficial.
                Verificá con tu contador las deducciones aplicables según los artículos 15–22 de la Ley 6380/19.
                Las retenciones de IRE acumuladas se toman del módulo Tesaka.
              </AlertDescription>
            </Alert>
          </div>
        </>
      )}
    </div>
  );
}
