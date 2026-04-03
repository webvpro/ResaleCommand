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

async function doMigration() {
    console.log(`Adding keywords attribute to db: ${DB_ID}, col: ${COL_ID}`);
    try {
        await databases.createStringAttribute(
            DB_ID,
            COL_ID,
            'keywords',
            128,
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

doMigration();
