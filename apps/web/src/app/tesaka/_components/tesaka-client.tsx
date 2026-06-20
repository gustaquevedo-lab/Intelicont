"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Download, Plus, Trash2 } from "lucide-react";
import {
  type RetencionRow,
  type RetencionInput,
  type ResumenPeriodo,
  loadRetenciones,
  loadResumenPeriodos,
  createRetencion,
  deleteRetencion,
  marcarDeclarado,
  exportCsvTesaka,
} from "../actions";

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("es-PY", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// ─── Tipos de retención ───────────────────────────────────────────────────────

const TIPOS_RETENCION = [
  { value: "iva_10",         label: "IVA 10%  — tasa 30% del IVA" },
  { value: "iva_5",          label: "IVA 5%   — tasa 30% del IVA" },
  { value: "ire_honorarios", label: "IRE Honorarios — 8%" },
  { value: "ire_pagos",      label: "IRE Pagos al Estado — 2.5%" },
  { value: "irc",            label: "IRC No Residentes — 15%" },
];

const DOC_TIPOS = ["factura", "autofactura", "nota_credito", "nota_debito", "otro"];

// ─── Current period default ───────────────────────────────────────────────────

function getCurrentPeriod() {
  const now = new Date();
  // Retenciones are usually for previous month
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

// ─── New retencion form ───────────────────────────────────────────────────────

function NuevaRetencionForm({
  entityId,
  year,
  month,
  onCreated,
  onClose,
}: {
  entityId: string;
  year: number;
  month: number;
  onCreated: (r: RetencionRow) => void;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<Omit<RetencionInput, "entityId" | "periodoYear" | "periodoMonth">>({
    fecha:          today,
    terceroRuc:     "",
    terceroNombre:  "",
    docTipo:        "factura",
    docNumero:      "",
    montoBase:      0,
    tipoRetencion:  "iva_10",
    comprobanteRet: "",
  });

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createRetencion({
        entityId,
        periodoYear:  year,
        periodoMonth: month,
        ...form,
      });
      if (!result.ok) { setError(result.error); return; }
      onCreated(result.data);
      onClose();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Fecha */}
        <div className="space-y-1">
          <Label>Fecha del comprobante *</Label>
          <Input
            type="date"
            value={form.fecha}
            onChange={(e) => set("fecha", e.target.value)}
          />
        </div>

        {/* Tipo retención */}
        <div className="space-y-1">
          <Label>Tipo de retención *</Label>
          <Select value={form.tipoRetencion} onValueChange={(v) => set("tipoRetencion", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_RETENCION.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* RUC */}
        <div className="space-y-1">
          <Label>RUC del tercero *</Label>
          <Input
            value={form.terceroRuc}
            onChange={(e) => set("terceroRuc", e.target.value)}
            placeholder="80123456-7"
            maxLength={20}
          />
        </div>

        {/* Nombre */}
        <div className="space-y-1">
          <Label>Nombre / Razón social *</Label>
          <Input
            value={form.terceroNombre}
            onChange={(e) => set("terceroNombre", e.target.value)}
            placeholder="Empresa S.A."
          />
        </div>

        {/* Tipo documento */}
        <div className="space-y-1">
          <Label>Tipo comprobante</Label>
          <Select value={form.docTipo} onValueChange={(v) => set("docTipo", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TIPOS.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t.replace("_"," ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nro comprobante */}
        <div className="space-y-1">
          <Label>Nro. comprobante</Label>
          <Input
            value={form.docNumero}
            onChange={(e) => set("docNumero", e.target.value)}
            placeholder="001-001-0001234"
            maxLength={20}
          />
        </div>

        {/* Monto base */}
        <div className="space-y-1">
          <Label>Monto base (Gs.) *</Label>
          <Input
            type="number"
            min={1}
            step="1"
            value={form.montoBase || ""}
            onChange={(e) => set("montoBase", parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
        </div>

        {/* Comprobante de retención */}
        <div className="space-y-1">
          <Label>Nro. comprobante retención</Label>
          <Input
            value={form.comprobanteRet}
            onChange={(e) => set("comprobanteRet", e.target.value)}
            placeholder="001-001-0000001"
            maxLength={20}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar retención"}
        </Button>
      </div>
    </form>
  );
}

// ─── Resumen list ─────────────────────────────────────────────────────────────

interface Props {
  entities: Array<{ id: string; legalName: string; ruc: string }>;
  dbError?: string;
}

export function TesakaClient({ entities, dbError }: Props) {
  const [entityId, setEntityId]         = useState("");
  const [periodos, setPeriodos]         = useState<ResumenPeriodo[]>([]);
  const [selected, setSelected]         = useState<{ year: number; month: number } | null>(null);
  const [retenciones, setRetenciones]   = useState<RetencionRow[]>([]);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [loadPending, startLoad]        = useTransition();
  const [actionPending, startAction]    = useTransition();
  const [error, setError]               = useState<string | null>(null);

  const { year: curYear, month: curMonth } = getCurrentPeriod();

  // ─── Load entity periods ────────────────────────────────────────────────────
  function handleEntityChange(id: string) {
    setEntityId(id);
    setSelected(null);
    setRetenciones([]);
    startLoad(async () => {
      const r = await loadResumenPeriodos(id);
      if (r.ok) setPeriodos(r.data);
    });
  }

  // ─── Select period ──────────────────────────────────────────────────────────
  function handleSelectPeriodo(year: number, month: number) {
    setSelected({ year, month });
    startLoad(async () => {
      const r = await loadRetenciones(entityId, year, month);
      if (r.ok) setRetenciones(r.data);
    });
  }

  // ─── Declare period ─────────────────────────────────────────────────────────
  function handleDeclarar() {
    if (!selected || !entityId) return;
    startAction(async () => {
      const r = await marcarDeclarado(entityId, selected.year, selected.month);
      if (!r.ok) { setError(r.error); return; }
      setRetenciones((prev) => prev.map((x) => ({ ...x, status: "declarado" })));
      setPeriodos((prev) =>
        prev.map((p) =>
          p.periodoYear === selected.year && p.periodoMonth === selected.month
            ? { ...p, declarado: true }
            : p
        )
      );
    });
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────
  function handleDelete(id: string) {
    startAction(async () => {
      const r = await deleteRetencion(id);
      if (!r.ok) { setError(r.error); return; }
      setRetenciones((prev) => prev.filter((x) => x.id !== id));
      if (selected) {
        const r2 = await loadResumenPeriodos(entityId);
        if (r2.ok) setPeriodos(r2.data);
      }
    });
  }

  // ─── Export CSV ─────────────────────────────────────────────────────────────
  function handleExport() {
    if (!selected || !entityId) return;
    startAction(async () => {
      const r = await exportCsvTesaka(entityId, selected.year, selected.month);
      if (!r.ok) { setError(r.error); return; }
      const blob = new Blob(["﻿" + r.data], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `retenciones_${selected.year}_${String(selected.month).padStart(2, "0")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const totales = retenciones.reduce(
    (acc, r) => ({ base: acc.base + r.montoBase, ret: acc.ret + r.montoRetencion }),
    { base: 0, ret: 0 }
  );

  const periodoDeclarado = selected
    ? periodos.find((p) => p.periodoYear === selected.year && p.periodoMonth === selected.month)?.declarado ?? false
    : false;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tesaka — Retenciones</h1>
        <p className="text-sm text-muted-foreground">
          Libro de retenciones (Formulario 120) — IVA e IRE
        </p>
      </div>

      {dbError && (
        <Alert variant="destructive">
          <AlertDescription>{dbError}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Entity selector */}
      <div className="flex gap-3 flex-wrap items-end">
        <div className="w-80 space-y-1">
          <Label>Empresa</Label>
          <Select value={entityId} onValueChange={handleEntityChange}>
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
        {loadPending && <span className="text-sm text-muted-foreground">Cargando…</span>}
      </div>

      {/* Main layout: periods list + detail */}
      {entityId && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* ─── Periodos sidebar ─────────────────────────────────────────── */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Períodos</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handleSelectPeriodo(curYear, curMonth)}
              >
                Período actual
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {periodos.length === 0 && !loadPending && (
                <p className="text-sm text-muted-foreground p-4">
                  Sin retenciones registradas.
                </p>
              )}
              {periodos.map((p) => (
                <button
                  key={`${p.periodoYear}-${p.periodoMonth}`}
                  onClick={() => handleSelectPeriodo(p.periodoYear, p.periodoMonth)}
                  className={`w-full text-left px-4 py-3 border-b text-sm hover:bg-muted/50 transition-colors ${
                    selected?.year === p.periodoYear && selected?.month === p.periodoMonth
                      ? "bg-muted font-semibold"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{p.periodoLabel}</span>
                    {p.declarado ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Badge variant="outline" className="text-xs">Borrador</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.count} ret. — Gs. {fmt(p.totalRetencion)}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* ─── Detail ──────────────────────────────────────────────────── */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">
                  {selected
                    ? `Retenciones — ${periodos.find((p) => p.periodoYear === selected.year && p.periodoMonth === selected.month)?.periodoLabel ?? `${selected.month}/${selected.year}`}`
                    : "Seleccioná un período"}
                </CardTitle>
                {selected && (
                  <div className="flex gap-2 flex-wrap">
                    {/* Export */}
                    <Button size="sm" variant="outline" className="gap-1" onClick={handleExport} disabled={actionPending || retenciones.length === 0}>
                      <Download className="h-3 w-3" />
                      CSV
                    </Button>
                    {/* Declare */}
                    {!periodoDeclarado && (
                      <Button size="sm" variant="secondary" className="gap-1" onClick={handleDeclarar} disabled={actionPending || retenciones.length === 0}>
                        <CheckCircle className="h-3 w-3" />
                        Marcar declarado
                      </Button>
                    )}
                    {/* New */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-1" disabled={periodoDeclarado}>
                          <Plus className="h-3 w-3" />
                          Nueva retención
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Registrar retención</DialogTitle>
                        </DialogHeader>
                        <NuevaRetencionForm
                          entityId={entityId}
                          year={selected.year}
                          month={selected.month}
                          onCreated={(r) => {
                            setRetenciones((prev) => [...prev, r]);
                            // refresh periods
                            loadResumenPeriodos(entityId).then((res) => {
                              if (res.ok) setPeriodos(res.data);
                            });
                          }}
                          onClose={() => setDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {!selected ? (
                <p className="text-sm text-muted-foreground p-6 text-center">
                  Seleccioná un período para ver el detalle de retenciones.
                </p>
              ) : (
                <>
                  {periodoDeclarado && (
                    <Alert className="m-4 border-green-300 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Período marcado como declarado ante DNIT.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tercero</TableHead>
                          <TableHead>Comprobante</TableHead>
                          <TableHead>Tipo retención</TableHead>
                          <TableHead className="text-right">Base (Gs.)</TableHead>
                          <TableHead className="text-right">Retención (Gs.)</TableHead>
                          <TableHead>Comprobante Ret.</TableHead>
                          {!periodoDeclarado && <TableHead />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {retenciones.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              Sin retenciones en este período.
                            </TableCell>
                          </TableRow>
                        )}
                        {retenciones.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-sm">{r.fecha}</TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">{r.terceroNombre}</div>
                              <div className="text-xs text-muted-foreground">{r.terceroRuc}</div>
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="capitalize">{r.docTipo.replace("_"," ")}</div>
                              {r.docNumero && <div className="text-xs text-muted-foreground font-mono">{r.docNumero}</div>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {r.tipoLabel}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {fmt(r.montoBase)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {fmt(r.montoRetencion)}
                            </TableCell>
                            <TableCell className="text-sm font-mono text-muted-foreground">
                              {r.comprobanteRet ?? "—"}
                            </TableCell>
                            {!periodoDeclarado && (
                              <TableCell>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(r.id)}
                                  disabled={actionPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totals */}
                  {retenciones.length > 0 && (
                    <div className="border-t bg-muted/30 px-4 py-3 flex justify-end gap-8 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total base:</span>{" "}
                        <span className="font-semibold font-mono">Gs. {fmt(totales.base)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total retenciones:</span>{" "}
                        <span className="font-bold font-mono text-base">Gs. {fmt(totales.ret)}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
