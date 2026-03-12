import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
const PROD_COLLECTION = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';
const ALPHA_COLLECTION = process.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items';

async function addKeywordsAttribute(collectionId) {
    console.log(`Checking Attributes for ${DB_ID}/${collectionId}...`);
    try {
        // keywords array
        await databases.createStringAttribute(DB_ID, collectionId, 'keywords', 100, false, null, true);
        console.log(`✅ Created 'keywords' attribute array on ${collectionId}`);
    } catch (e) {
        console.log(`ℹ️ 'keywords' attribute likely exists or failed on ${collectionId}:`, e.message);
    }
}

async function run() {
    await addKeywordsAttribute(PROD_COLLECTION);
    await addKeywordsAttribute(ALPHA_COLLECTION);
}

run();
