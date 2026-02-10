import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function listAttributes() {
    try {
        console.log('Fetching attributes for collection: items');
        const response = await databases.listAttributes(process.env.PUBLIC_APPWRITE_DB_ID, process.env.PUBLIC_APPWRITE_COLLECTION_ID);
        console.log('--- Connected Successfully ---');
        console.log(`Total Attributes: ${response.attributes.length}`);
        
        const names = response.attributes.map(attr => `${attr.key} (${attr.type})`);
        console.log('Keys:', names.join(', '));
        
        console.log('\nChecking for "imageId"...');
        const imageId = response.attributes.find(a => a.key === 'imageId');
        if (imageId) console.log('✅ imageId EXISTS');
        else console.log('❌ imageId DOES NOT EXIST');

    } catch (error) {
        console.error('Error fetching attributes:', error.message);
    }
}

listAttributes();
