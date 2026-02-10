
import { Client, Databases } from 'node-appwrite';
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

async function inspect() {
    console.log(`🔍 Inspecting Collection: ${COL_ID} in DB: ${DB_ID}`);

    try {
        const collection = await databases.getCollection(DB_ID, COL_ID);
        console.log(`\n📄 Collection Name: ${collection.name}`);
        console.log(`✅ Attributes (Columns):`);
        
        const attributes = collection.attributes;
        attributes.forEach(attr => {
            console.log(` - ${attr.key} (${attr.type}) ${attr.required ? '[REQUIRED]' : ''}`);
        });

    } catch (e) {
        console.error("❌ Failed to fetch schema:", e.message);
    }
}

inspect();
