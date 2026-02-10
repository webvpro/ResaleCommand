import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

async function checkCollections() {
    try {
        console.log("Checking Database:", process.env.PUBLIC_APPWRITE_DB_ID);
        const cols = await db.listCollections(process.env.PUBLIC_APPWRITE_DB_ID);
        
        console.log("\n--- Available Collections ---");
        cols.collections.forEach(c => {
            console.log(`Name: ${c.name} | ID: ${c.$id}`);
        });
        console.log("-----------------------------\n");
    } catch (e) {
        console.error("Error listing collections:", e.message);
    }
}

checkCollections();
