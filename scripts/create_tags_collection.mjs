import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
// The new collection for storing tags (keywords and sales channels)
const COLLECTION_ID = 'tags'; 

if (!API_KEY) {
    console.error("Missing APPWRITE_API_KEY in .env");
    process.exit(1);
}

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createAttribute(key, type, size = 255, required = false, array = false) {
    try {
        console.log(`Creating attribute: ${key}...`);
        
        switch (type) {
            case 'string':
                await databases.createStringAttribute(DB_ID, COLLECTION_ID, key, size, required, null, array);
                break;
            default:
                console.error("Unknown type");
        }
        
        console.log(`Attribute ${key} creation requested.`);
        await wait(500); 
    } catch (error) {
        if (error.code === 409) {
            console.log(`Attribute ${key} already exists.`);
        } else {
            console.error(`Error creating ${key}:`, error.message);
        }
    }
}

async function run() {
    console.log("Setting up Tags Collection...");

    // 0. Create the collection if it doesn't exist
    try {
        await databases.createCollection(DB_ID, COLLECTION_ID, 'Tags');
        console.log(`Created collection: ${COLLECTION_ID}`);
        await wait(1000); // Give appwrite time
    } catch (e) {
        if (e.code === 409) {
            console.log(`Collection ${COLLECTION_ID} already exists.`);
        } else {
            console.error("Failed to create collection:", e);
            return;
        }
    }

    // 1. Create Core Attributes
    await createAttribute('label', 'string', 255, true); // The actual tag text, e.g. "Vintage", "eBay"
    await createAttribute('type', 'string', 50, true);   // 'keyword' or 'salesChannel'
    await createAttribute('tenantId', 'string', 50, false); // For team isolation if needed

    // 2. INDEXES
    console.log("Creating Indexes...");
    try {
        await databases.createIndex(DB_ID, COLLECTION_ID, 'idx_label', 'key', ['label'], ['asc']);
        console.log("Created index: idx_label");
    } catch (e) { console.log("Index idx_label might already exist or error:", e.message); }

    try {
        await databases.createIndex(DB_ID, COLLECTION_ID, 'idx_type', 'key', ['type'], ['asc']);
        console.log("Created index: idx_type");
    } catch (e) { console.log("Index idx_type might already exist or error:", e.message); }

    console.log("Tags Schema Setup Complete!");
}

run();
