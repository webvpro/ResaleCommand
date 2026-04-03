import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
const isAlpha = process.env.PUBLIC_APPWRITE_ENVIRONMENT === 'alpha';
const COLLECTION_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';

async function addKeywords() {
    console.log(`Adding keywords attribute to db: ${DB_ID}, collection: ${COLLECTION_ID}...`);
    try {
        await databases.createStringAttribute(
            DB_ID,
            COLLECTION_ID,
            'keywords',
            64,
            false,
            undefined,
            true // isArray = true
        );
        console.log('✅ Keywords array attribute created successfully!');
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('✅ Keywords array attribute already exists!');
        } else {
            console.error('❌ Failed to create keywords attribute:', e.message);
        }
    }
}

addKeywords();
