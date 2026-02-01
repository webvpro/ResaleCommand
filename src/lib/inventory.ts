import { databases, storage, ID, Query } from './appwrite';
import type { Models } from 'appwrite';
import { Permission, Role } from 'appwrite';

const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID || 'resale_db'; 
const COLLECTION_ID = import.meta.env.PUBLIC_APPWRITE_COLLECTION_ID || 'items';
const BUCKET_ID = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID || 'item_images';

export interface ExtraItemData {
    paidPrice?: string;
    purchaseLocation?: string;
    maxBuyPrice?: string;
    binLocation?: string;
    title?: string;
    status?: 'draft' | 'in_cart' | 'need_to_list' | 'listed' | 'sold';
    receiptFile?: File | null;
    imageFile?: File | null;
    galleryFiles?: File[];
    existingGalleryIds?: string[];
    resalePrice?: string;
}

export async function saveItemToInventory(itemData: any, imageFile: File | null, extraData: ExtraItemData = {}, teamId?: string) {
    if (!import.meta.env.PUBLIC_APPWRITE_DB_ID) {
        throw new Error("Missing PUBLIC_APPWRITE_DB_ID in .env");
    }

    try {
        let imageId: string | null = null;

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

        let receiptImageId: string | null = null;
        if (extraData.receiptFile && BUCKET_ID) {
            try {
                const upload = await storage.createFile(
                     BUCKET_ID,
                     ID.unique(),
                     extraData.receiptFile
                );
                receiptImageId = upload.$id;
            } catch (e) {
                console.warn("Receipt upload failed:", e);
            }
        }

        // 1.5 Upload Gallery Images
        let galleryIds: string[] = [];
        if (extraData.galleryFiles && extraData.galleryFiles.length > 0 && BUCKET_ID) {
            try {
                const uploads = await Promise.all(extraData.galleryFiles.map(file => 
                    storage.createFile(BUCKET_ID, ID.unique(), file)
                ));
                galleryIds = uploads.map(u => u.$id);
            } catch (e) {
                console.warn("Gallery upload failed:", e);
            }
        }

        // 2. Prepare Document
        const doc = {
            title: itemData.title,
            identity: typeof itemData.identity === 'object' ? JSON.stringify(itemData.identity) : itemData.identity,
            priceMint: itemData.price_breakdown?.mint ? String(itemData.price_breakdown.mint) : null,
            priceFair: itemData.price_breakdown?.fair ? String(itemData.price_breakdown.fair) : null,
            pricePoor: itemData.price_breakdown?.poor ? String(itemData.price_breakdown.poor) : null,
            keywords: itemData.keywords,
            conditionNotes: itemData.condition_notes,
            imageId: imageId,
            galleryImageIds: galleryIds,
            purchasePrice: extraData.paidPrice || "0",
            purchaseLocation: extraData.purchaseLocation || "",
            maxBuyPrice: extraData.maxBuyPrice || "0",
            binLocation: extraData.binLocation || "",
            resalePrice: extraData.resalePrice || "0",
            receiptImageId: receiptImageId,
            createdAt: new Date().toISOString(),
            status: extraData.status || 'draft',
            teamId: teamId || null,
        };

        const permissions = teamId ? [
            Permission.read(Role.team(teamId)),
            Permission.update(Role.team(teamId)),
            Permission.delete(Role.team(teamId)),
        ] : []; // Default permissions are current user only if empty

        // 3. Create Document
        const response = await databases.createDocument(
            DB_ID,
            COLLECTION_ID,
            ID.unique(),
            doc,
            permissions
        );

// ... existing code ...
        return response;
    } catch (error) {
        console.error("Appwrite Save Error:", error);
        throw error;
    }
}

export async function getInventoryItems(teamId?: string) {
    try {
        const response = await databases.listDocuments(
            DB_ID,
            COLLECTION_ID,
            [
                Query.orderDesc('$createdAt'),
                ...(teamId ? [Query.equal('teamId', teamId)] : [])
            ]
        );
        return response.documents; 
    } catch (error) {
        console.error("Error fetching inventory:", error);
        return [];
    }
}

export async function deleteInventoryItem(documentId: string) {
    try {
        await databases.deleteDocument(
            DB_ID, 
            COLLECTION_ID, 
            documentId
        );
        return true;
    } catch (error) {
        console.error("Error deleting item:", error);
        throw error;
    }
}

export async function updateInventoryItem(documentId: string, updates: Partial<ExtraItemData>) {
    try {
        const data: any = {};
        
        // Handle Status
        if (updates.status) data.status = updates.status;
        
        // Handle Receipt Upload if present
        if (updates.receiptFile && BUCKET_ID) {
             const upload = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                updates.receiptFile
            );
            data.receiptImageId = upload.$id;
        }

        // Handle Main Image Upload if present
        if (updates.imageFile && BUCKET_ID) {
             const upload = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                updates.imageFile
            );
            data.imageId = upload.$id;
        }

        // Handle Gallery
        let finalGalleryIds = updates.existingGalleryIds || [];
        let hasGalleryUpdates = false;

        // Upload new files
        if (updates.galleryFiles && updates.galleryFiles.length > 0 && BUCKET_ID) {
            const uploads = await Promise.all(updates.galleryFiles.map(file => 
                storage.createFile(BUCKET_ID, ID.unique(), file)
            ));
            const newIds = uploads.map(u => u.$id);
            finalGalleryIds = [...finalGalleryIds, ...newIds];
            hasGalleryUpdates = true;
        }

        // If explicitly managing gallery (passed existing IDs) or added new ones, update the field
        if (updates.existingGalleryIds || hasGalleryUpdates) {
            data.galleryImageIds = finalGalleryIds;
        }

        // Update other fields as needed (generic)
        if (updates.paidPrice) data.purchasePrice = updates.paidPrice;
        if (updates.purchaseLocation) data.purchaseLocation = updates.purchaseLocation;
        if (updates.title) data.title = updates.title;
        if (updates.binLocation) data.binLocation = updates.binLocation;
        if (updates.resalePrice) data.resalePrice = updates.resalePrice;

        const response = await databases.updateDocument(
            DB_ID,
            COLLECTION_ID,
            documentId,
            data
        );
        return response;
    } catch (error) {
         console.error("Error updating item:", error);
         throw error;
    }
}
