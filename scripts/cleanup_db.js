
import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const requiredVars = [
    'PUBLIC_APPWRITE_ENDPOINT',
    'PUBLIC_APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'PUBLIC_APPWRITE_DB_ID',
    'PUBLIC_APPWRITE_COLLECTION_ID'
];

const missing = requiredVars.filter(key => !process.env[key]);
if (missing.length > 0) {
    console.error(`❌ Missing Environment Variables: ${missing.join(', ')}`);
    console.error(`Check your .env file path: ${resolve(__dirname, '../.env')}`);
    process.exit(1);
}

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const COL_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID;

const MAX_FETCH = 5000; // Safety cap

async function cleanup() {
    console.log("🔍 Scanning Inventory for Duplicates...");

    let allItems = [];
    let offset = 0;
    while(true) {
        // console.log(`Fetching batch at offset ${offset}...`);
        const res = await databases.listDocuments(DB_ID, COL_ID, [
            Query.limit(100),
            Query.offset(offset)
        ]);
        
        if(res.documents.length === 0) break;
        allItems.push(...res.documents);
        offset += res.documents.length;
        if(allItems.length >= MAX_FETCH) break;
    }
    
    console.log(`✅ Total Items Scanned: ${allItems.length}`);

    // Group by Title + Price + Location (Signature)
    // Adjust signature key to be strictly what defines a "Duplicate" for you
    const groups = {};
    allItems.forEach(item => {
        // Use 'identity' (Item ID) as the primary key for duplicates
        const signature = item.identity ? `ID_${item.identity}` : `SIG_${item.title}_${item.paidPrice}`;
        
        if (!groups[signature]) groups[signature] = [];
        groups[signature].push(item);
    });

    let duplicatesCount = 0;
    let toDelete = [];

    Object.keys(groups).forEach(sig => {
        const items = groups[sig];
        if (items.length > 1) {
            duplicatesCount += (items.length - 1);
            // Sort by creation time, keep oldest
            items.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));
            
            // Keep first (oldest), mark rest for death
            const [keeper, ...trash] = items;
            trash.forEach(t => toDelete.push(t));
            
            console.log(`Found Duplicate Group: "${sig}" (${items.length} copies) -> Keeping ${keeper.$id}`);
        }
    });

    console.log(`\n📋 Summary: Found ${duplicatesCount} duplicate items to remove.`);

    if (process.argv.includes('--run')) {
        console.log("🚀 DELETING duplicates now...");
        for (const item of toDelete) {
            try {
                process.stdout.write(`Deleting ${item.$id}... `);
                await databases.deleteDocument(DB_ID, COL_ID, item.$id);
                console.log("Deleted");
            } catch (e) {
                console.log("Failed: " + e.message);
            }
        }
        console.log("✨ Cleanup Complete!");
    } else {
        console.log("⚠️  Dry Run Only. Pass --run to execute deletion.");
    }
}

cleanup().catch(console.error);
