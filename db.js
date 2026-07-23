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

async function search(filters = {}) {
  const whereClauses = [];
  const params = [];
  let paramIndex = 1;

  if (filters.company) {
    whereClauses.push(`company ILIKE $${paramIndex}`);
    params.push(`%${filters.company}%`);
    paramIndex++;
  }

  if (filters.role) {
    whereClauses.push(`role ILIKE $${paramIndex}`);
    params.push(`%${filters.role}%`);
    paramIndex++;
  }

  if (filters.jd_text) {
    whereClauses.push(`jd_text ILIKE $${paramIndex}`);
    params.push(`%${filters.jd_text}%`);
    paramIndex++;
  }

  if (filters.q) {
    // Quick search: match company, role, or jd_text
    whereClauses.push(`(company ILIKE $${paramIndex} OR role ILIKE $${paramIndex} OR jd_text ILIKE $${paramIndex})`);
    params.push(`%${filters.q}%`);
    paramIndex++;
  }

  if (filters.status) {
    whereClauses.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.date_from) {
    whereClauses.push(`date_applied >= $${paramIndex}`);
    params.push(filters.date_from);
    paramIndex++;
  }

  if (filters.date_to) {
    whereClauses.push(`date_applied <= $${paramIndex}`);
    params.push(filters.date_to);
    paramIndex++;
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM applications ${whereClause} ORDER BY date_applied DESC, id DESC`;

  return query(sql, params);
}

async function getEventsByAppId(appId) {
  return query('SELECT * FROM events WHERE app_id = $1 ORDER BY event_date DESC', [appId]);
}

async function insertEvent(appId, eventDate, note) {
  const rows = await query(
    `INSERT INTO events (app_id, event_date, note) VALUES ($1, $2, $3) RETURNING *`,
    [appId, eventDate, note]
  );
  return rows[0];
}

async function updateEvent(id, eventDate, note) {
  const rows = await query(
    `UPDATE events SET event_date = $1, note = $2 WHERE id = $3 RETURNING *`,
    [eventDate, note, id]
  );
  return rows[0] || null;
}

async function deleteEvent(id) {
  const rows = await query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
  return rows[0] || null;
}

module.exports = { query, getAll, getById, insert, update, nextId, search, getEventsByAppId, insertEvent, updateEvent, deleteEvent };
