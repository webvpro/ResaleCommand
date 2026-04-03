import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function run() {
    try {
        const col = process.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items';
        const res = await databases.listDocuments(
            process.env.PUBLIC_APPWRITE_DB_ID,
            col,
            [Query.orderDesc('$createdAt'), Query.limit(5)]
        );
        console.log(`Found ${res.total} items in ${col}. Latest 5:`);
        res.documents.forEach(doc => {
            console.log(`- ${doc.title} | Cart: ${doc.cartId} | Tenant: ${doc.tenantId} | $permissions: ${JSON.stringify(doc.$permissions)}`);
        });
    } catch(e) {
        console.error("Error Alpha:", e.message);
    }
    try {
        const col = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';
        const res = await databases.listDocuments(
            process.env.PUBLIC_APPWRITE_DB_ID,
            col,
            [Query.orderDesc('$createdAt'), Query.limit(5)]
        );
        console.log(`Found ${res.total} items in ${col}. Latest 5:`);
        res.documents.forEach(doc => {
            console.log(`- ${doc.title} | Cart: ${doc.cartId} | Tenant: ${doc.tenantId} | $permissions: ${JSON.stringify(doc.$permissions)}`);
        });
    } catch(e) {
        console.error("Error Prod:", e.message);
    }
}
run();
