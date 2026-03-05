
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const COLLECTION_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID;

if (!API_KEY) {
    console.error("Missing APPWRITE_API_KEY");
    process.exit(1);
}

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function run() {
    try {
        console.log(`Inspecting Collection: ${COLLECTION_ID}...`);
        const attrs = await databases.listAttributes(DB_ID, COLLECTION_ID);
        
        console.log("\n--- CURRENT SCHEMA ---");
        attrs.attributes.forEach(a => {
            console.log(`- ${a.key} [${a.type}] (required: ${a.required})`);
        });
        console.log("----------------------\n");
    } catch (e) {
        console.error("Error inspecting schema:", e.message);
    }
}

run();
