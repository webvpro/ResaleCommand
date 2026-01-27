
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

async function deleteAttribute(key) {
    try {
        await databases.deleteAttribute(DB_ID, COLLECTION_ID, key);
        console.log(`Deleted attribute: ${key}`);
        await wait(500); // Wait for deletion to propagate
    } catch (e) {
        // Ignore if doesn't exist
    }
}

async function createAttribute(key, type, size = 255, required = false, array = false) {
    try {
        console.log(`Creating attribute: ${key}...`);
        
        switch (type) {
            case 'string':
                await databases.createStringAttribute(DB_ID, COLLECTION_ID, key, size, required, null, array);
                break;
            case 'integer':
                await databases.createIntegerAttribute(DB_ID, COLLECTION_ID, key, required, null, null, array);
                break;
            case 'float':
                await databases.createFloatAttribute(DB_ID, COLLECTION_ID, key, required, null, null, array);
                break;
            case 'boolean':
                await databases.createBooleanAttribute(DB_ID, COLLECTION_ID, key, required, null, array);
                break;
            case 'datetime':
                await databases.createDatetimeAttribute(DB_ID, COLLECTION_ID, key, required, null, array);
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
    console.log("Starting Optimized Schema Update...");

    // 1. DELETE OVERSIZED OR WRONG-TYPE ATTRIBUTES
    // Warning: This deletes data in these columns, but needed to fix the DB.
    console.log("Optimizing table size and fixing types...");
    await deleteAttribute('identity'); 
    await deleteAttribute('conditionNotes');
    // Fix: Strings are needed for ranges (e.g. "100-150"), but DB has them as floats.
    await deleteAttribute('priceMint');
    await deleteAttribute('priceFair');
    await deleteAttribute('pricePoor');
    
    // 2. RECREATE CORE ATTRIBUTES (Smaller)
    await createAttribute('title', 'string', 255, true); 
    await createAttribute('identity', 'string', 2000, false); // Reduced to 2000
    await createAttribute('conditionNotes', 'string', 1000, false); // Reduced to 1000

    // 3. Price Breakdown & Metadata
    await createAttribute('priceMint', 'string', 255, false);
    await createAttribute('priceFair', 'string', 255, false);
    await createAttribute('pricePoor', 'string', 255, false);
    await createAttribute('keywords', 'string', 255, false, true); 
    await createAttribute('imageId', 'string', 255, false);
    
    // 4. Sourcing & Cart Fields 
    await createAttribute('purchasePrice', 'string', 255, false);
    await createAttribute('purchaseLocation', 'string', 255, false);
    await createAttribute('maxBuyPrice', 'string', 255, false); // Retry
    await createAttribute('binLocation', 'string', 255, false); // Retry
    
    // 5. New Fields
    await createAttribute('receiptImageId', 'string', 255, false); // Retry
    await createAttribute('status', 'string', 50, false); 
    await createAttribute('red_flags', 'string', 255, false, true); 
    
    // 6. Multi-Image Support
    await createAttribute('galleryImageIds', 'string', 255, false, true); // Array for extra photos

    // 7. AI Description
    await createAttribute('marketDescription', 'string', 5000, false);

    console.log("Schema Update Requests Sent. Please wait 1-2 minutes for Appwrite to process deletions and additions.");
}

run();
