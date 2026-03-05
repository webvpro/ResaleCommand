
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Needs a server-side API key with Database modification rights

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
const COLLECTION_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';

async function addAttributes() {
    console.log(`Checking Attributes for ${DB_ID}/${COLLECTION_ID}...`);
    
    try {
        // 1. Est Low
        try {
            await databases.createFloatAttribute(DB_ID, COLLECTION_ID, 'estLow', false, 0, 1000000);
            console.log('✅ Created estLow attribute');
        } catch (e) {
            console.log('ℹ️ estLow attribute likely exists or failed:', e.message);
        }

        // 2. Est High
        try {
            await databases.createFloatAttribute(DB_ID, COLLECTION_ID, 'estHigh', false, 0, 1000000);
            console.log('✅ Created estHigh attribute');
        } catch (e) {
             console.log('ℹ️ estHigh attribute likely exists or failed:', e.message);
        }

        // 3. Resale Price (List Price)
        try {
            await databases.createFloatAttribute(DB_ID, COLLECTION_ID, 'resalePrice', false, 0, 1000000);
            console.log('✅ Created resalePrice attribute');
        } catch (e) {
             console.log('ℹ️ resalePrice attribute likely exists or failed:', e.message);
        }

        // 4. Paid Price
        try {
            await databases.createFloatAttribute(DB_ID, COLLECTION_ID, 'purchasePrice', false, 0, 1000000);
            console.log('✅ Created purchasePrice (Paid) attribute');
        } catch (e) {
             console.log('ℹ️ purchasePrice attribute likely exists or failed:', e.message);
        }

    } catch (e) {
        console.error("Fatal Error:", e);
    }
}

addAttributes();
