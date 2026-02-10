import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
const COLLECTION_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';

async function addImageId() {
    console.log(`Checking 'imageId' in ${DB_ID}.${COLLECTION_ID}...`);
    
    try {
        await databases.getAttribute(DB_ID, COLLECTION_ID, 'imageId');
        console.log('✅ Attribute "imageId" already exists.');
    } catch (error) {
        if (error.code === 404) {
            console.log('⚠️ Attribute "imageId" not found. Creating it...');
            try {
                // Create 'imageId' as a String attribute, size 255, not required.
                await databases.createStringAttribute(DB_ID, COLLECTION_ID, 'imageId', 255, false);
                console.log('✅ Request to create "imageId" sent successfully.');
            } catch (createError) {
                console.error('❌ Failed to create "imageId":', createError.message);
            }
        } else {
            console.error('❌ Error checking attribute:', error.message);
        }
    }
}

addImageId();
