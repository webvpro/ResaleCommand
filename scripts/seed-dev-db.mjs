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
const ITEMS_DEV_COL = "items_dev";

async function run() {
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const db = new Databases(client);

  let cursor = null;
  let hasMore = true;
  let restoredCount = 0;

  try {
    console.log(`Copying data from ${ITEMS_COL} to ${ITEMS_DEV_COL} for testing...`);
    while (hasMore) {
      const queries = [Query.limit(100)];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const result = await db.listDocuments(DB_ID, ITEMS_COL, queries);
      if (result.documents.length === 0) {
        hasMore = false;
        break;
      }

      for (const doc of result.documents) {
        const newDoc = { ...doc };
        
        // Strip system properties
        delete newDoc.$id;
        delete newDoc.$collectionId;
        delete newDoc.$databaseId;
        delete newDoc.$createdAt;
        delete newDoc.$updatedAt;
        delete newDoc.$permissions;
        
        // Strip undefined
        Object.keys(newDoc).forEach(key => newDoc[key] === undefined && delete newDoc[key]);

        try {
          await db.createDocument(DB_ID, ITEMS_DEV_COL, doc.$id, newDoc, doc.$permissions);
          restoredCount++;
        } catch (err) {
            if (err.code === 409) {
                // already exists
            } else {
                console.error(`[ERROR] Failed to copy item ${doc.$id}:`, err.message);
            }
        }
      }

      cursor = result.documents[result.documents.length - 1].$id;
      console.log(`Processed batch... (${restoredCount} copied so far)`);
    }

    console.log(`\n✅ Successfully seeded ${restoredCount} items into items_dev!`);
  } catch (e) {
    console.error("Error copying items:", e);
  }
}

run();
