import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const ITEMS_COL = process.env.PUBLIC_APPWRITE_COLLECTION_ID;

async function fixSchema() {
    console.log(`Checking Attributes for Collection: ${ITEMS_COL} in DB: ${DB_ID}`);
    
    try {
        // 1. rawAnalysis
        try {
            console.log('Attempting to create "rawAnalysis"...');
            await databases.createStringAttribute(DB_ID, ITEMS_COL, 'rawAnalysis', 5000, false);
            console.log('✅ "rawAnalysis" creation request sent.');
        } catch (e) {
            console.log(`ℹ️ "rawAnalysis" status: ${e.message}`);
        }

        // 2. condition
        try {
            console.log('Attempting to create "condition"...');
            await databases.createStringAttribute(DB_ID, ITEMS_COL, 'condition', 255, false);
            console.log('✅ "condition" creation request sent.');
        } catch (e) {
             console.log(`ℹ️ "condition" status: ${e.message}`);
        }

        console.log('Done. If you saw "creation request sent", please wait ~1 minute before saving.');

    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    }
}

fixSchema();
