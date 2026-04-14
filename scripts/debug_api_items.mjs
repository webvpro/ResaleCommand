import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

async function check() {
    const dbId = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
    
    // get api key
    const keys = await db.listDocuments(dbId, 'api_keys');
    if (!keys.documents.length) return console.log('no keys');
    const keyDoc = keys.documents[0];
    console.log("API Key Tenant ID:", keyDoc.tenantId);

    const items = await db.listDocuments(dbId, 'items', [Query.limit(5)]);
    console.log("Items Collection total items:", items.total);
    if(items.documents.length) {
        console.log("Sample Item Tenant ID in 'items':", items.documents[0].tenantId);
    }
    
    // check alpha_items
    try {
        const alphaColl = process.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items';
        const alpha_items = await db.listDocuments(dbId, alphaColl, [Query.limit(5)]);
         console.log(`Alpha Items Collection (${alphaColl}) total items:`, alpha_items.total);
         if(alpha_items.documents.length) {
             console.log(`Sample Item Tenant ID in '${alphaColl}':`, alpha_items.documents[0].tenantId);
         }
    } catch(e) { console.log("No alpha_items col") }
}
check();
