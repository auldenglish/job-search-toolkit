// kanban-server.js — serves the job-search kanban board + a small REST API over db.js.
// Start:  node kanban-server.js   (or double-click launch-tracker.bat)
// Board:  http://localhost:3000/kanban.html

const express = require('express');
const db = require('./db');

const app = express();
const PORT = 3000;
const VALID_STATUSES = new Set(['submitted', 'interviewing', 'in_progress', 'stalled', 'closed']);

app.use(express.json());

// GET all applications
app.get('/api/applications', async (req, res) => {
  try {
    res.json(await db.getAll());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET search applications with filters
app.get('/api/applications/search', async (req, res) => {
  try {
    const filters = {
      q: req.query.q,
      company: req.query.company,
      role: req.query.role,
      jd_text: req.query.jd_text,
      status: req.query.status,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
    };
    const results = await db.search(filters);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST new application
app.post('/api/applications', async (req, res) => {
  try {
    const { company, role, status, date_applied } = req.body;
    if (!company || !role) return res.status(400).json({ error: 'company and role required' });
    const app = await db.insert({
      company,
      role,
      status: status || 'submitted',
      date_applied: date_applied || null,
    });
    res.status(201).json(app);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH an application (status change from drag-drop, or edited fields from the modal)
app.patch('/api/applications/:id', async (req, res) => {
  try {
    if ('status' in req.body && !VALID_STATUSES.has(req.body.status)) {
      return res.status(400).json({ error: `invalid status: ${req.body.status}` });
    }
    const updated = await db.update(parseInt(req.params.id, 10), req.body);
    if (!updated) return res.status(404).json({ error: 'application not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET events for an application
app.get('/api/events/:app_id', async (req, res) => {
  try {
    const events = await db.getEventsByAppId(parseInt(req.params.app_id, 10));
    res.json(events);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST new event
app.post('/api/events', async (req, res) => {
  try {
    const { app_id, event_date, note } = req.body;
    if (!app_id || !event_date || !note) {
      return res.status(400).json({ error: 'app_id, event_date, and note required' });
    }
    const event = await db.insertEvent(app_id, event_date, note);
    res.status(201).json(event);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH an event
app.patch('/api/events/:id', async (req, res) => {
  try {
    const { event_date, note } = req.body;
    if (!event_date || !note) {
      return res.status(400).json({ error: 'event_date and note required' });
    }
    const updated = await db.updateEvent(parseInt(req.params.id, 10), event_date, note);
    if (!updated) return res.status(404).json({ error: 'event not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE an event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const deleted = await db.deleteEvent(parseInt(req.params.id, 10));
    if (!deleted) return res.status(404).json({ error: 'event not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Root shows the board
app.get('/', (req, res) => res.redirect('/kanban.html'));

// Serve kanban.html and any static assets from this folder
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n  Kanban board running:  http://localhost:${PORT}/kanban.html`);
  console.log('  Press Ctrl+C to stop.\n');
});
