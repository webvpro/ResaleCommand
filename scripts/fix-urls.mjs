import { Client, Databases, Query } from "node-appwrite";
import 'dotenv/config';

async function run() {
    const client = new Client()
        .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
    const db = new Databases(client);

    const cols = [
        process.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items',
        process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items'
    ];
    const dbId = process.env.PUBLIC_APPWRITE_DB_ID || "resale_db";

    for (const col of cols) {
        console.log(`Processing collection: ${col}...`);
        try {
            let lastId = null;
            let totalProcessed = 0;
            let totalUpdated = 0;
            
            while (true) {
                const queries = [Query.limit(100)];
                if (lastId) queries.push(Query.cursorAfter(lastId));
                
                const res = await db.listDocuments(dbId, col, queries);
                
                if (res.documents.length === 0) break;

                for (const doc of res.documents) {
                    let needsUpdate = false;
                    let payload = {};

                    // Check sourcingLocation
                    if (doc.sourcingLocation && doc.sourcingLocation.match(/^\d+$/)) {
                        console.log(`Updating sourcingLocation for ${doc.title}: ${doc.sourcingLocation} -> URL`);
                        payload.sourcingLocation = `https://shopgoodwill.com/item/${doc.sourcingLocation}`;
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        await db.updateDocument(dbId, col, doc.$id, payload);
                        totalUpdated++;
                    }
                    totalProcessed++;
                }

                // If fewer than 100, we've hit the end
                if (res.documents.length < 100) break;
                lastId = res.documents[res.documents.length - 1].$id;
            }
            console.log(`Finished ${col}. Processed ${totalProcessed}, Updated ${totalUpdated}.`);
        } catch(e) { 
            console.log(e.message); 
        }
    }
    console.log("Done.");
}

run();
