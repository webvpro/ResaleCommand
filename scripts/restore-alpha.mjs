import {
  Client,
  Databases,
  Query,
} from "node-appwrite";
import 'dotenv/config';

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT || process.env.VITE_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID || process.env.VITE_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || process.env.VITE_PUBLIC_APPWRITE_DB_ID || "resale_db";
const ITEMS_COL = process.env.PUBLIC_APPWRITE_COLLECTION_ID || process.env.VITE_PUBLIC_APPWRITE_COLLECTION_ID || "items";
const ALPHA_COL = "alpha_items";

async function run() {
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const db = new Databases(client);

  let cursor = null;
  let hasMore = true;
  let restoredCount = 0;

  try {
    console.log(`Starting restore from ${ALPHA_COL} to ${ITEMS_COL}...`);
    while (hasMore) {
      const queries = [Query.limit(100)];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const result = await db.listDocuments(DB_ID, ALPHA_COL, queries);
      if (result.documents.length === 0) {
        hasMore = false;
        break;
      }

      for (const doc of result.documents) {
        // Map old properties to the new schema
        const newDoc = {
          title: doc.title?.substring(0, 255),
          identity: doc.identity?.substring(0, 255),
          conditionNotes: doc.conditionNotes,
          status: doc.status || 'received',
          tenantId: doc.tenantId,
          imageId: doc.imageId,
          galleryImageIds: doc.galleryImageIds?.length > 0 ? doc.galleryImageIds : undefined,
          receiptImageId: doc.receiptImageId || undefined,
          cost: doc.cost,
          resalePrice: doc.resalePrice,
          maxBuyPrice: doc.maxBuyPrice,
          sourcingLocation: doc.purchaseLocation || undefined,
          storageLocation: doc.binLocation || undefined,
          sellingLocations: doc.salesChannel?.length > 0 ? doc.salesChannel : undefined,
          cartId: doc.cartId || undefined,
          marketDescription: doc.marketDescription || undefined,
          redFlags: doc.red_flags?.length > 0 ? doc.red_flags : undefined,
          keywords: doc.keywords?.length > 0 ? doc.keywords : undefined,
          components: doc.components || undefined
        };

        // Strip undefined keys to satisfy Appwrite validation
        Object.keys(newDoc).forEach(key => newDoc[key] === undefined && delete newDoc[key]);

        try {
          // Attempt to copy document over keeping its exact ID and permissions
          await db.createDocument(DB_ID, ITEMS_COL, doc.$id, newDoc, doc.$permissions);
          restoredCount++;
        } catch (err) {
            if (err.code === 409) {
                console.log(`[SKIP] Item ${doc.$id} already exists in new table.`);
            } else {
                console.error(`[ERROR] Failed to restore item ${doc.$id}:`, err.message);
            }
        }
      }

      cursor = result.documents[result.documents.length - 1].$id;
      console.log(`Processed batch... (${restoredCount} restored so far)`);
    }

    console.log(`\n✅ Successfully restored ${restoredCount} items from alpha_items!`);
  } catch (e) {
    console.error("Error restoring items:", e);
  }
}

run();
