import {
    Client,
    Databases
} from "node-appwrite";
import 'dotenv/config';

function log(msg) {
    console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT || process.env.VITE_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID || process.env.VITE_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || process.env.VITE_PUBLIC_APPWRITE_DB_ID || "resale_db";

const COLLECTIONS_TO_UPDATE = ["items", "items_dev"];

async function ensureFloatAttr(db, dbId, colId, key, required = false, defaultVal = undefined, array = false) {
    try {
        await db.createFloatAttribute(dbId, colId, key, required, undefined, undefined, defaultVal, array);
        log(`[${colId}] Created float attribute: ${key}`);
    } catch (e) {
        if (e.code === 409) {
            log(`[${colId}] Attribute ${key} already exists.`);
        } else {
            console.error(`[${colId}] Failed to create float ${key}:`, e.message);
        }
    }
}

async function run() {
    if (!API_KEY) {
        log("ERROR: APPWRITE_API_KEY not found in environment variables.");
        process.exit(1);
    }

    try {
        const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
        const db = new Databases(client);

        log(`Target Database: ${DB_ID}`);

        for (const col of COLLECTIONS_TO_UPDATE) {
            log(`Updating Collection: ${col}...`);
            await ensureFloatAttr(db, DB_ID, col, "soldPrice", false, 0.0);
            await ensureFloatAttr(db, DB_ID, col, "commissionPaid", false, 0.0);
        }

        log("SCHEMA UPDATE COMPLETE SUCCESSFULLY!");
        process.exit(0);
    } catch (e) {
        log(`FATAL ERROR: ${e.message}`);
        console.error(e);
        process.exit(1);
    }
}

run();
