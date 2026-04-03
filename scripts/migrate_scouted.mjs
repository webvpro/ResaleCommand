import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load env
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
const ALPHA_COL_ID = process.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items';


async function migrate(colId) {
    console.log(`Starting Status Migration for ${colId}: 'scouted' -> 'acquired'`);
    let documentsToUpdate = [];
    let hasMore = true;
    let lastId = null;
    let totalUpdated = 0;

    while (hasMore) {
        const queries = [
            Query.equal('status', 'scouted'),
            Query.limit(100)
        ];
        
        if (lastId) {
            queries.push(Query.cursorAfter(lastId));
        }

        const response = await databases.listDocuments(DB_ID, colId, queries);
        
        if (response.documents.length === 0) {
            hasMore = false;
            break;
        }

        for (const doc of response.documents) {
            console.log(`Migrating Item: ${doc.title || doc.$id}`);
            await databases.updateDocument(DB_ID, colId, doc.$id, {
                status: 'acquired'
            });
            totalUpdated++;
        }
        
        lastId = response.documents[response.documents.length - 1].$id;
        
        if (response.documents.length < 100) {
            hasMore = false;
        }
    }
    console.log(`Completed ${colId}: Migrated ${totalUpdated} items.`);
}

async function run() {
    try {
        await migrate(COL_ID);
        await migrate(ALPHA_COL_ID);
    } catch(e) {
        console.error("Migration Failed:", e);
    }
}
run();
