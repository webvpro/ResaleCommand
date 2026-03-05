import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

// Ensure Native fetch is used or fallback for older Node versions
const performFetch = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
const API_KEYS_COL = 'api_keys';

async function testHeadlessApi() {
    console.log('--- Setting up Test API Key ---');
    const testKey = 'test-api-key-' + Date.now();
    const tenantId = 'test-tenant-' + Date.now();
    
    try {
        await db.createDocument(DB_ID, API_KEYS_COL, ID.unique(), {
            key: testKey,
            name: 'Test Headless Scouter',
            userId: 'test-user-id',
            tenantId: tenantId,
            isActive: true
        });
        console.log('✅ Created temporary API key:', testKey);
    } catch (e) {
        console.error('❌ Failed to create API key in Appwrite:', e.message);
        return;
    }

    console.log('\n--- Calling /api/scout-and-save ---');
    const apiUrl = 'http://localhost:4321/api/scout-and-save';
    
    // Test dataset - a publicly accessible image 
    const requestBody = {
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png",
        notes: "This is an automated test of the headless API.",
        title: "Test Headless Item"
    };

    try {
        console.log(`Sending POST request to ${apiUrl}...`);
        const response = await performFetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testKey}` // Test endpoint security
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('\n✅ API Request Successful!');
            console.log('Generated Item Title:', data.aiAnalysis.title);
            console.log('Item Identity:', data.aiAnalysis.identity); 
            console.log('Saved Item ID:', data.itemId);
            console.log('\nFull JSON Response:\n', JSON.stringify(data, null, 2));
        } else {
            console.error('\n❌ API Error:', JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('\n❌ Network error testing API. Is the Astro server running on port 4321?:', err.message);
    }
}

testHeadlessApi();
