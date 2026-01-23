import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
const COLLECTION_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';
const BUCKET_ID = process.env.PUBLIC_APPWRITE_BUCKET_ID || 'item_images';

async function setup() {
    console.log('🚀 Starting Appwrite Setup...');
    console.log('--------------------------------');
    console.log('Endpoint:', process.env.PUBLIC_APPWRITE_ENDPOINT);
    console.log('Project ID:', process.env.PUBLIC_APPWRITE_PROJECT_ID);
    console.log('API Key Length:', process.env.APPWRITE_API_KEY ? process.env.APPWRITE_API_KEY.length : 'MISSING');
    console.log('--------------------------------');

    // 1. Database
    try {
        await databases.get(DB_ID);
        console.log(`✅ Database "${DB_ID}" already exists.`);
    } catch {
        await databases.create(DB_ID, DB_ID);
        console.log(`✅ Created Database: "${DB_ID}"`);
    }

    // 2. Collection
    try {
        await databases.getCollection(DB_ID, COLLECTION_ID);
        console.log(`✅ Collection "${COLLECTION_ID}" already exists.`);
    } catch {
        await databases.createCollection(DB_ID, COLLECTION_ID, COLLECTION_ID, [
            Permission.read(Role.any()), // Allow public read (optional, adjust as needed)
            Permission.create(Role.any()), // WARNING: Allows anyone to create items. Secure this in production!
            Permission.update(Role.any()),
            Permission.delete(Role.any()),
        ]);
        console.log(`✅ Created Collection: "${COLLECTION_ID}"`);
    }

    // 3. Attributes
    const attributes = [
        { key: 'title', type: 'string', size: 255, required: true },
        { key: 'identity', type: 'string', size: 10000, required: false }, // Big JSON string
        { key: 'priceMint', type: 'double', required: false },
        { key: 'priceFair', type: 'double', required: false },
        { key: 'pricePoor', type: 'double', required: false },
        { key: 'keywords', type: 'string', size: 255, required: false, array: true },
        { key: 'conditionNotes', type: 'string', size: 5000, required: false },
        { key: 'imageId', type: 'string', size: 255, required: false },
        { key: 'status', type: 'string', size: 50, required: false, default: 'draft' },
        { key: 'createdAt', type: 'datetime', required: false },
    ];

    console.log('⏳ Checking/Creating Attributes...');
    for (const attr of attributes) {
        try {
            await databases.getAttribute(DB_ID, COLLECTION_ID, attr.key);
            console.log(`   - Attribute "${attr.key}" exists.`);
        } catch {
            if (attr.type === 'string') {
                await databases.createStringAttribute(DB_ID, COLLECTION_ID, attr.key, attr.size, attr.required, attr.default, attr.array);
            } else if (attr.type === 'double') {
                await databases.createFloatAttribute(DB_ID, COLLECTION_ID, attr.key, attr.required, 0, 1000000, attr.default);
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(DB_ID, COLLECTION_ID, attr.key, attr.required, attr.default);
            }
            console.log(`   + Created Attribute: "${attr.key}"`);
            // Wait a bit to avoid rate limits or race conditions
            await new Promise(r => setTimeout(r, 500)); 
        }
    }

    // 4. Storage Bucket
    try {
        await storage.getBucket(BUCKET_ID);
        console.log(`✅ Storage Bucket "${BUCKET_ID}" already exists.`);
    } catch {
        await storage.createBucket(BUCKET_ID, BUCKET_ID, [
             Permission.read(Role.any()),
             Permission.create(Role.any()),
        ]);
        console.log(`✅ Created Storage Bucket: "${BUCKET_ID}"`);
    }

    console.log('🎉 Appwrite Setup Complete!');
}

setup().catch(console.error);
