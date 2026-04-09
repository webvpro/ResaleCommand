import { Client, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();
const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!API_KEY) {
    console.error("Missing APPWRITE_API_KEY in .env");
    process.exit(1);
}

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const storage = new Storage(client);

async function run() {
    try {
        console.log("Checking if reports bucket exists...");
        try {
            await storage.getBucket('reports');
            console.log("Bucket 'reports' already exists. Updating permissions...");
            await storage.updateBucket('reports', 'Scout Reports', [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ], false, true, undefined, ['md', 'json', 'txt', 'html']);
            console.log("✅ Bucket updated successfully.");
            return;
        } catch (e) {
            if (e.code !== 404) throw e;
        }

        console.log("Creating new bucket 'reports'...");
        await storage.createBucket('reports', 'Scout Reports', [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
        ], false, true, undefined, ['md', 'json', 'txt', 'html']);
        console.log("✅ Bucket 'reports' created successfully.");
    } catch (error) {
        console.error("Error creating bucket:", error);
    }
}

run();
