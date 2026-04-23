import {
  Client,
  Databases,
  Permission,
  Role,
} from "node-appwrite";
import 'dotenv/config';

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

// Config
const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT || process.env.VITE_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID || process.env.VITE_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || process.env.VITE_PUBLIC_APPWRITE_DB_ID || "resale_db";
const ITEMS_DEV_COL = "items_dev";

async function ensureCollection(db, dbId, colId, name, permissions) {
  try {
    await db.getCollection(dbId, colId);
    log(`Collection ${colId} already exists.`);
  } catch (e) {
    if (e.code === 404) {
      log(`Creating Collection: ${colId}...`);
      await db.createCollection(dbId, colId, name, permissions, true);
      log(`Created Collection: ${colId}.`);
    } else {
      throw e;
    }
  }
}

async function ensureStringAttr(db, dbId, colId, key, size, required = false, defaultVal = undefined, array = false) {
  try {
    await db.createStringAttribute(dbId, colId, key, size, required, defaultVal, array);
    log(`[${colId}] Created string attribute: ${key}`);
  } catch (e) {
    if (e.code === 409) {
      log(`[${colId}] Attribute ${key} already exists.`);
    } else {
      console.error(`[${colId}] Failed to create string ${key}:`, e.message);
    }
  }
}

async function ensureFloatAttr(db, dbId, colId, key, required = false, defaultVal = undefined, array = false) {
  try {
    await db.createFloatAttribute(dbId, colId, key, required, undefined, undefined, defaultVal, array);
    log(`[${colId}] Created float attribute: ${key}`);
  } catch (e) {
    if (e.code === 409) {
      log(`[${colId}] Attribute ${key} already exists.`);
    } else {
      console.error(`[${colId}] Failed to create float ${key}:`, e.message);
    }
  }
}

async function run() {
  if (!API_KEY) {
    log("ERROR: APPWRITE_API_KEY not found in environment variables.");
    process.exit(1);
  }

  try {
    const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
    const db = new Databases(client);

    log(`Target Database: ${DB_ID}`);

    // 1. Ensure Items Dev Collection
    await ensureCollection(db, DB_ID, ITEMS_DEV_COL, "Resale Items (DEV SANDBOX)", [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
    
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "identity", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "title", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "keywords", 255, false, undefined, true);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "conditionNotes", 5000, false);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "redFlags", 255, false, undefined, true);
    await ensureFloatAttr(db, DB_ID, ITEMS_DEV_COL, "cost", false, 0.0);
    await ensureFloatAttr(db, DB_ID, ITEMS_DEV_COL, "resalePrice", false, 0.0);
    await ensureFloatAttr(db, DB_ID, ITEMS_DEV_COL, "maxBuyPrice", false, 0.0);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "sourcingLocation", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "storageLocation", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "status", 50, false, "received");
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "cartId", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "tenantId", 255, true);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "imageId", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "sellingLocations", 255, false, undefined, true);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "galleryImageIds", 255, false, undefined, true);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "receiptImageId", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "marketDescription", 65000, false);
    await ensureStringAttr(db, DB_ID, ITEMS_DEV_COL, "components", 65000, false);

    log("DEV DB SETUP COMPLETE SUCCESSFULLY!");
    process.exit(0);
  } catch (e) {
    log(`FATAL ERROR: ${e.message}`);
    console.error(e);
    process.exit(1);
  }
}

run();
