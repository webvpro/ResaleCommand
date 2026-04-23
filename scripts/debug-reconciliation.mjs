import Papa from 'papaparse';
import fs from 'fs';
import { Client, Databases, Query } from "node-appwrite";
import 'dotenv/config';

const ENDPOINT = process.env.PUBLIC_APPWRITE_ENDPOINT || process.env.VITE_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.PUBLIC_APPWRITE_PROJECT_ID || process.env.VITE_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID || process.env.VITE_PUBLIC_APPWRITE_DB_ID || "resale_db";
const TARGET_DB = "items_dev";

async function run() {
    const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
    const db = new Databases(client);

    let cursor = null;
    let hasMore = true;
    const appwriteItems = [];

    while (hasMore) {
        const queries = [Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const res = await db.listDocuments(DB_ID, TARGET_DB, queries);
        appwriteItems.push(...res.documents);
        if (res.documents.length < 100) hasMore = false;
        else cursor = res.documents[res.documents.length - 1].$id;
    }

    const csvText = fs.readFileSync('Products-2026-04-22 22_59_10.csv', 'utf8');

    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const csvItems = results.data;
            let unmatchedAppwrite = [...appwriteItems];
            const unmatchedCsvItems = [];
            const matchedItems = [];

            csvItems.forEach(csvRow => {
                const csvName = csvRow['Name']?.trim();
                if (!csvName) return;

                const matchIndex = unmatchedAppwrite.findIndex(item => 
                    item.title?.toLowerCase().trim() === csvName.toLowerCase()
                );

                if (matchIndex > -1) {
                    matchedItems.push(csvRow);
                    unmatchedAppwrite.splice(matchIndex, 1);
                } else {
                    unmatchedCsvItems.push(csvRow);
                }
            });

            const missingAppwriteItems = unmatchedAppwrite.filter(item => item.status !== 'sold');

            console.log("\n--- UNMATCHED CSV ITEMS (In Booth, Not in App) ---");
            unmatchedCsvItems.slice(0, 10).forEach(i => console.log(`- ${i['Name']}`));
            if (unmatchedCsvItems.length > 10) console.log(`...and ${unmatchedCsvItems.length - 10} more`);

            console.log("\n--- MISSING FROM BOOTH (In App, Not in CSV) ---");
            missingAppwriteItems.slice(0, 10).forEach(i => console.log(`- ${i.title}`));
            if (missingAppwriteItems.length > 10) console.log(`...and ${missingAppwriteItems.length - 10} more`);
        }
    });
}

run();
