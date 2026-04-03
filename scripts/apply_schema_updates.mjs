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

async function addAttributes(collectionId) {
    console.log(`Checking Attributes for ${DB_ID}/${collectionId}...`);
    
    // 1. salesChannel (Array of Strings)
    try {
        await databases.createStringAttribute(DB_ID, collectionId, 'salesChannel', 255, false, undefined, true);
        console.log(`✅ Created 'salesChannel' attribute array on ${collectionId}`);
    } catch (e) {
        console.log(`ℹ️ 'salesChannel' attribute likely exists or failed on ${collectionId}:`, e.message);
    }

    // 2. keywords (Array of Strings)
    try {
        await databases.createStringAttribute(DB_ID, collectionId, 'keywords', 255, false, undefined, true);
        console.log(`✅ Created 'keywords' attribute array on ${collectionId}`);
    } catch (e) {
        console.log(`ℹ️ 'keywords' attribute likely exists or failed on ${collectionId}:`, e.message);
    }
}

async function run() {
    console.log('--- STARTING SCHEMA UPDATE ---');
    await addAttributes(PROD_COLLECTION);
    
    if (ALPHA_COLLECTION && ALPHA_COLLECTION !== PROD_COLLECTION) {
        await addAttributes(ALPHA_COLLECTION);
    }
    
    console.log('--- SCHEMA UPDATE COMPLETE ---');
    console.log('Please note: Appwrite may take a few seconds to finish indexing these attributes in the background.');
}

run();
