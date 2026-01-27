
import { Client, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const BUCKET_ID = process.env.PUBLIC_APPWRITE_BUCKET_ID;

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
    console.log(`Checking Bucket: ${BUCKET_ID}...`);
    
    try {
        // We want to ensure the bucket generally allows public viewing (read: any)
        // Note: modify this if you want stricter security (e.g. only users). 
        // For a resale tool, usually seeing the images is fine.
        
        await storage.updateBucket(
            BUCKET_ID, 
            'Item Images', // Name
            [
                Permission.read(Role.any()),    // Public Read
                Permission.create(Role.any()),  // Anyone can upload (or change to Role.users())
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ],
            false, // File Security (false = bucket permissions apply to all files)
            true,  // Enabled
            undefined, // Max Size
            ['jpg', 'jpeg', 'png', 'webp', 'gif'] // Allowed extensions
        );
        
        console.log("✅ Bucket permissions updated! Images should now be visible.");
    } catch (error) {
        console.error("Error updating bucket:", error);
    }
}

run();
