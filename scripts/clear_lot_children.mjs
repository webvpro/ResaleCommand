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
const COLLECTIONS = [
    'items',
    'items_dev',
    'alpha_items'
];

async function main() {
    for (const collectionId of COLLECTIONS) {
        console.log(`\n--- Checking Collection: ${collectionId} ---`);
        try {
            console.log(`Finding items with parentLotId = '69e940ee003b8b18a1be' in ${collectionId}`);
            const res = await databases.listDocuments(DB_ID, collectionId, [
                Query.equal('parentLotId', '69e940ee003b8b18a1be'),
                Query.limit(100)
            ]);

            console.log(`Found ${res.documents.length} children.`);
            let count = 0;
            for (const doc of res.documents) {
                // Keep the corsets
                if (doc.title.toLowerCase().includes('corset')) {
                    console.log(`Keeping corset item: ${doc.title}`);
                    continue;
                }
                
                console.log(`Unlinking: ${doc.title}`);
                await databases.updateDocument(DB_ID, collectionId, doc.$id, {
                    parentLotId: null
                });
                count++;
            }
            console.log(`Successfully unlinked ${count} items in ${collectionId}.`);
        } catch (e) {
            console.error(`Error in collection ${collectionId}:`, e.message);
        }
    }
}

main();
