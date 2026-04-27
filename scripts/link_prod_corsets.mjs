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

async function fix() {
    try {
        const parentLotId = '69e940ee003b8b18a1be';
        const childrenIds = ['69efa177003875164229', '69efa176001d4c93de42'];
        
        for (const childId of childrenIds) {
            console.log(`Linking ${childId} to ${parentLotId}...`);
            await databases.updateDocument(DB_ID, 'items', childId, {
                parentLotId: parentLotId
            });
            console.log(`✅ Linked ${childId}`);
        }
    } catch (e) {
        console.error(e);
    }
}
fix();
