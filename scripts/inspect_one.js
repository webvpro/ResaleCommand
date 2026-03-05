
import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const COL_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID;

async function inspect() {
    console.log("Fetching first 5 items...");
    const res = await databases.listDocuments(DB_ID, COL_ID, [Query.limit(5)]);
    
    if (res.documents.length === 0) {
        console.log("No items found.");
        return;
    }

    res.documents.forEach((doc, i) => {
        console.log(`\n--- ITEM ${i+1} ---`);
        console.log("Title:", doc.title);
        // Log keys that look like URLs
        Object.keys(doc).forEach(key => {
            const val = doc[key];
            if (typeof val === 'string' && val.startsWith('http')) {
                console.log(`[URL Field] ${key}: ${val}`);
            }
        });
        // Also log description excerpt
        console.log("Description:", (doc.description || "").substring(0, 50) + "...");
    });
}

inspect().catch(console.error);
