
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4321'; // Adjust port if needed

async function testFetch(testName, url) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`   URL: ${url}`);
    try {
        const res = await fetch(url);
        console.log(`   Status: ${res.status} ${res.statusText}`);
        
        if (res.ok) {
            const contentType = res.headers.get('content-type');
            console.log(`   Content-Type: ${contentType}`);
            if (contentType.includes('image')) {
                const buffer = await res.buffer();
                console.log(`   ✅ Success! Received ${buffer.length} bytes.`);
            } else {
                 const text = await res.text();
                 console.log(`   ⚠️ Warning: content-type is not image. Body: ${text.substring(0, 100)}`);
            }
        } else {
            const text = await res.text();
            console.log(`   ❌ Failed. Body: ${text}`);
        }
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }
}

// 1. Test Proxy Image with a simple valid image
await testFetch('Valid Direct Image', `${BASE_URL}/api/proxy-image?url=${encodeURIComponent('https://via.placeholder.com/150')}`);

// 2. Test Proxy Image with ShopGoodwill URL structure (if you have a known one)
// Note: This often fails if SGW blocks non-browser UAs, but our proxy adds one.
const sgwUrl = 'https://sgwproductimages.azureedge.net/23/12/15/123456789.jpg'; 
await testFetch('ShopGoodwill Image Structure', `${BASE_URL}/api/proxy-image?url=${encodeURIComponent(sgwUrl)}`);

// 3. Test Proxy Image with &amp; encoding (The bug fix)
const messyUrl = 'https://via.placeholder.com/150?text=A&amp;B'; 
await testFetch('Encoded URL (&amp;)', `${BASE_URL}/api/proxy-image?url=${encodeURIComponent(messyUrl)}`);

// 4. Test Extract Images API
async function testExtract(input) {
    console.log(`\n🧪 Testing Extract API with input: "${input}"`);
    try {
        const res = await fetch(`${BASE_URL}/api/extract-images`, {
            method: 'POST',
            body: JSON.stringify({ url: input }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        console.log(`   Result:`, data);
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }
}

// Test with an ID directly
await testExtract('253302322'); 
