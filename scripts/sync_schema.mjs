import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const ALPHA_COL_ID = process.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items';
const COL_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function syncSchema() {
    console.log(`Starting schema sync from ${ALPHA_COL_ID} to ${COL_ID}...`);
    try {
        const alphaCol = await databases.getCollection(DB_ID, ALPHA_COL_ID);
        const prodCol = await databases.getCollection(DB_ID, COL_ID);
        
        const alphaAttrs = alphaCol.attributes;
        const prodAttrs = prodCol.attributes;
        
        const prodAttrKeys = new Set(prodAttrs.map(a => a.key));
        
        for (const attr of alphaAttrs) {
            if (!prodAttrKeys.has(attr.key)) {
                console.log(`Missing attribute in prod: ${attr.key} (${attr.type}). Creating...`);
                try {
                    switch (attr.type) {
                        case 'string':
                            await databases.createStringAttribute(DB_ID, COL_ID, attr.key, attr.size || 255, attr.required, attr.default || undefined, attr.array);
                            break;
                        case 'integer':
                            await databases.createIntegerAttribute(DB_ID, COL_ID, attr.key, attr.required, attr.min || undefined, attr.max || undefined, attr.default || undefined, attr.array);
                            break;
                        case 'float':
                            await databases.createFloatAttribute(DB_ID, COL_ID, attr.key, attr.required, attr.min || undefined, attr.max || undefined, attr.default || undefined, attr.array);
                            break;
                        case 'boolean':
                            await databases.createBooleanAttribute(DB_ID, COL_ID, attr.key, attr.required, attr.default || undefined, attr.array);
                            break;
                        case 'datetime':
                            await databases.createDatetimeAttribute(DB_ID, COL_ID, attr.key, attr.required, attr.default || undefined, attr.array);
                            break;
                        default:
                            console.error(`Unknown type: ${attr.type}`);
                    }
                    await wait(500); 
                } catch(e) {
                    console.error(`Failed to create ${attr.key}:`, e.message);
                }
            } else {
                console.log(`Attribute ${attr.key} already exists in target.`);
            }
        }
        
        // Also copy indexes
        const alphaIndexes = alphaCol.indexes;
        const prodIndexes = prodCol.indexes;
        const prodIndexKeys = new Set(prodIndexes.map(i => i.key));
        
        for (const idx of alphaIndexes) {
            if (!prodIndexKeys.has(idx.key)) {
                console.log(`Missing index in prod: ${idx.key}. Creating...`);
                try {
                    await databases.createIndex(DB_ID, COL_ID, idx.key, idx.type, idx.attributes, idx.orders);
                    await wait(500);
                } catch(e) {
                     console.error(`Failed to create index ${idx.key}:`, e.message);
                }
            } else {
                console.log(`Index ${idx.key} already exists.`);
            }
        }
        
        console.log("Schema sync complete!");
    } catch(e) {
        console.error("Error during schema sync:", e);
    }
}

syncSchema();
