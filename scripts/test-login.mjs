// Test directo del flujo de login
const baseUrl = 'http://localhost:3000';

async function testLogin() {
  console.log('=== Testing login flow ===\n');

  // Test owner login
  const email = process.argv[2] || 'joaquinguerrini1@gmail.com';
  const password = process.argv[3] || 'test';

  console.log(`Attempting login for: ${email}`);

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginType: 'owner', email, password }),
  });

  console.log('Status:', res.status);
  console.log('Set-Cookie headers:', res.headers.getSetCookie?.() ?? res.headers.get('set-cookie'));

  const body = await res.json();
  console.log('Response body:', JSON.stringify(body, null, 2));

  if (res.ok) {
    const cookie = res.headers.getSetCookie?.()[0] || res.headers.get('set-cookie');
    console.log('\n✅ Login OK - Cookie was set:', !!cookie);
    if (!cookie) {
      console.log('❌ WARNING: No Set-Cookie header in response!');
    }
  } else {
    console.log('\n❌ Login failed:', body.error);
  }
}

testLogin().catch(console.error);
