import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
const COLLECTION_ID = 'items'; // Use prod collection

async function checkLots() {
    try {
        console.log('Querying all items to find parent lot linkages...');
        
        // Fetch up to 5000 items (using pagination if needed, but for simplicity let's grab a chunk)
        let allItems = [];
        let cursor = null;
        let keepGoing = true;
        
        while (keepGoing) {
            const queries = [Query.limit(100), Query.orderDesc('$createdAt')];
            if (cursor) queries.push(Query.cursorAfter(cursor));
            
            const res = await databases.listDocuments(DB_ID, COLLECTION_ID, queries);
            allItems.push(...res.documents);
            
            if (res.documents.length < 100) keepGoing = false;
            else cursor = res.documents[res.documents.length - 1].$id;
        }

        console.log(`Fetched ${allItems.length} total items from production DB.`);

        const parentLotMap = new Map();
        
        for (const item of allItems) {
            if (item.parentLotId) {
                if (!parentLotMap.has(item.parentLotId)) {
                    parentLotMap.set(item.parentLotId, []);
                }
                parentLotMap.get(item.parentLotId).push(item.title);
            }
        }

        console.log(`\nFound ${parentLotMap.size} Parent Lots with extracted children:`);
        for (const [parentId, children] of parentLotMap.entries()) {
            const parentDoc = allItems.find(i => i.$id === parentId);
            const parentName = parentDoc ? parentDoc.title : 'UNKNOWN PARENT (Deleted?)';
            console.log(`- Parent: ${parentName} (${parentId})`);
            console.log(`  -> ${children.length} extracted items.`);
        }
        
    } catch (e) {
        console.error(e);
    }
}
checkLots();
