import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

async function run() {
    const dbId = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
    const keys = await db.listDocuments(dbId, 'api_keys');
    if (!keys.documents.length) return;
    const keyDoc = keys.documents[0];
    
    await db.updateDocument(dbId, 'api_keys', keyDoc.$id, {
        tenantId: '6979614d00281d143bbe'
    });
    console.log("Updated API Key tenantId to 6979614d00281d143bbe");
}
run();
