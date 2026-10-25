export interface ErrorReportData {
  id: string;
  fingerprint: string;
  tipoError: string;
  mensaje: string;
  path: string;
  metodo: string;
  statusCode: number;
  stacktrace: string;
  contextoJson?: string | null;
  entityId?: string | null;
  usuarioEmail?: string | null;
  ocurrencias: number;
  primeraVez: Date | string;
  ultimaVez: Date | string;
}

/**
 * Genera el reporte Markdown optimizado para copiar con 1-click y alimentar a un Agente AI.
 * Seguro para uso en el cliente y en el servidor.
 */
export function generarReporteMarkdown(err: ErrorReportData): string {
  const pVez = err.primeraVez instanceof Date ? err.primeraVez.toISOString() : String(err.primeraVez);
  const uVez = err.ultimaVez instanceof Date ? err.ultimaVez.toISOString() : String(err.ultimaVez);

  return `### # Incidente de Plataforma 5xx: \`${err.tipoError}\`

**ID Incidente:** \`${err.id}\`
**Fingerprint (SHA-256):** \`${err.fingerprint}\`
**Ruta / Endpoint:** \`${err.metodo} ${err.path}\`
**Status Code:** \`${err.statusCode}\`
**Ocurrencias:** ${err.ocurrencias} veces
**Primera vez:** ${pVez}
**Última vez:** ${uVez}
**Usuario:** ${err.usuarioEmail || "Anónimo / No autenticado"}
**Empresa / Tenant ID:** \`${err.entityId || "N/A"}\`

#### Mensaje de Error
> ${err.mensaje}

#### Stacktrace
\`\`\`
${err.stacktrace}
\`\`\`

#### Contexto HTTP
\`\`\`json
${err.contextoJson ? JSON.stringify(JSON.parse(err.contextoJson), null, 2) : "{}"}
\`\`\`

---
*Reporte generado por InteliCont Sentry-Lite para diagnóstico del Agente AI.*
`;
}
