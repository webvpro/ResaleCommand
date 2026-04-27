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
        console.log('Querying items collection for D&D...');
        const res = await databases.listDocuments(DB_ID, 'items', [
            Query.search('title', 'D&D'),
            Query.limit(10)
        ]);
        console.log(`Found ${res.documents.length} D&D items.`);
        for (const doc of res.documents) {
            console.log(`- ${doc.title} | parentLotId: ${doc.parentLotId}`);
        }
    } catch (e) {
        console.error(e);
    }
}
check();
