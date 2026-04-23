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
        try {
            console.log(`Deleting salesChannel string attribute from ${col}...`);
            await db.deleteAttribute(dbId, col, "salesChannel");
            console.log("Deleted.");
        } catch(e) { console.log(e.message); }
    }

    console.log("Waiting for Appwrite to process deletion...");
    await new Promise(r => setTimeout(r, 3000));

    for (const col of cols) {
        try {
            // createStringAttribute(dbId, colId, key, size, required, default, array)
            console.log(`Recreating salesChannel as ARRAY attribute on ${col}...`);
            await db.createStringAttribute(dbId, col, "salesChannel", 255, false, undefined, true);
            console.log("Recreated.");
        } catch(e) { console.log(e.message); }
    }
    console.log("Done.");
}

run();
