import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
const COLLECTIONS = ['items', 'items_dev', 'alpha_items'];

async function checkItem() {
    for (const collection of COLLECTIONS) {
        try {
            const doc = await databases.getDocument(DB_ID, collection, '69e940ee003b8b18a1be');
            console.log(`\nFound in ${collection}! Title: ${doc.title}`);
            console.log(`Condition Notes:\n${doc.conditionNotes}`);
            
            // If the condition notes contain SCOUT_DATA, let's decode it to see what's in there
            const match = doc.conditionNotes.match(/\[SCOUT_DATA(?:_LITE)?: ([^\]]+)\]/);
            if (match) {
                console.log(`[!] Found SCOUT_DATA in ${collection}`);
                const data = JSON.parse(Buffer.from(match[1], 'base64').toString());
                const len = Array.isArray(data) ? data.length : (data.items ? data.items.length : 1);
                console.log(`[!] SCOUT_DATA contains ${len} items.`);
                
                // Let's clean it up!
                const newNotes = doc.conditionNotes.replace(/\[SCOUT_DATA(?:_LITE)?: [^\]]+\]\n?/g, '');
                console.log(`Cleaning up SCOUT_DATA from ${collection}...`);
                await databases.updateDocument(DB_ID, collection, doc.$id, { conditionNotes: newNotes.trim() });
                console.log(`✅ Cleaned up SCOUT_DATA in ${collection}`);
            }
        } catch (e) {
            console.log(`Not found in ${collection} or error: ${e.message}`);
        }
    }
}
checkItem();
