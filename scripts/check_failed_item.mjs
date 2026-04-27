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

async function checkItem() {
    try {
        const itemId = '69ecefa1001bfddc0477';
        console.log(`Checking item ${itemId} in items_dev...`);
        const doc = await databases.getDocument(DB_ID, 'items_dev', itemId);
        
        console.log(`\n--- ITEM DETAILS ---`);
        console.log(`Title: ${doc.title}`);
        console.log(`Quantity: ${doc.quantity}`);
        console.log(`ParentLotId: ${doc.parentLotId}`);
        console.log(`Status: ${doc.status}`);
        console.log(`Condition Notes:\n${doc.conditionNotes}`);
        
    } catch (e) {
        console.log(`Error: ${e.message}`);
    }
}
checkItem();
