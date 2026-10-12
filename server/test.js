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

    // -----------------------------------------------------------------
    // TEST 6: Cloud Media Upload Service (/api/admin/media/upload)
    // -----------------------------------------------------------------
    console.log('\n6. Testing Media Upload Service (/api/admin/media/upload)...');
    const fakeImageBuffer = Buffer.from('RIFF....WEBPVP8 ...fake-image-bytes');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const multipartBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="test.webp"\r\nContent-Type: image/webp\r\n\r\n`),
      fakeImageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const uploadRes = await fetch(`${SERVER_URL}/api/admin/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.success) {
      console.error('   ❌ Media upload test failed:', uploadData.message);
      return;
    }
    console.log('   ✅ Media Upload Endpoint Succeeded!');
    console.log('   Result Status:', uploadData.message);
    console.log('   Public Image URL preview:', uploadData.url.substring(0, 45) + '...');

    console.log('\n======================================================');
    console.log('   🎉 ALL TESTS PASSED! BACKEND, CATALOGUE & MEDIA LIVE.');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n❌ Could not connect to the server.');
    console.error('   Make sure you started the backend server first by running:');
    console.error('   cd server');
    console.error('   npm start\n');
  }
}

runTests();

