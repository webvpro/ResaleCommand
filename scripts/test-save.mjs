import { Client, Databases, Query } from "node-appwrite";
import 'dotenv/config';

async function run() {
    const client = new Client()
        .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
    const db = new Databases(client);
    const dbId = process.env.PUBLIC_APPWRITE_DB_ID || "resale_db";
    const colId = "items";

    try {
        console.log("Fetching a recent item from production...");
        const response = await db.listDocuments(dbId, colId, [
            Query.orderDesc("$createdAt"),
            Query.limit(50)
        ]);

        if (response.documents.length === 0) {
            console.log("No items found.");
            return;
        }

        // Let's try to update the first 10 documents with their own data
        // to see if Appwrite rejects any of them
        let errorFound = false;
        for (const doc of response.documents.slice(0, 10)) {
            const dataToUpdate = {};
            // Just updating the title to itself to trigger validation
            dataToUpdate.title = doc.title;
            
            try {
                await db.updateDocument(dbId, colId, doc.$id, dataToUpdate);
                console.log(`Document ${doc.$id} saved successfully.`);
            } catch (err) {
                console.error(`Error saving document ${doc.$id}:`, err.message);
                errorFound = true;
                // Try to extract unknown attribute
                const match = err.message.match(/Unknown attribute: "([^"]+)"/);
                if (match) {
                    console.log(`\n--> MISSING ATTRIBUTE IDENTIFIED: ${match[1]}`);
                    break;
                }
            }
        }
        
        if (!errorFound) {
            console.log("No errors found on the first 10 items. Let's try an older one.");
            // Fetch oldest items
            const oldRes = await db.listDocuments(dbId, colId, [
                Query.orderAsc("$createdAt"),
                Query.limit(10)
            ]);
            for (const doc of oldRes.documents) {
                try {
                    await db.updateDocument(dbId, colId, doc.$id, { title: doc.title });
                    console.log(`Old Document ${doc.$id} saved successfully.`);
                } catch (err) {
                    console.error(`Error saving Old Document ${doc.$id}:`, err.message);
                    const match = err.message.match(/Unknown attribute: "([^"]+)"/);
                    if (match) {
                        console.log(`\n--> MISSING ATTRIBUTE IDENTIFIED: ${match[1]}`);
                        break;
                    }
                }
            }
        }
    } catch (e) {
        console.error("Fatal Error:", e);
    }
}

run();
