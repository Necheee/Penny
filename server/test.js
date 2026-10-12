// test.js - Automated Test for Admin Login (Step 2) & Protected Route (Step 3)

const SERVER_URL = 'http://localhost:5000';

async function runTests() {
  console.log('\n======================================================');
  console.log('   PENNY BACKEND SERVER TEST (LOGIN & PROTECTED ROUTE)');
  console.log('======================================================\n');

  try {
    // -----------------------------------------------------------------
    // TEST 1: Health Check
    // -----------------------------------------------------------------
    console.log('1. Checking Server Health...');
    const healthRes = await fetch(`${SERVER_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log('   Status: ' + healthRes.status + ' OK');
    console.log('   Service: ' + healthData.service + '\n');

    // -----------------------------------------------------------------
    // TEST 2: Admin Login (Step 2)
    // -----------------------------------------------------------------
    console.log('2. Testing Admin Login with Owner Credentials...');
    const loginPayload = {
      email: 'owner@penny.com',
      password: 'PennyAdmin2026!'
    };

    const loginRes = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginPayload)
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      console.error('   ❌ Login Failed:', loginData.message);
      return;
    }

    console.log('   ✅ Login Succeeded!');
    console.log('   User Name:', loginData.user.name);
    console.log('   User Role:', loginData.user.role);
    console.log('   Token Generated (first 25 chars):', loginData.token.substring(0, 25) + '...\n');

    const adminToken = loginData.token;

    // -----------------------------------------------------------------
    // TEST 3: Accessing Protected Route (Step 3)
    // -----------------------------------------------------------------
    console.log('3. Testing Protected Route (/api/auth/me) with JWT Token...');
    const meRes = await fetch(`${SERVER_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const meData = await meRes.json();

    if (!meRes.ok) {
      console.error('   ❌ Protected Route Access Failed:', meData.message);
      return;
    }

    console.log('   ✅ Protected Access Succeeded!');
    console.log('   Verified Profile ID:', meData.user.id);
    console.log('   Verified Role:', meData.user.role);
    console.log('\n======================================================');
    console.log('   🎉 ALL TESTS PASSED! YOUR BACKEND IS FULLY WORKING.');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n❌ Could not connect to the server.');
    console.error('   Make sure you started the backend server first by running:');
    console.error('   cd server');
    console.error('   npm start\n');
  }
}

runTests();

