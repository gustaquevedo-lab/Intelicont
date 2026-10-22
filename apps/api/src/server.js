const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());

// Simple in-memory store (default, for MVP)
const store = {
  entities: {},
  periods: {},
  journalEntries: {},
  journalLines: {},
};

function uid() {
  return 'id-' + Math.random().toString(36).slice(2, 9);
}

function ensureContext(req) {
  // Read entity and user from headers (X-Entity-Id, X-User-Id) for MVP
  req.entityId = (req.headers['x-entity-id'] || req.query.entity_id || 'default-entity');
  req.userId = (req.headers['x-user-id'] || req.query.user_id || 'anonymous');
}

app.post('/companies', (req, res) => {
  ensureContext(req);
  const id = uid();
  const { ruc, legal_name, base_currency = 'PYG' } = req.body || {};
  const entity = { id, ruc, legal_name, base_currency, created_by: req.userId };
  store.entities[id] = entity;
  res.json({ entity, ok: true });
});

app.post('/periods', (req, res) => {
  ensureContext(req);
  const id = uid();
  const { entity_id, year, month } = req.body;
  const period = { id, entity_id: entity_id || req.entityId, year, month, status: 'open' };
  store.periods[id] = period;
  res.json({ period, ok: true });
});

app.post('/journal_entries', (req, res) => {
  ensureContext(req);
  const eeId = uid();
  const { entity_id, period_id, date, source, lines, description } = req.body;
  // naive validation: ensure balance
  const linesParsed = (lines || []).map(l => ({ ...l, debit: String(l.debit || 0), credit: String(l.credit || 0) }));
  const totalDebit = linesParsed.reduce((a, l) => a + (parseFloat(l.debit) || 0), 0);
  const totalCredit = linesParsed.reduce((a, l) => a + (parseFloat(l.credit) || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.0001) {
    return res.status(400).json({ error: 'Unbalanced journal entry' });
  }
  const entry = { id: eeId, entity_id: entity_id || req.entityId, period_id, date, source, description, status: 'posted', postedAt: new Date().toISOString(), posted_by: req.userId, lines: linesParsed };
  store.journalEntries[eeId] = entry;
  // store lines
  entry.lines.forEach((ln, idx) => {
    const lid = uid();
    store.journalLines[lid] = { id: lid, entryId: eeId, accountId: ln.accountId, debit: ln.debit, credit: ln.credit, currency_code: ln.currency_code, fx_rate: ln.fx_rate, amount_base: ln.amount_base };
  });
  res.json({ entry_id: eeId, ok: true, entry });
});

// ─── Integrations ─────────────────────────────────────────────────────────

/**
 * Recibe cierre de nómina de SueldOK y propone asientos contables
 */
app.post('/v1/integrations/sueldok/payroll-closed', (req, res) => {
  ensureContext(req);
  const { payroll_id, total_amount, cost_centers, period } = req.body;
  console.log(`[Integration] SueldOK: Recibido cierre de nómina ${payroll_id}`);
  
  // En producción, aquí se crearía un JournalEntry en estado 'draft' (borrador)
  // para que el contador lo apruebe en el dashboard.
  res.json({ 
    ok: true, 
    message: 'Nómina recibida. Asiento contable sugerido en borradores.',
    suggested_entry_id: uid()
  });
});

/**
 * Recibe hallazgos (findings) de InteliAudit
 */
app.post('/v1/integrations/inteliaudit/findings', (req, res) => {
  ensureContext(req);
  const { audit_id, findings } = req.body;
  console.log(`[Integration] InteliAudit: Recibidos ${findings?.length} hallazgos para auditoría ${audit_id}`);
  
  // Los hallazgos se convierten en tareas en la 'Checklist de Cierre' de InteliCont
  res.json({ ok: true, tasks_created: findings?.length || 0 });
});

/**
 * Recibe operaciones de Intelicambios y las convierte en asientos contables
 */
app.post('/v1/integrations/intelicambios/journal-entry', (req, res) => {
  ensureContext(req);
  const { entity_ruc, date, description, source, lines, external_ref } = req.body;
  
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos una línea de asiento' });
  }
  
  // Buscar entidad por RUC o crear temporal
  let entityId = null;
  for (const [eid, ent] of Object.entries(store.entities)) {
    if (ent.ruc === entity_ruc) {
      entityId = eid;
      break;
    }
  }
  if (!entityId) {
    entityId = uid();
    store.entities[entityId] = { id: entityId, ruc: entity_ruc, legal_name: `Intelicambios - ${entity_ruc}`, base_currency: 'PYG', source: 'intelicambios' };
  }
  
  // Validar balance
  const linesParsed = lines.map(l => ({
    account_id: l.account_code,
    debit: String(l.debit || 0),
    credit: String(l.credit || 0),
    currency_code: l.currency_code || 'PYG',
    description: l.description || ''
  }));
  const totalDebit = linesParsed.reduce((a, l) => a + (parseFloat(l.debit) || 0), 0);
  const totalCredit = linesParsed.reduce((a, l) => a + (parseFloat(l.credit) || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.0001) {
    return res.status(400).json({ error: `Asiento desbalanceado: debe ${totalDebit} vs haber ${totalCredit}` });
  }
  
  const entryId = uid();
  const entry = {
    id: entryId,
    entity_id: entityId,
    date: date || new Date().toISOString().split('T')[0],
    source: source || 'intelicambios',
    description: description || 'Operación Intelicambios',
    status: 'posted',
    external_ref: external_ref || null,
    postedAt: new Date().toISOString(),
    posted_by: req.userId || 'intelicambios',
    lines: linesParsed
  };
  store.journalEntries[entryId] = entry;
  
  linesParsed.forEach((ln, idx) => {
    const lid = uid();
    store.journalLines[lid] = { id: lid, entryId, ...ln };
  });
  
  console.log(`[Integration] Intelicambios: Asiento contable ${entryId} registrado (ref: ${external_ref})`);
  res.json({ ok: true, entry_id: entryId, entry });
});

/**
 * Endpoint de health para integraciones
 */
app.get('/v1/integrations/health', (req, res) => {
  res.json({
    ok: true,
    service: 'intelicont-api',
    integrations: ['sueldok', 'inteliaudit', 'intelicambios'],
    entries_count: Object.keys(store.journalEntries).length,
    entities_count: Object.keys(store.entities).length
  });
});

/**
 * Endpoint para que InteliAudit descargue un snapshot de saldos
 */
app.get('/v1/snapshots/:periodId', (req, res) => {
  const { periodId } = req.params;
  const hmac = req.headers['x-inteli-signature'];
  
  if (!hmac) {
    return res.status(401).json({ error: 'Firma HMAC requerida' });
  }

  // Generar snapshot de saldos (Balance de Sumas y Saldos)
  res.json({
    period_id: periodId,
    timestamp: new Date().toISOString(),
    hash: 'sha256-placeholder',
    balances: [
      { account: '1.1.01.01', name: 'Caja', debit: '1500000', credit: '0', balance: '1500000' },
      { account: '2.1.01.01', name: 'Proveedores', debit: '0', credit: '500000', balance: '-500000' },
    ]
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`
  🚀 InteliCont API (MVP)
  ───────────────────────────────────
  Local:   http://localhost:${port}
  Status:  Running (In-Memory Store)
  DNA:     Premium / AI-First
  ───────────────────────────────────
  `);
});
