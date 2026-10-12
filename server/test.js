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

    // -----------------------------------------------------------------
    // TEST 4: Fetch Catalogue (Public Storefront)
    // -----------------------------------------------------------------
    console.log('\n4. Testing Catalogue API (/api/products)...');
    const prodRes = await fetch(`${SERVER_URL}/api/products`);
    const prodData = await prodRes.json();
    if (!prodRes.ok) {
      console.error('   ❌ Products fetch failed:', prodData.message);
      return;
    }
    console.log(`   ✅ Fetched ${prodData.count} products from PENNY catalogue.`);

    // -----------------------------------------------------------------
    // TEST 5: Fetch Categories & Size Guides
    // -----------------------------------------------------------------
    console.log('\n5. Testing Categories API (/api/categories)...');
    const catRes = await fetch(`${SERVER_URL}/api/categories`);
    const catData = await catRes.json();
    if (!catRes.ok) {
      console.error('   ❌ Categories fetch failed:', catData.message);
      return;
    }
    console.log(`   ✅ Fetched ${catData.count} categories:`, catData.data.map(c => c.name).join(', '));

    console.log('\n======================================================');
    console.log('   🎉 ALL TESTS PASSED! BACKEND & CATALOGUE ARE LIVE.');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n❌ Could not connect to the server.');
    console.error('   Make sure you started the backend server first by running:');
    console.error('   cd server');
    console.error('   npm start\n');
  }
}

runTests();

