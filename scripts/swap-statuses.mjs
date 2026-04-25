import { Client, Databases, Query } from "node-appwrite";
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
        console.log(`\nProcessing collection: ${col}`);
        
        try {
            // STEP 1: Find all 'received' and change to 'TEMP_STATUS'
            let response = await db.listDocuments(dbId, col, [
                Query.equal('status', 'received'),
                Query.limit(5000)
            ]);
            let count1 = 0;
            for (const doc of response.documents) {
                await db.updateDocument(dbId, col, doc.$id, { status: 'TEMP_STATUS' });
                count1++;
            }
            console.log(`Step 1: Changed ${count1} 'received' items to 'TEMP_STATUS'.`);

            // STEP 2: Find all 'acquired' and change to 'received'
            response = await db.listDocuments(dbId, col, [
                Query.equal('status', 'acquired'),
                Query.limit(5000)
            ]);
            let count2 = 0;
            for (const doc of response.documents) {
                await db.updateDocument(dbId, col, doc.$id, { status: 'received' });
                count2++;
            }
            console.log(`Step 2: Changed ${count2} 'acquired' items to 'received'.`);

            // STEP 3: Find all 'TEMP_STATUS' and change to 'acquired'
            response = await db.listDocuments(dbId, col, [
                Query.equal('status', 'TEMP_STATUS'),
                Query.limit(5000)
            ]);
            let count3 = 0;
            for (const doc of response.documents) {
                await db.updateDocument(dbId, col, doc.$id, { status: 'acquired' });
                count3++;
            }
            console.log(`Step 3: Changed ${count3} 'TEMP_STATUS' items to 'acquired'.`);

        } catch(e) { 
            console.error(`Error processing ${col}:`, e.message); 
        }
    }

    console.log("\nDone swapping statuses!");
}

run();
