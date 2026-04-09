import { Client, Databases, Storage, ID, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = process.env.PUBLIC_APPWRITE_DB_ID;
const COL_ID = process.env.PUBLIC_APPWRITE_COLLECTION_ID;
const OLD_BUCKET = process.env.PUBLIC_APPWRITE_BUCKET_ID;
const NEW_BUCKET = 'reports';

async function migrate() {
    console.log("🚀 Starting System Migration...");
    try {
        let cursor = null;
        let hasMore = true;
        let count = 0;

        while (hasMore) {
            const queries = [Query.limit(100)];
            if (cursor) queries.push(Query.cursorAfter(cursor));

            const res = await databases.listDocuments(DB_ID, COL_ID, queries);
            if (res.documents.length === 0) break;

            for (const doc of res.documents) {
                if (doc.conditionNotes) {
                    let updatedNotes = doc.conditionNotes;
                    let modified = false;

                    const fileMatch = doc.conditionNotes.match(/\[SCOUT_REPORT_ID: ([^\]]+)\]/);
                    if (fileMatch) {
                        const oldId = fileMatch[1].trim();
                        try {
                            const buffer = await storage.getFileDownload(OLD_BUCKET, oldId);
                            console.log(`📦 Item ${doc.$id}: Found JSON file. Re-uploading...`);
                            
                            const inputFile = InputFile.fromBuffer(Buffer.from(buffer), 'scout.json');
                            const newUpload = await storage.createFile(NEW_BUCKET, ID.unique(), inputFile);
                            
                            updatedNotes = updatedNotes.replace(`[SCOUT_REPORT_ID: ${oldId}]`, `[SCOUT_REPORT_ID: ${newUpload.$id}]`);
                            modified = true;
                            
                            await storage.deleteFile(OLD_BUCKET, oldId).catch(e => {});
                        } catch (e) {
                            if (e.code !== 404) console.log(`Skipped JSON ${oldId} - ` + e.message);
                        }
                    }

                    const mdMatch = doc.conditionNotes.match(/\[SCOUT_REPORT_MD: ([^\]]+)\]/);
                    if (mdMatch) {
                        const oldId = mdMatch[1].trim();
                        try {
                            const buffer = await storage.getFileDownload(OLD_BUCKET, oldId);
                            console.log(`📄 Item ${doc.$id}: Found MD file. Re-uploading...`);
                            
                            const inputFile = InputFile.fromBuffer(Buffer.from(buffer), 'scout.md');
                            const newUpload = await storage.createFile(NEW_BUCKET, ID.unique(), inputFile);
                            
                            updatedNotes = updatedNotes.replace(`[SCOUT_REPORT_MD: ${oldId}]`, `[SCOUT_REPORT_MD: ${newUpload.$id}]`);
                            modified = true;
                            
                            await storage.deleteFile(OLD_BUCKET, oldId).catch(e => {});
                        } catch (e) {
                            if (e.code !== 404) console.log(`Skipped MD ${oldId} - ` + e.message);
                        }
                    }

                    if (modified) {
                        await databases.updateDocument(DB_ID, COL_ID, doc.$id, { conditionNotes: updatedNotes });
                        count++;
                        console.log(`✅ Updated database record for item ${doc.$id}`);
                    }
                }
                cursor = doc.$id;
            }
            if (res.documents.length < 100) hasMore = false;
        }

        console.log(`\n🎉 Migration Complete! Successfully transferred and mapped ${count} items.`);
    } catch (e) {
        console.error("Migration Error:", e);
    }
}

migrate();
