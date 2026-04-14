import { Client, Databases } from "node-appwrite";
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || "resale_db";
const ORG_SETTINGS_COL = "org_settings";

async function runMigration() {
    console.log("Starting Schema Migration...");
    try {
        console.log(`Adding 'allowedDomains' attribute to ${ORG_SETTINGS_COL}...`);
        await db.createStringAttribute(DB_ID, ORG_SETTINGS_COL, "allowedDomains", 255, false, undefined, true); // true = isArray
        console.log("✅ Added allowedDomains attribute.");
    } catch (e) {
        if (e.message.includes("already exists") || e.code === 409) {
            console.log("⚠️ allowedDomains attribute already exists.");
        } else {
            console.error("❌ Failed to add allowedDomains attribute:", e.message);
        }
    }
}
runMigration();
