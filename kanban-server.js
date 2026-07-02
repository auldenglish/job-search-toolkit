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

// Serve kanban.html and any static assets from this folder
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n  Kanban board running:  http://localhost:${PORT}/kanban.html`);
  console.log('  Press Ctrl+C to stop.\n');
});
