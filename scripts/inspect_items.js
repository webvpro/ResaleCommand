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

async function inspectItems() {
    try {
        const result = await databases.listDocuments(DB_ID, COL_ID, [
            Query.orderDesc('$createdAt'),
            Query.limit(5)
        ]);
        
        console.log(`Found ${result.documents.length} items. Here are the first few:`);
        result.documents.forEach(doc => {
            console.log(`\n--- ${doc.title} ---`);
            console.log(`$id: ${doc.$id}`);
            console.log(`identity: ${doc.identity}`);
            console.log(`imageId: ${doc.imageId}`);
            console.log(`galleryImageIds: ${doc.galleryImageIds}`);
            console.log(`conditionNotes snippet: ${doc.conditionNotes?.substring(0, 150)}...`);
        });
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

inspectItems();
