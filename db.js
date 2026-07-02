// db.js — thin wrapper for job search DB operations
// Used by Claude during sessions to read/write applications

const { Client } = require('pg');

const CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'job_search',
  user: 'jobsearch',
  password: 'jobsearch',
};

async function query(sql, params = []) {
  const client = new Client(CONFIG);
  await client.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    await client.end();
  }
}

async function getAll() {
  return query('SELECT * FROM applications ORDER BY date_applied DESC, id DESC');
}

async function getById(id) {
  const rows = await query('SELECT * FROM applications WHERE id = $1', [id]);
  return rows[0] || null;
}

async function insert(app) {
  const rows = await query(
    `INSERT INTO applications
      (company, role, jd_url, date_applied, status, closed_reason,
       resume_version, cover_letter, notes, next_activity_date,
       follow_up_date, todos, comments, jd_text)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      app.company,
      app.role,
      app.jd_url || null,
      app.date_applied || null,
      app.status || 'submitted',
      app.closed_reason || null,
      app.resume_version || null,
      app.cover_letter === true,
      app.notes || '',
      app.next_activity_date || null,
      app.follow_up_date || null,
      JSON.stringify(app.todos || []),
      JSON.stringify(app.comments || []),
      app.jd_text || null,
    ]
  );
  return rows[0];
}

async function update(id, fields) {
  // created_at is intentionally updatable (the kanban card lets you set "Added on" manually).
  const SKIP = new Set(['id']);
  const entries = Object.entries(fields).filter(([k]) => !SKIP.has(k));
  if (entries.length === 0) return getById(id);

  const keys   = entries.map(([k]) => k);
  const values = entries.map(([, v]) => {
    if (v === null || v === undefined) return null;          // pass true SQL NULL
    if (typeof v === 'object') return JSON.stringify(v);     // arrays / objects → JSONB
    return v;
  });

  const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const rows = await query(
    `UPDATE applications SET ${setClauses} WHERE id = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );
  return rows[0] || null;
}

async function nextId() {
  const rows = await query(`SELECT nextval('applications_id_seq') AS id`);
  // Immediately reset — we just want to peek; insert will claim the real ID
  await query(`SELECT setval('applications_id_seq', $1 - 1, true)`, [rows[0].id]);
  return parseInt(rows[0].id);
}

module.exports = { query, getAll, getById, insert, update, nextId };
