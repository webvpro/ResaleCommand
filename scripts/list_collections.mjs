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

async function listCollections() {
    try {
        const collections = await databases.listCollections(DB_ID);
        console.log(`Found ${collections.collections.length} collections in DB ${DB_ID}:`);
        collections.collections.forEach(c => {
            console.log(`- ${c.name} (${c.$id})`);
        });
    } catch (e) {
        console.error('Error listing collections:', e.message);
    }
}

listCollections();
