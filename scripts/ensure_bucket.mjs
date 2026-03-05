
import { Client, Storage, Permission, Role, ID } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
    console.error("Missing credentials in .env");
    process.exit(1);
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const storage = new Storage(client);
const BUCKET_ID = process.env.PUBLIC_APPWRITE_BUCKET_ID || 'item_images';

async function fixBucket() {
    console.log(`🔧 Fixing Bucket: ${BUCKET_ID}...`);
    try {
        await storage.updateBucket(
            BUCKET_ID, 
            'Item Images', 
            [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ],
            false, // File Security
            true,  // Enabled
            undefined, // Max Size
            ['jpg', 'jpeg', 'png', 'webp', 'gif', 'json', 'txt']
        );
        console.log("✅ Bucket permissions updated successfully.");
    } catch (e) {
        if (e.code === 404) {
            console.log("Bucket not found, create new.");
             // Try create
             await storage.createBucket(BUCKET_ID, "Item Images", [Permission.read(Role.any())], false, true, undefined, ['jpg', 'png', 'json', 'txt']);
             console.log("Created bucket.");
        } else {
             console.error("❌ Failed to update bucket:", e.message);
        }
    }
}

fixBucket();
