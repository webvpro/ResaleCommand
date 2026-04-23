import { Client, Databases, Query } from "node-appwrite";
import 'dotenv/config';

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT || process.env.VITE_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID || process.env.VITE_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || process.env.VITE_PUBLIC_APPWRITE_DB_ID || "resale_db";
const ITEMS_COL = process.env.PUBLIC_APPWRITE_COLLECTION_ID || process.env.VITE_PUBLIC_APPWRITE_COLLECTION_ID || "items";

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const db = new Databases(client);

async function monitor() {
    console.log("Monitoring import progress (polling every 5 seconds)...");
    let lastCount = -1;
    let unchangedCycles = 0;
    
    const interval = setInterval(async () => {
        try {
            const result = await db.listDocuments(DB_ID, ITEMS_COL, [
                Query.limit(1),
                Query.orderDesc('$createdAt')
            ]);
            
            const currentCount = result.total;
            
            if (currentCount !== lastCount) {
                console.log(`[${new Date().toLocaleTimeString()}] ✅ Total Items: ${currentCount}`);
                if (result.documents.length > 0) {
                    const title = result.documents[0].title || "Unknown Title";
                    console.log(`   -> Latest added: ${title.substring(0, 80)}...`);
                }
                lastCount = currentCount;
                unchangedCycles = 0;
            } else {
                unchangedCycles++;
                if (unchangedCycles > 24) { // 2 minutes of no changes
                    console.log(`[${new Date().toLocaleTimeString()}] No changes for 2 minutes. Import might be complete or paused. Exiting monitor.`);
                    clearInterval(interval);
                }
            }
        } catch (e) {
            console.error("Error querying DB:", e.message);
        }
    }, 5000);
}

monitor();
