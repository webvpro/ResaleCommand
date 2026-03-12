import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();
client
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function run() {
    try {
        const dbId = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
        const colId = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';
        console.log(`Checking collection ${colId} in DB ${dbId}...`);
        
        const col = await databases.getCollection(dbId, colId);
        console.log('Collection Permissions:', col.$permissions);
        console.log('Document Security enabled?', col.documentSecurity);
        
        console.log('\nAttributes:');
        col.attributes.forEach(attr => {
            console.log(` - ${attr.key} (${attr.type}, required: ${attr.required}, array: ${attr.array})`);
        });

    } catch (e) {
        console.error("Error fetching collection info:", e);
    }
}
run();
