import { Client, Databases, Query } from 'node-appwrite';
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
const ALPHA_COL_ID = process.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items';
const CARTS_COL = 'carts';

async function debugItems() {
    console.log("=== CHECKING ITEMS ===");
    try {
        const itemsRes = await databases.listDocuments(DB_ID, COL_ID, [
            Query.orderDesc('$createdAt'),
            Query.limit(10)
        ]);
        console.log(`\nItems in Standard (${COL_ID}):`);
        itemsRes.documents.forEach(doc => {
            console.log(`- ${doc.$id} | Title: ${doc.title} | Status: ${doc.status} | CartId: ${doc.cartId}`);
        });
    } catch (e) { console.log('Standard collection error:', e.message); }

    try {
        const alphaRes = await databases.listDocuments(DB_ID, ALPHA_COL_ID, [
            Query.orderDesc('$createdAt'),
            Query.limit(10)
        ]);
        console.log(`\nItems in Alpha (${ALPHA_COL_ID}):`);
        alphaRes.documents.forEach(doc => {
            console.log(`- ${doc.$id} | Title: ${doc.title} | Status: ${doc.status} | CartId: ${doc.cartId}`);
        });
    } catch (e) { console.log('Alpha collection error:', e.message); }

    console.log("\n=== CHECKING CARTS ===");
    try {
        const cartsRes = await databases.listDocuments(DB_ID, CARTS_COL, [
            Query.orderDesc('$createdAt'),
            Query.limit(5)
        ]);
        cartsRes.documents.forEach(doc => {
            console.log(`- Cart ${doc.$id} | Status: ${doc.status} | Items: ${doc.itemCount} | Source: ${doc.source}`);
        });
    } catch (e) {
        console.error("Cart error:", e.message);
    }
}

debugItems();
