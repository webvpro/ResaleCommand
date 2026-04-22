import {
  Client,
  Databases,
} from "node-appwrite";
import 'dotenv/config';

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT || process.env.VITE_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID || process.env.VITE_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || process.env.VITE_PUBLIC_APPWRITE_DB_ID || "resale_db";

async function run() {
  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const db = new Databases(client);

  try {
    const result = await db.listDocuments(DB_ID, 'alpha_items', []);
    if (result.documents.length > 0) {
        console.log(JSON.stringify(result.documents[0], null, 2));
    }
  } catch (e) {
    console.error("Error reading alpha_items:", e.message);
  }
}

run();
