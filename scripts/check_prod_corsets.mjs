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

async function check() {
    try {
        console.log('Querying items collection for ALL items, filtering by Corset...');
        // We fetch 100 items and filter in JS since fulltext isn't available
        const res = await databases.listDocuments(DB_ID, 'items', [
            Query.limit(100),
            Query.orderDesc('$createdAt')
        ]);
        
        const corsets = res.documents.filter(d => d.title && d.title.toLowerCase().includes('corset'));
        console.log(`Found ${corsets.length} corsets recently created.`);
        for (const doc of corsets) {
            console.log(`- ${doc.title} | ID: ${doc.$id} | parentLotId: ${doc.parentLotId}`);
        }
    } catch (e) {
        console.error(e);
    }
}
check();
