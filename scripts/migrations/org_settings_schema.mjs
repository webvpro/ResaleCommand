import { Client, Databases, Permission, Role } from "node-appwrite";
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || "resale_db";
const API_KEYS_COL = "api_keys";
const ORG_SETTINGS_COL = "org_settings";

async function runMigration() {
    console.log("Starting Schema Migration...");

    // 1. Add allowedDomains to api_keys
    try {
        console.log(`Adding 'allowedDomains' attribute to ${API_KEYS_COL}...`);
        await db.createStringAttribute(DB_ID, API_KEYS_COL, "allowedDomains", 1000, false, undefined, true); // true = isArray
        console.log("✅ Added allowedDomains attribute.");
    } catch (e) {
        if (e.message.includes("already exists") || e.code === 409) {
            console.log("⚠️ allowedDomains attribute already exists.");
        } else {
            console.error("❌ Failed to add allowedDomains attribute:", e.message);
        }
    }

    // 2. Create org_settings collection
    try {
        console.log(`Creating Collection: ${ORG_SETTINGS_COL}...`);
        await db.createCollection(
            DB_ID,
            ORG_SETTINGS_COL,
            "Organization Settings",
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ],
            true
        );
        console.log("✅ Created org_settings collection.");

        // Add Attributes
        console.log(`Adding attributes to ${ORG_SETTINGS_COL}...`);
        await db.createStringAttribute(DB_ID, ORG_SETTINGS_COL, "tenantId", 255, true);
        await db.createStringAttribute(DB_ID, ORG_SETTINGS_COL, "placedLocations", 255, false, undefined, true); // Array of strings

        console.log("✅ Attributes added.");
    } catch (e) {
         if (e.message.includes("already exists") || e.code === 409) {
            console.log("⚠️ org_settings collection already exists.");
        } else {
            console.error("❌ Failed to create org_settings collection:", e.message);
        }
    }

    console.log("Migration finished.");
}

runMigration();
