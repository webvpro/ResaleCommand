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

async function fixParents() {
    try {
        // Fetch all items in items_dev
        let allItems = [];
        let cursor = null;
        let keepGoing = true;
        
        while (keepGoing) {
            const queries = [Query.limit(100), Query.orderDesc('$createdAt')];
            if (cursor) queries.push(Query.cursorAfter(cursor));
            
            const res = await databases.listDocuments(DB_ID, 'items_dev', queries);
            allItems.push(...res.documents);
            
            if (res.documents.length < 100) keepGoing = false;
            else cursor = res.documents[res.documents.length - 1].$id;
        }

        const failedItems = allItems.filter(i => 
            !i.parentLotId && 
            i.conditionNotes && 
            (i.conditionNotes.includes('Extracted from Bulk Lot') || i.conditionNotes.includes('Extracted 1 from Lot:'))
        );

        console.log(`Found ${failedItems.length} failed items. Fixing...`);

        let fixCount = 0;
        for (const child of failedItems) {
            // Find parent based on sourcingLocation or orderId
            const possibleParents = allItems.filter(p => 
                p.$id !== child.$id && 
                // Must not be an extracted child itself
                !(p.conditionNotes && (p.conditionNotes.includes('Extracted from Bulk Lot') || p.conditionNotes.includes('Extracted 1 from Lot:'))) &&
                // Must match location or order
                ((p.sourcingLocation && p.sourcingLocation === child.sourcingLocation) || 
                 (p.orderId && p.orderId === child.orderId) ||
                 (p.conditionNotes && child.conditionNotes && 
                  p.conditionNotes.match(/Location: (http[^\n]+)/) && 
                  child.conditionNotes.match(/Location: (http[^\n]+)/) &&
                  p.conditionNotes.match(/Location: (http[^\n]+)/)[1] === child.conditionNotes.match(/Location: (http[^\n]+)/)[1]
                 ) ||
                 (p.conditionNotes && child.conditionNotes && 
                  p.conditionNotes.match(/Order #: (\d+)/) && 
                  child.conditionNotes.match(/Order #: (\d+)/) &&
                  p.conditionNotes.match(/Order #: (\d+)/)[1] === child.conditionNotes.match(/Order #: (\d+)/)[1]
                 ))
            );

            if (possibleParents.length > 0) {
                // If multiple, try to pick the one that is a "Lot"
                const bestParent = possibleParents.find(p => p.quantity > 1 || (p.title && p.title.toLowerCase().startsWith('lot'))) || possibleParents[0];
                
                console.log(`✅ Linking '${child.title}' -> '${bestParent.title}'`);
                await databases.updateDocument(DB_ID, 'items_dev', child.$id, {
                    parentLotId: bestParent.$id
                });
                fixCount++;
            } else {
                console.log(`❌ Could not find parent for: ${child.title}`);
            }
        }
        
        console.log(`Successfully fixed ${fixCount} items!`);
    } catch (e) {
        console.error(e);
    }
}
fixParents();
