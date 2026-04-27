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

async function findParents() {
    try {
        // Fetch all items in items_dev
        const res = await databases.listDocuments(DB_ID, 'items_dev', [
            Query.limit(100),
            Query.orderDesc('$createdAt')
        ]);
        const allItems = res.documents;

        const failedItems = allItems.filter(i => 
            !i.parentLotId && 
            i.conditionNotes && 
            (i.conditionNotes.includes('Extracted from Bulk Lot') || i.conditionNotes.includes('Extracted 1 from Lot:'))
        );

        console.log(`Found ${failedItems.length} failed items. Looking for parents...`);

        for (const child of failedItems) {
            // Find parent based on sourcingLocation or orderId
            const possibleParents = allItems.filter(p => 
                p.$id !== child.$id && 
                ((p.sourcingLocation && p.sourcingLocation === child.sourcingLocation) || 
                 (p.orderId && p.orderId === child.orderId) ||
                 (p.conditionNotes && child.conditionNotes && 
                  p.conditionNotes.match(/Location: (http[^\n]+)/) && 
                  child.conditionNotes.match(/Location: (http[^\n]+)/) &&
                  p.conditionNotes.match(/Location: (http[^\n]+)/)[1] === child.conditionNotes.match(/Location: (http[^\n]+)/)[1]
                 )) &&
                // Parent should ideally be a lot
                (p.quantity > 1 || (p.title && p.title.toLowerCase().startsWith('lot')))
            );

            if (possibleParents.length > 0) {
                console.log(`\n✅ Child: ${child.title}`);
                console.log(`   Found True Parent: ${possibleParents[0].title} (ID: ${possibleParents[0].$id})`);
            } else {
                console.log(`\n❌ Child: ${child.title}`);
                console.log(`   Could not find matching parent based on Location/Order.`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
findParents();
