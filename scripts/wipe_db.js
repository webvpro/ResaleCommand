
import { Client, Databases, Storage, Query, Permission, Role } from 'node-appwrite';
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
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const COL_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID;
const BUCKET_ID = process.env.PUBLIC_APPWRITE_BUCKET_ID || 'item_images';

async function wipe() {
    if (!process.argv.includes('--run')) {
        console.log("⚠️  Dry Run Only. Pass --run to execute deletion.");
        console.log("   Usage: node scripts/wipe_db.js --run");
        return;
    }

    console.log("🚀 STARTING FULL SYSTEM WIPE & RESET...");

    // 1. WIPE BUCKET
    if (BUCKET_ID) {
        console.log(`\n🗑️  Cleaning Bucket: ${BUCKET_ID}...`);
        try {
            let hasFiles = true;
            while(hasFiles) {
                const res = await storage.listFiles(BUCKET_ID, [Query.limit(100)]);
                if (res.files.length === 0) {
                    hasFiles = false;
                    break;
                }
                
                console.log(`   - Deleting batch of ${res.files.length} files...`);
                await Promise.all(res.files.map(f => 
                    storage.deleteFile(BUCKET_ID, f.$id).catch(e => {})
                ));
            }
            console.log("   ✅ Bucket Emptied.");

            // 2. FIX BUCKET PERMISSIONS
            console.log("   🔧 fixing Bucket Permissions...");
            await storage.updateBucket(
                BUCKET_ID, 
                'Item Images', 
                [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())],
                false, true, undefined, 
                ['jpg', 'jpeg', 'png', 'webp', 'gif', 'json', 'txt']
            );
            console.log("   ✅ Bucket Permissions Fixed!");

        } catch (e) {
            console.error("   ❌ Bucket Error:", e.message);
        }
    }

    // 3. WIPE DATABASE
    console.log(`\n🗑️  Cleaning Database: ${DB_ID} / ${COL_ID}...`);
    let allItems = [];
    let offset = 0;
    while(true) {
        const res = await databases.listDocuments(DB_ID, COL_ID, [
            Query.limit(100),
            Query.offset(offset)
        ]);
        if(res.documents.length === 0) break;
        allItems.push(...res.documents);
        offset += res.documents.length;
    }
    
    console.log(`   Found ${allItems.length} items to delete.`);

    for (const item of allItems) {
        try {
            process.stdout.write(`   - Deleting ${item.$id}... `);
            await databases.deleteDocument(DB_ID, COL_ID, item.$id);
            console.log("Deleted");
        } catch (e) {
            console.log("Failed: " + e.message);
        }
    }
    console.log("\n✨ FULL SYSTEM WIPE COMPLETE!");
}

wipe().catch(console.error);
