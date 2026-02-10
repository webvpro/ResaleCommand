
import { Client, Storage } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Must use API Key for admin tasks

const storage = new Storage(client);
const BUCKET_ID = process.env.PUBLIC_APPWRITE_BUCKET_ID || 'item_images';

async function updateCors() {
    console.log(`🔧 Updating CORS for bucket: ${BUCKET_ID}...`);
    try {
        // We need to update the bucket file security settings?
        // Appwrite Buckets don't have per-bucket CORS settings in the API easily exposed in all versions, 
        // BUT actually, strictly speaking, Appwrite handles CORS globally via the 'Platforms' setting in the Console.
        // HOWEVER, for S3-compatible endpoints or strict browser checks, typically we need to ensure the Platform is registered.
        
        console.log("ℹ️  Note: Appwrite CORS is primarily managed by adding your domain (localhost) as a 'Web' Platform in the Appwrite Console.");
        console.log("ℹ️  This script ensures the Bucket allows read access to 'Any' (public) which is usually required for public fetches, but CORS is a browser-policy.");
        
        // Let's ensure the bucket is public (Permissions)
        const bucket = await storage.getBucket(BUCKET_ID);
        console.log(`Bucket '${bucket.name}' found.`);
        console.log(`Current Permissions:`, bucket.$permissions);

        // Ensure role:all has read access
        if (!bucket.$permissions.includes('read("any")')) {
            console.log("⚠️ Bucket is not public. Adding read('any')...");
            // This might overwrite other perms, so append
            const newPerms = [...new Set([...bucket.$permissions, 'read("any")'])];
            await storage.updateBucket(BUCKET_ID, bucket.name, newPerms,  bucket.fileSecurity, bucket.enabled, bucket.maximumFileSize, bucket.allowedFileExtensions, bucket.compression, bucket.encryption, bucket.antivirus);
            console.log("✅ Bucket permissions updated.");
        } else {
            console.log("✅ Bucket is already public (read('any')).");
        }

    } catch (e) {
        console.error("❌ Error updating bucket:", e.message);
    }
}

updateCors();
