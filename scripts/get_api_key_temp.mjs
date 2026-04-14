import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

async function run() {
    try {
        const res = await db.listDocuments(process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db', 'api_keys');
        if (res.documents.length) {
            console.log("FOUND API KEY:");
            console.log(res.documents[0].key);
        } else {
            console.log("No API keys found. You may need to create one manually via the Appwrite Console.");
        }
    } catch(e) {
        console.error("Error:", e.message);
    }
}
run();
