import {
  Client,
  Databases,
  Storage,
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
const ITEMS_COL = process.env.PUBLIC_APPWRITE_COLLECTION_ID || process.env.VITE_PUBLIC_APPWRITE_COLLECTION_ID || "items";
const CARTS_COL = "carts";
const EXPENSES_COL = "expenses";
const API_KEYS_COL = "api_keys";
const BUCKET_ID = process.env.PUBLIC_APPWRITE_BUCKET_ID || process.env.VITE_PUBLIC_APPWRITE_BUCKET_ID || "item_images";

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

async function ensureIntegerAttr(db, dbId, colId, key, required = false, defaultVal = undefined, array = false) {
  try {
    await db.createIntegerAttribute(dbId, colId, key, required, undefined, undefined, defaultVal, array);
    log(`[${colId}] Created integer attribute: ${key}`);
  } catch (e) {
    if (e.code === 409) {
      log(`[${colId}] Attribute ${key} already exists.`);
    } else {
      console.error(`[${colId}] Failed to create integer ${key}:`, e.message);
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

async function ensureBooleanAttr(db, dbId, colId, key, required = false, defaultVal = undefined, array = false) {
  try {
    await db.createBooleanAttribute(dbId, colId, key, required, defaultVal, array);
    log(`[${colId}] Created boolean attribute: ${key}`);
  } catch (e) {
    if (e.code === 409) {
      log(`[${colId}] Attribute ${key} already exists.`);
    } else {
      console.error(`[${colId}] Failed to create boolean ${key}:`, e.message);
    }
  }
}

async function ensureDatetimeAttr(db, dbId, colId, key, required = false, array = false) {
  try {
    await db.createDatetimeAttribute(dbId, colId, key, required, undefined, array);
    log(`[${colId}] Created datetime attribute: ${key}`);
  } catch (e) {
    if (e.code === 409) {
      log(`[${colId}] Attribute ${key} already exists.`);
    } else {
      console.error(`[${colId}] Failed to create datetime ${key}:`, e.message);
    }
  }
}

async function run() {
  if (!API_KEY) {
    log("ERROR: APPWRITE_API_KEY not found in environment variables.");
    process.exit(1);
  }

  try {
    const client = new Client()
      .setEndpoint(ENDPOINT)
      .setProject(PROJECT_ID)
      .setKey(API_KEY);

    const db = new Databases(client);
    const storage = new Storage(client);

    log(`Connecting to Appwrite Project: ${PROJECT_ID}`);
    log(`Target Database: ${DB_ID}`);

    // 1. Ensure Database Exists
    try {
      await db.get(DB_ID);
      log("Database exists.");
    } catch (e) {
      if (e.code === 404) {
        log("Database missing. Creating...");
        await db.create(DB_ID, "Resale DB");
        log(`Database ${DB_ID} created.`);
      } else {
        throw e;
      }
    }

    // 2. Ensure Carts Collection
    await ensureCollection(db, DB_ID, CARTS_COL, "Carts", [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
    await ensureStringAttr(db, DB_ID, CARTS_COL, "source", 255, true);
    await ensureStringAttr(db, DB_ID, CARTS_COL, "tenantId", 255, true);
    await ensureStringAttr(db, DB_ID, CARTS_COL, "buyerId", 255, true);
    await ensureStringAttr(db, DB_ID, CARTS_COL, "status", 50, false, "active");
    await ensureIntegerAttr(db, DB_ID, CARTS_COL, "itemCount", false, 0);
    await ensureFloatAttr(db, DB_ID, CARTS_COL, "totalCost", false, 0.0);
    await ensureFloatAttr(db, DB_ID, CARTS_COL, "projectedRevenue", false, 0.0);
    await ensureFloatAttr(db, DB_ID, CARTS_COL, "potentialProfit", false, 0.0);
    await ensureDatetimeAttr(db, DB_ID, CARTS_COL, "date", false);
    await ensureDatetimeAttr(db, DB_ID, CARTS_COL, "completedAt", false);
    await ensureDatetimeAttr(db, DB_ID, CARTS_COL, "processedAt", false);

    // 3. Ensure Expenses Collection
    await ensureCollection(db, DB_ID, EXPENSES_COL, "Expenses", [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
    await ensureStringAttr(db, DB_ID, EXPENSES_COL, "cartId", 255, true);
    await ensureStringAttr(db, DB_ID, EXPENSES_COL, "tenantId", 255, true);
    await ensureFloatAttr(db, DB_ID, EXPENSES_COL, "amount", true);
    await ensureStringAttr(db, DB_ID, EXPENSES_COL, "note", 1000, false);
    await ensureStringAttr(db, DB_ID, EXPENSES_COL, "receiptImageId", 255, false);
    await ensureDatetimeAttr(db, DB_ID, EXPENSES_COL, "date", true);

    // 4. Ensure Items Collection
    await ensureCollection(db, DB_ID, ITEMS_COL, "Resale Items", [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "identity", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "title", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "keywords", 255, false, undefined, true);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "conditionNotes", 5000, false);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "redFlags", 255, false, undefined, true);
    await ensureFloatAttr(db, DB_ID, ITEMS_COL, "cost", false, 0.0);
    await ensureFloatAttr(db, DB_ID, ITEMS_COL, "resalePrice", false, 0.0);
    await ensureFloatAttr(db, DB_ID, ITEMS_COL, "maxBuyPrice", false, 0.0);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "sourcingLocation", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "storageLocation", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "status", 50, false, "received");
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "cartId", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "tenantId", 255, true);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "imageId", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "sellingLocations", 255, false, undefined, true);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "galleryImageIds", 255, false, undefined, true);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "receiptImageId", 255, false);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "marketDescription", 65000, false);
    await ensureStringAttr(db, DB_ID, ITEMS_COL, "components", 65000, false);

    // 5. Ensure API Keys Collection
    await ensureCollection(db, DB_ID, API_KEYS_COL, "API Keys", [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ]);
    await ensureStringAttr(db, DB_ID, API_KEYS_COL, "key", 255, true);
    await ensureStringAttr(db, DB_ID, API_KEYS_COL, "name", 255, true);
    await ensureStringAttr(db, DB_ID, API_KEYS_COL, "userId", 255, true);
    await ensureStringAttr(db, DB_ID, API_KEYS_COL, "tenantId", 255, true);
    await ensureBooleanAttr(db, DB_ID, API_KEYS_COL, "isActive", false, true);

    // 6. Ensure Storage Bucket Exists
    try {
      await storage.getBucket(BUCKET_ID);
      log(`Bucket ${BUCKET_ID} exists.`);
    } catch (e) {
      if (e.code === 404) {
        log(`Bucket missing. Creating ${BUCKET_ID}...`);
        await storage.createBucket(
          BUCKET_ID,
          "Item Images",
          [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
          ],
          true,
          true,
          10 * 1024 * 1024,
          ["jpg", "jpeg", "png", "webp"],
        );
        log(`Bucket created.`);
      } else {
        throw e;
      }
    }

    log("SETUP COMPLETE SUCCESSFULLY!");
    process.exit(0);
  } catch (e) {
    log(`FATAL ERROR: ${e.message}`);
    console.error(e);
    process.exit(1);
  }
}

run();
