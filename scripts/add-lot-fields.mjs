import { Client, Databases } from "node-appwrite";
import 'dotenv/config';

async function run() {
    const client = new Client()
        .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
    const db = new Databases(client);

    const cols = ["items", "items_dev"];
    const dbId = process.env.PUBLIC_APPWRITE_DB_ID || "resale_db";

    for (const col of cols) {
        console.log(`Processing collection: ${col}`);
        
        // 1. Add parentLotId
        try {
            console.log(`  Adding parentLotId to ${col}...`);
            await db.createStringAttribute(dbId, col, "parentLotId", 255, false);
            console.log("  -> Added.");
        } catch(e) { 
            console.log(`  -> Skipped/Failed: ${e.message}`); 
        }

        // 2. Add quantity
        try {
            console.log(`  Adding quantity to ${col}...`);
            await db.createIntegerAttribute(dbId, col, "quantity", false, 1, 100000, 1);
            console.log("  -> Added.");
        } catch(e) { 
            console.log(`  -> Skipped/Failed: ${e.message}`); 
        }
    }

    console.log("Done adding new attributes!");
}

run();
