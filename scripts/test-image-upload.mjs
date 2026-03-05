
import { Client, Storage, ID, Permission, Role } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

// 1. Manually Load .env because we don't assume 'dotenv' is installed globally
const envPath = path.resolve('.env');
let env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) env[key.trim()] = val.trim().replace(/^["']|["']$/g, ''); 
    });
}

const ENDPOINT = env.PUBLIC_APPWRITE_ENDPOINT;
const PROJECT = env.PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = env.APPWRITE_API_KEY;
const BUCKET_ID = env.PUBLIC_APPWRITE_BUCKET_ID || 'item_images';

console.log('--- APPWRITE IMAGE UPLOAD DIAGNOSTIC ---');
console.log(`Endpoint: ${ENDPOINT}`);
console.log(`Project: ${PROJECT}`);
console.log(`Bucket: ${BUCKET_ID}`);
console.log(`API Key Present: ${API_KEY ? 'YES' : 'NO'}`);

if (!ENDPOINT || !PROJECT || !API_KEY) {
    console.error('❌ ERROR: Missing environment variables. Check .env file.');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT)
    .setKey(API_KEY);

const storage = new Storage(client);

async function testUpload() {
    try {
        console.log('\nScanning Bucket Permissions...');
        try {
            const bucket = await storage.getBucket(BUCKET_ID);
            console.log(`✅ Bucket Found: ${bucket.name} (${bucket.$id})`);
            console.log(`   Allowed Extensions: ${bucket.allowedFileExtensions.join(', ')}`);
            console.log(`   File Security: ${bucket.fileSecurity ? 'ON' : 'OFF'}`);
        } catch (e) {
            console.error(`❌ Bucket Access Error: ${e.message}`);
            // Attempt Auto-Repair if missing
            console.log('   Attempting to create/repair bucket...');
            try {
                await storage.createBucket(BUCKET_ID, 'Item Images', 
                    [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())],
                    false, true, undefined, 
                    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'json', 'txt']
                );
                console.log('   ✅ Bucket Created/Repaired!');
            } catch (creatErr) {
                 // Try update if create failed (likely exists but permissions failed)
                 try {
                    await storage.updateBucket(BUCKET_ID, 'Item Images', 
                        [Permission.read(Role.any()), Permission.create(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())],
                        false, true, undefined, 
                         ['jpg', 'jpeg', 'png', 'webp', 'gif', 'json', 'txt']
                    );
                    console.log('   ✅ Bucket Updated!');
                 } catch (updateErr) {
                     console.error('   ❌ Failed to Repair Bucket:', updateErr.message);
                 }
            }
        }

        console.log('\nTesting Image Upload...');
        // Create a dummy 1x1 GIF (smallest valid image)
        const fakeImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        
        // Simulating a file upload
        const tempFile = new File([fakeImageBuffer], 'test-upload.gif', { type: 'image/gif' });
        
        // Use InputFile form for Node SDK
        // In Node SDK, createJSON/File usually expects a Stream or Buffer with filename
        // Let's rely on standard InputFile handling if supported, or Buffer
        const inputFile = InputFile.fromBuffer(fakeImageBuffer, 'test-upload.gif');

        const result = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            inputFile
        );

        console.log(`✅ UPLOAD SUCCESS! File ID: ${result.$id}`);
        console.log(`   URL: ${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${result.$id}/view?project=${PROJECT}`);

        // Clean up
        console.log('\nCleaning up test file...');
        await storage.deleteFile(BUCKET_ID, result.$id);
        console.log('✅ Cleanup Success.');

    } catch (error) {
        console.error('\n❌ CRITICAL UPLOAD ERROR:', error);
        console.error('   (Check permissions, allowed extensions, or file size limits)');
    }
}

// Node SDK InputFile Helper
import { InputFile } from 'node-appwrite/file';

testUpload();

