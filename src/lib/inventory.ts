import { databases, storage, ID } from './appwrite';

const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID || 'resale_db'; 
const COLLECTION_ID = import.meta.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';
const BUCKET_ID = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID || 'item_images';

export async function saveItemToInventory(itemData: any, imageFile: File | null) {
    if (!import.meta.env.PUBLIC_APPWRITE_DB_ID) {
        throw new Error("Missing PUBLIC_APPWRITE_DB_ID in .env");
    }

    try {
        let imageId = null;

        // 1. Upload Image if exists
        // Note: You need to create a Storage Bucket in Appwrite first
        if (imageFile && BUCKET_ID) {
            try {
                const upload = await storage.createFile(
                    BUCKET_ID,
                    ID.unique(),
                    imageFile
                );
                imageId = upload.$id;
            } catch (e) {
                console.warn("Image upload failed (Check Bucket ID permissions):", e);
            }
        }

        // 2. Prepare Document
        const doc = {
            title: itemData.title,
            identity: typeof itemData.identity === 'object' ? JSON.stringify(itemData.identity) : itemData.identity,
            priceMint: itemData.price_breakdown?.mint,
            priceFair: itemData.price_breakdown?.fair,
            pricePoor: itemData.price_breakdown?.poor,
            keywords: itemData.keywords,
            conditionNotes: itemData.condition_notes,
            imageId: imageId,
            createdAt: new Date().toISOString(),
            status: 'draft'
        };

        // 3. Create Document
        const response = await databases.createDocument(
            DB_ID,
            COLLECTION_ID,
            ID.unique(),
            doc
        );

        return response;
    } catch (error) {
        console.error("Appwrite Save Error:", error);
        throw error;
    }
}
