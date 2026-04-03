import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const ALPHA_COL_ID = process.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items';
const COL_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';

async function copyData() {
    console.log(`Starting data migration from ${ALPHA_COL_ID} to ${COL_ID}...`);
    let hasMore = true;
    let lastId = null;
    let totalMigrated = 0;

    while (hasMore) {
        const queries = [Query.limit(100)];
        if (lastId) queries.push(Query.cursorAfter(lastId));

        const response = await databases.listDocuments(DB_ID, ALPHA_COL_ID, queries);
        
        if (response.documents.length === 0) break;

        for (const doc of response.documents) {
            const data = { ...doc };
            
            // Remove internal system properties
            for (const key of Object.keys(data)) {
                if (key.startsWith('$')) {
                    delete data[key];
                }
            }
            
            // Fallback for missing tenantId
            if (data.tenantId === null || data.tenantId === undefined || data.tenantId === '') {
                if (doc.$permissions && doc.$permissions.length > 0) {
                    const teamPerm = doc.$permissions.find(p => p.includes('team:'));
                    if (teamPerm) {
                        const match = teamPerm.match(/team:([a-zA-Z0-9_-]+)/);
                        if (match) data.tenantId = match[1];
                    }
                }
            }
            // Absolute fallback to avoid DB error
            if (data.tenantId === null || data.tenantId === undefined || data.tenantId === '') {
                data.tenantId = 'legacy_personal';
            }
            
            try {
                // Check if doc exists in destination
                await databases.getDocument(DB_ID, COL_ID, doc.$id);
                console.log(`Document ${doc.$id} already exists in production. Updating...`);
                await databases.updateDocument(DB_ID, COL_ID, doc.$id, data, doc.$permissions);
            } catch (e) {
                // Create new since it wasn't found
                console.log(`Creating document ${doc.$id} in production...`);
                try {
                    await databases.createDocument(DB_ID, COL_ID, doc.$id, data, doc.$permissions);
                } catch (createErr) {
                    console.error(`Failed to create ${doc.$id}: ${createErr.message}`);
                    continue;
                }
            }
            totalMigrated++;
        }
        
        lastId = response.documents[response.documents.length - 1].$id;
        if (response.documents.length < 100) hasMore = false;
    }
    console.log(`Migrated ${totalMigrated} items to production.`);
}

copyData().catch(console.error);
