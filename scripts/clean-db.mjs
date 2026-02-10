
import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const COLLECTION_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID;

if (!API_KEY) {
    console.error("Missing APPWRITE_API_KEY");
    process.exit(1);
}

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function clean() {
    console.log(`Cleaning Collection: ${COLLECTION_ID}...`);
    let count = 0;
    
    while (true) {
        const response = await databases.listDocuments(DB_ID, COLLECTION_ID, [
            Query.limit(100)
        ]);
        
        if (response.documents.length === 0) break;
        
        console.log(`Found ${response.documents.length} items. Deleting...`);
        
        await Promise.all(response.documents.map(async (doc) => {
            try {
                await databases.deleteDocument(DB_ID, COLLECTION_ID, doc.$id);
                // process.stdout.write('.');
            } catch (e) {
                console.error(`Failed to delete ${doc.$id}: ${e.message}`);
            }
        }));
        
        count += response.documents.length;
        console.log(`\nBatch done. Total deleted so far: ${count}`);
        
        // Safety break
        if (count > 2000) {
            console.log("Safety limit reached. Run again if needed.");
            break;
        }
    }
    
    console.log(`\nDone! Deleted ${count} items.`);
}

clean();
