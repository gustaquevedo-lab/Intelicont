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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Intelicont API (memory) listening on port ${port}`);
});
