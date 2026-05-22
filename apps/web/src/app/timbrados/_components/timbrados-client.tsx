"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { AlertTriangle, CheckCircle, Clock, Plus, XCircle } from "lucide-react";
import {
  type TimbradoRow,
  type TimbradoInput,
  loadTimbrados,
  createTimbrado,
  toggleTimbrado,
} from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  entities: Array<{ id: string; legalName: string; ruc: string }>;
  initialTimbrados: TimbradoRow[];
  dbError?: string;
}

// ─── Urgency helpers ──────────────────────────────────────────────────────────

function UrgencyBadge({ urgency, daysLeft }: { urgency: TimbradoRow["urgency"]; daysLeft: number }) {
  if (urgency === "expired") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Vencido
      </Badge>
    );
  }
  if (urgency === "critical") {
    return (
      <Badge className="gap-1 bg-orange-500 text-white hover:bg-orange-600">
        <AlertTriangle className="h-3 w-3" />
        {daysLeft}d
      </Badge>
    );
  }
  if (urgency === "warn") {
    return (
      <Badge className="gap-1 bg-yellow-500 text-white hover:bg-yellow-600">
        <Clock className="h-3 w-3" />
        {daysLeft}d
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-green-600 text-white hover:bg-green-700">
      <CheckCircle className="h-3 w-3" />
      {daysLeft}d
    </Badge>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

function SummaryCards({ timbrados }: { timbrados: TimbradoRow[] }) {
  const active   = timbrados.filter((t) => t.isActive);
  const expired  = active.filter((t) => t.urgency === "expired");
  const critical = active.filter((t) => t.urgency === "critical");
  const warn     = active.filter((t) => t.urgency === "warn");
  const ok       = active.filter((t) => t.urgency === "ok");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-green-700 font-medium">Vigentes</p>
          <p className="text-2xl font-bold text-green-800">{ok.length}</p>
        </CardContent>
      </Card>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-yellow-700 font-medium">Por vencer (≤60d)</p>
          <p className="text-2xl font-bold text-yellow-800">{warn.length}</p>
        </CardContent>
      </Card>
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-orange-700 font-medium">Críticos (≤15d)</p>
          <p className="text-2xl font-bold text-orange-800">{critical.length}</p>
        </CardContent>
      </Card>
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-red-700 font-medium">Vencidos</p>
          <p className="text-2xl font-bold text-red-800">{expired.length}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── New timbrado form ────────────────────────────────────────────────────────

const TIPOS = [
  { value: "factura",        label: "Factura" },
  { value: "nota_credito",   label: "Nota de Crédito" },
  { value: "nota_debito",    label: "Nota de Débito" },
  { value: "autofactura",    label: "Autofactura" },
  { value: "nota_remision",  label: "Nota de Remisión" },
];

function NuevoTimbradoForm({
  entities,
  onCreated,
  onClose,
}: {
  entities: Props["entities"];
  onCreated: (t: TimbradoRow) => void;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TimbradoInput>({
    entityId:        "",
    numero:          "",
    tipo:            "factura",
    puntoEmision:    "",
    establecimiento: "",
    rangoDesde:      "",
    rangoHasta:      "",
    validoDesde:     "",
    validoHasta:     "",
    notas:           "",
  });

  function set(key: keyof TimbradoInput, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTimbrado(form);
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
        {/* Empresa */}
        <div className="col-span-2 space-y-1">
          <Label>Empresa *</Label>
          <Select value={form.entityId} onValueChange={(v) => set("entityId", v)}>
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

        {/* Número */}
        <div className="space-y-1">
          <Label>Número de timbrado *</Label>
          <Input
            value={form.numero}
            onChange={(e) => set("numero", e.target.value)}
            placeholder="12345678"
            maxLength={20}
          />
        </div>

        {/* Tipo */}
        <div className="space-y-1">
          <Label>Tipo de comprobante</Label>
          <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Punto de emisión / Establecimiento */}
        <div className="space-y-1">
          <Label>Punto de emisión</Label>
          <Input
            value={form.puntoEmision}
            onChange={(e) => set("puntoEmision", e.target.value)}
            placeholder="001"
            maxLength={10}
          />
        </div>
        <div className="space-y-1">
          <Label>Establecimiento</Label>
          <Input
            value={form.establecimiento}
            onChange={(e) => set("establecimiento", e.target.value)}
            placeholder="001"
            maxLength={10}
          />
        </div>

        {/* Rango de numeración */}
        <div className="space-y-1">
          <Label>Rango desde</Label>
          <Input
            value={form.rangoDesde}
            onChange={(e) => set("rangoDesde", e.target.value)}
            placeholder="0000001"
            maxLength={20}
          />
        </div>
        <div className="space-y-1">
          <Label>Rango hasta</Label>
          <Input
            value={form.rangoHasta}
            onChange={(e) => set("rangoHasta", e.target.value)}
            placeholder="9999999"
            maxLength={20}
          />
        </div>

        {/* Vigencia */}
        <div className="space-y-1">
          <Label>Válido desde *</Label>
          <Input
            type="date"
            value={form.validoDesde}
            onChange={(e) => set("validoDesde", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Válido hasta *</Label>
          <Input
            type="date"
            value={form.validoHasta}
            onChange={(e) => set("validoHasta", e.target.value)}
          />
        </div>

        {/* Notas */}
        <div className="col-span-2 space-y-1">
          <Label>Notas</Label>
          <Input
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            placeholder="Observaciones opcionales"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar timbrado"}
        </Button>
      </div>
    </form>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function TimbradosClient({ entities, initialTimbrados, dbError }: Props) {
  const [timbrados, setTimbrados] = useState<TimbradoRow[]>(initialTimbrados);
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [filterStatus, setFilterStatus]  = useState<string>("all");
  const [dialogOpen, setDialogOpen]      = useState(false);
  const [toggling, startToggle]          = useTransition();

  // ─── Reload after entity filter change ──────────────────────────────────────
  const [loadPending, startLoad] = useTransition();

  function handleEntityFilter(entityId: string) {
    setFilterEntity(entityId);
    startLoad(async () => {
      const r = await loadTimbrados(entityId === "all" ? undefined : entityId);
      if (r.ok) setTimbrados(r.data);
    });
  }

  // ─── Toggle active ───────────────────────────────────────────────────────────
  function handleToggle(id: string, current: boolean) {
    startToggle(async () => {
      const r = await toggleTimbrado(id, !current);
      if (r.ok) {
        setTimbrados((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive: !current } : t))
        );
      }
    });
  }

  // ─── Filter ──────────────────────────────────────────────────────────────────
  const displayed = timbrados.filter((t) => {
    if (filterStatus === "active"   && !t.isActive) return false;
    if (filterStatus === "inactive" &&  t.isActive) return false;
    if (filterStatus === "expired"  && t.urgency !== "expired") return false;
    if (filterStatus === "critical" && t.urgency !== "critical") return false;
    return true;
  });

  // ─── Urgency alerts ──────────────────────────────────────────────────────────
  const alerts = timbrados.filter(
    (t) => t.isActive && (t.urgency === "critical" || t.urgency === "expired")
  );

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timbrados DNIT</h1>
          <p className="text-sm text-muted-foreground">
            Autorizaciones fiscales por empresa — vigencia y rangos de numeración
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo timbrado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar timbrado</DialogTitle>
            </DialogHeader>
            <NuevoTimbradoForm
              entities={entities}
              onCreated={(t) => setTimbrados((prev) => [t, ...prev])}
              onClose={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* DB error */}
      {dbError && (
        <Alert variant="destructive">
          <AlertDescription>{dbError}</AlertDescription>
        </Alert>
      )}

      {/* Expiry alerts */}
      {alerts.length > 0 && (
        <Alert className="border-orange-300 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{alerts.length} timbrado(s)</strong> requieren atención:{" "}
            {alerts.map((a) => (
              <span key={a.id} className="mr-2">
                {a.entityName} — #{a.numero}
                {a.urgency === "expired" ? " (vencido)" : ` (${a.daysLeft}d restantes)`}
              </span>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <SummaryCards timbrados={timbrados.filter((t) => t.isActive)} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-64">
          <Select value={filterEntity} onValueChange={handleEntityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las empresas</SelectItem>
              {entities.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.legalName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
              <SelectItem value="expired">Vencidos</SelectItem>
              <SelectItem value="critical">Críticos (≤15d)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loadPending && (
          <span className="self-center text-sm text-muted-foreground">Cargando…</span>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {displayed.length} timbrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Punto / Est.</TableHead>
                  <TableHead>Rango</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Activo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay timbrados registrados.
                    </TableCell>
                  </TableRow>
                )}
                {displayed.map((t) => (
                  <TableRow
                    key={t.id}
                    className={
                      !t.isActive
                        ? "opacity-50"
                        : t.urgency === "expired"
                        ? "bg-red-50"
                        : t.urgency === "critical"
                        ? "bg-orange-50"
                        : t.urgency === "warn"
                        ? "bg-yellow-50"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium text-sm">
                      <div>{t.entityName}</div>
                    </TableCell>
                    <TableCell className="font-mono font-semibold">{t.numero}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {t.tipo.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.puntoEmision || "—"} / {t.establecimiento || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {t.rangoDesde && t.rangoHasta
                        ? `${t.rangoDesde} – ${t.rangoHasta}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="text-xs text-muted-foreground">
                        {t.validoDesde} →
                      </div>
                      <div className="font-medium">{t.validoHasta}</div>
                    </TableCell>
                    <TableCell>
                      {t.isActive ? (
                        <UrgencyBadge urgency={t.urgency} daysLeft={t.daysLeft} />
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={t.isActive}
                        onCheckedChange={() => handleToggle(t.id, t.isActive)}
                        disabled={toggling}
                        aria-label="Activar/desactivar timbrado"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
