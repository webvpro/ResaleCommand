import { Client, Storage, ID, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

async function run() {
    try {
        console.log("Creating/Verifying 'imports' bucket...");
        // Check if exists (by trying to get it, or list)
        // Simplest is just try create, catch 409
        await storage.createBucket(
            'imports', 
            'imports', 
            [Permission.read(Role.any()), Permission.write(Role.users())], // Permissions
            false, // File Security
            true, // Enabled
            undefined, // Max Size
            ['csv', 'txt'] // Allowed extensions
        );
        console.log("✅ Bucket 'imports' created.");
    } catch (e) {
        if (e.code === 409) {
            console.log("ℹ️ Bucket 'imports' already exists.");
        } else {
            console.error("❌ Error:", e.message);
        }
    }
}

run();
