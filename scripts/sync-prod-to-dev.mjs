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
const ITEMS_COL = "items";
const DEV_COL = "items_dev";

async function run() {
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const db = new Databases(client);

  try {
    console.log(`Step 1: Wiping ${DEV_COL}...`);
    let hasMoreToWipe = true;
    let wipedCount = 0;
    while (hasMoreToWipe) {
      const res = await db.listDocuments(DB_ID, DEV_COL, [Query.limit(100)]);
      if (res.documents.length === 0) {
        hasMoreToWipe = false;
        break;
      }
      for (const doc of res.documents) {
        await db.deleteDocument(DB_ID, DEV_COL, doc.$id);
        wipedCount++;
      }
      console.log(`Wiped ${wipedCount} items...`);
    }

    console.log(`\nStep 2: Starting copy from ${ITEMS_COL} to ${DEV_COL}...`);
    let cursor = null;
    let hasMoreToCopy = true;
    let copiedCount = 0;

    while (hasMoreToCopy) {
      const queries = [Query.limit(100)];
      if (cursor) queries.push(Query.cursorAfter(cursor));

      const result = await db.listDocuments(DB_ID, ITEMS_COL, queries);
      if (result.documents.length === 0) {
        hasMoreToCopy = false;
        break;
      }

      for (const doc of result.documents) {
        const newDoc = { ...doc };
        delete newDoc.$id;
        delete newDoc.$createdAt;
        delete newDoc.$updatedAt;
        delete newDoc.$permissions;
        delete newDoc.$databaseId;
        delete newDoc.$collectionId;
        
        // Strip undefined
        Object.keys(newDoc).forEach(key => newDoc[key] === undefined && delete newDoc[key]);

        try {
          await db.createDocument(DB_ID, DEV_COL, doc.$id, newDoc, doc.$permissions);
          copiedCount++;
        } catch (err) {
            console.error(`[ERROR] Failed to copy item ${doc.$id}:`, err.message);
        }
      }

      cursor = result.documents[result.documents.length - 1].$id;
      console.log(`Processed batch... (${copiedCount} copied so far)`);
    }

    console.log(`\n✅ Successfully synced ${copiedCount} items from production to items_dev!`);
  } catch (e) {
    console.error("Error syncing items:", e);
  }
}

run();
