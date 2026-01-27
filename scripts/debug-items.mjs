
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const COLLECTION_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID;

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function run() {
    console.log("Fetching inventory items...");
    try {
        const response = await databases.listDocuments(DB_ID, COLLECTION_ID);
        console.log(`Found ${response.documents.length} items.\n`);
        
        response.documents.forEach(doc => {
            console.log(`Title: ${doc.title}`);
            console.log(`- priceFair: ${JSON.stringify(doc.priceFair)} (Type: ${typeof doc.priceFair})`);
            console.log(`- priceMint: ${JSON.stringify(doc.priceMint)}`);
            console.log(`- status: ${doc.status}`);
            console.log('---');
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
