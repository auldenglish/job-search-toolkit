// migrate.js — imports applications.json into PostgreSQL
// Run once: node migrate.js

const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'job_search',
  user: 'jobsearch',
  password: 'jobsearch',
});

function parseDate(val) {
  if (!val || val.trim() === '') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : val.trim();
}

async function main() {
  const raw = fs.readFileSync('./applications.json', 'utf8');
  const apps = JSON.parse(raw);

  await client.connect();

  // Check target is empty
  const { rows } = await client.query('SELECT COUNT(*) FROM applications');
  if (parseInt(rows[0].count) > 0) {
    console.error('Table already has rows — aborting to avoid duplicates. Truncate first if you want to re-run.');
    process.exit(1);
  }

  let inserted = 0;
  for (const app of apps) {
    await client.query(
      `INSERT INTO applications
        (company, role, jd_url, date_applied, status, closed_reason,
         resume_version, cover_letter, notes, next_activity_date,
         follow_up_date, todos, comments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        app.company,
        app.role,
        app.jd_url || null,
        parseDate(app.date_applied),
        app.status || null,
        app.closed_reason || null,
        app.resume_version || null,
        app.cover_letter === true,
        app.notes || '',
        parseDate(app.next_activity_date),
        parseDate(app.follow_up_date),
        JSON.stringify(app.todos || []),
        JSON.stringify(app.comments || []),
      ]
    );
    console.log(`  Inserted: [${app.id}] ${app.company} — ${app.role}`);
    inserted++;
  }

  // Reset sequence to continue after migrated data
  await client.query(`SELECT setval('applications_id_seq', (SELECT MAX(id) FROM applications))`);

  await client.end();
  console.log(`\nDone. ${inserted} records migrated.`);
}

main().catch(err => { console.error(err); process.exit(1); });
