import { Client, Databases } from "node-appwrite";
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || "resale_db";
const ITEMS_COL = process.env.PUBLIC_APPWRITE_COLLECTION_ID || "items";

async function runMigration() {
    console.log("Starting Schema Migration for Components...");
    try {
        console.log(`Adding 'components' attribute to ${ITEMS_COL}...`);
        // Use createStringAttribute with a safe size (4000) to store JSON
        await db.createStringAttribute(DB_ID, ITEMS_COL, "components", 4000, false, undefined, false);
        console.log("✅ Added components attribute.");
    } catch (e) {
        if (e.message.includes("already exists") || e.code === 409) {
            console.log("⚠️ components attribute already exists.");
        } else {
            console.error("❌ Failed to add components attribute:", e.message);
        }
    }
}
runMigration();
