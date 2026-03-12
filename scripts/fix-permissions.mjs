import { Client, Databases, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();
client
    .setEndpoint(process.env.PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function grantAccess(dbId, colId) {
    try {
        console.log(`Fixing permissions for collection: ${colId}...`);
        
        const permissions = [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users())
        ];

        await databases.updateCollection(
            dbId, 
            colId, 
            colId, 
            permissions, 
            true // Enable Document Security
        );
        console.log(`[SUCCESS] Fixed permissions for ${colId}.`);
    } catch (e) {
        console.error(`[ERROR] fixing ${colId}:`, e.message);
    }
}

async function run() {
    const dbId = process.env.PUBLIC_APPWRITE_DB_ID || 'resale_db';
    const itemsCol = process.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';
    const alphaCol = process.env.PUBLIC_APPWRITE_ALPHA_COLLECTION_ID || 'alpha_items';
    const cartsCol = 'carts';
    const expensesCol = 'expenses';
    
    console.log("Applying universal 'users' Roles to Appwrite Collections...\n");
    await grantAccess(dbId, itemsCol);
    await grantAccess(dbId, alphaCol);
    await grantAccess(dbId, cartsCol);
    await grantAccess(dbId, expensesCol);
    console.log("\nDone!");
}

run();
