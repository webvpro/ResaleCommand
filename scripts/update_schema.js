import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const ITEMS_COL = process.env.PUBLIC_APPWRITE_COLLECTION_ID;

async function checkAndUpdateSchema() {
    console.log(`Checking Items Collection Schema for Collection ID: ${ITEMS_COL}`);
    
    try {
        const attributes = await databases.listAttributes(DB_ID, ITEMS_COL);
        const attributeMap = new Map(attributes.attributes.map(a => [a.key, a]));

        // Check rawAnalysis
        if (!attributeMap.has('rawAnalysis')) {
            console.log('🔴 rawAnalysis is MISSING. Adding it now...');
            try {
                await databases.createStringAttribute(DB_ID, ITEMS_COL, 'rawAnalysis', 5000, false);
                console.log('✅ Created rawAnalysis attribute request sent.');
            } catch (e) {
                console.error('❌ Failed to create rawAnalysis:', e.message);
            }
        } else {
            const attr = attributeMap.get('rawAnalysis');
            console.log(`🟢 rawAnalysis exists. Status: ${attr.status}`);
        }

        // Check condition
        if (!attributeMap.has('condition')) {
            console.log('🔴 condition is MISSING. Adding it now...');
            try {
                await databases.createStringAttribute(DB_ID, ITEMS_COL, 'condition', 255, false);
                console.log('✅ Created condition attribute request sent.');
            } catch (e) {
                console.error('❌ Failed to create condition:', e.message);
            }
        } else {
             const attr = attributeMap.get('condition');
             console.log(`🟢 condition exists. Status: ${attr.status}`);
        }

        console.log('\nProcessing complete. If you just added attributes, please wait a minute for them to become "available".');

    } catch (e) {
        console.error('Schema Check Failed:', e);
    }
}

checkAndUpdateSchema();
