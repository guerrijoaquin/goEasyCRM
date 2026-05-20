import pg from 'pg';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';

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

const TEST_EMAIL = 'test@gocrm.dev';
const TEST_PASSWORD = 'test1234';

try {
  const hash = await bcrypt.hash(TEST_PASSWORD, 12);
  
  await pool.query(`DELETE FROM users WHERE email = $1`, [TEST_EMAIL]);
  
  const r = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, user_type)
     VALUES ($1, $2, 'Test User', 'owner')
     RETURNING id, email, user_type`,
    [TEST_EMAIL, hash]
  );
  console.log('Test user created:', r.rows[0]);
  
  // Now test login via API
  console.log('\nTesting login API...');
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginType: 'owner', email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  
  console.log('Status:', res.status);
  const setCookieHeaders = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
  console.log('Set-Cookie count:', setCookieHeaders.filter(Boolean).length);
  if (setCookieHeaders.length > 0) {
    console.log('Cookie preview:', setCookieHeaders[0]?.substring(0, 80));
  } else {
    console.log('❌ NO SET-COOKIE HEADER!');
  }
  
  const body = await res.json();
  console.log('Body:', body);

} catch(e) {
  console.error('Error:', e.message);
} finally {
  await pool.end();
}
