import { Client, Databases, Query } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69714b35003a8adab6bb')
    .setKey('standard_7f468ae83deeee6b932fd40312e1be602c94a4d75922ad72d895e677dff7a06b7715984f93fb5c3bebc1a5a174996039c7db6f03f81c21085e5bf01a3aa23c62caa66f8df87b2662ddaef338661cab157e1b4d74d07e4bb1ddf36868cd69ce66c3014450d88ec69029a7716cbcea45ee66c8533a2776a5b522cfc213820e0034');

const databases = new Databases(client);

// Appwrite collections
const DB_ID = 'resale_db';
const ALPHA_COL = 'alpha_items';
const ITEMS_COL = 'items';

async function nukeStuckItems() {
    try {
        console.log("Searching for stuck scouted items...");
        
        // Search in alpha
        const alphaResponse = await databases.listDocuments(DB_ID, ALPHA_COL, [
            Query.equal('status', 'scouted'),
            Query.limit(50)
        ]);
        
        const alphaDocs = alphaResponse.documents;
        console.log(`Found ${alphaDocs.length} scouted items in alpha_items`);
        
        for (const doc of alphaDocs) {
            console.log(`Deleting ${doc.title || doc.$id}...`);
            await databases.deleteDocument(DB_ID, ALPHA_COL, doc.$id);
        }

        // Search in normal
        const normalResponse = await databases.listDocuments(DB_ID, ITEMS_COL, [
            Query.equal('status', 'scouted'),
            Query.limit(50)
        ]);

        const normalDocs = normalResponse.documents;
        console.log(`Found ${normalDocs.length} scouted items in items`);

        for (const doc of normalDocs) {
            console.log(`Deleting ${doc.title || doc.$id}...`);
            await databases.deleteDocument(DB_ID, ITEMS_COL, doc.$id);
        }

        console.log("Cleanup complete!");
    } catch (e) {
        console.error("Failed to delete stuck items:", e);
    }
}

nukeStuckItems();
