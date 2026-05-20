import pg from 'pg';
import { readFileSync } from 'fs';

// Read .env.local manually
const env = readFileSync('.env.local', 'utf-8');
const vars = Object.fromEntries(env.split('\n').filter(l => l.includes('=')).map(l => {
  const [k, ...v] = l.split('=');
  return [k.trim(), v.join('=').trim()];
}));

const pool = new pg.Pool({
  host: vars.DB_HOST,
  port: parseInt(vars.DB_PORT || '5432'),
  database: vars.DB_NAME,
  user: vars.DB_USER,
  password: vars.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

try {
  const r = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position"
  );
  console.log('users columns:', r.rows.map(x => x.column_name).join(', '));

  const u = await pool.query('SELECT id, email, user_type, username, password_hash IS NOT NULL as has_hash FROM users LIMIT 5');
  console.log('sample users:', JSON.stringify(u.rows, null, 2));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await pool.end();
}
