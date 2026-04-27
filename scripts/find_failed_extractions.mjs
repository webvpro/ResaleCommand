import { Client, Databases, Query } from 'node-appwrite';
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
const COLLECTIONS = ['items', 'items_dev'];

async function checkFailedExtractions() {
    for (const collection of COLLECTIONS) {
        console.log(`\n--- Checking Collection: ${collection} ---`);
        try {
            // Fetch items
            let allItems = [];
            let cursor = null;
            let keepGoing = true;
            
            while (keepGoing) {
                const queries = [Query.limit(100), Query.orderDesc('$createdAt')];
                if (cursor) queries.push(Query.cursorAfter(cursor));
                
                const res = await databases.listDocuments(DB_ID, collection, queries);
                allItems.push(...res.documents);
                
                if (res.documents.length < 100) keepGoing = false;
                else cursor = res.documents[res.documents.length - 1].$id;
            }

            console.log(`Fetched ${allItems.length} total items.`);

            const failedItems = [];
            for (const item of allItems) {
                if (!item.parentLotId) {
                    if (item.conditionNotes && (
                        item.conditionNotes.includes('Extracted from Bulk Lot') ||
                        item.conditionNotes.includes('Extracted 1 from Lot:')
                    )) {
                        failedItems.push(item);
                    }
                }
            }

            console.log(`\nFound ${failedItems.length} failed extractions in ${collection}:`);
            for (const item of failedItems) {
                console.log(`- ${item.title} (ID: ${item.$id})`);
            }
        } catch (e) {
            console.error(e);
        }
    }
}
checkFailedExtractions();
