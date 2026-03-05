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
    orderId?: string;
    title?: string;
    status?: 'scouted' | 'acquired' | 'processing' | 'need_to_list' | 'listed' | 'at_location' | 'sold';
    receiptFile?: File | null;
    imageFile?: File | null;
    galleryFiles?: File[];
    existingGalleryIds?: string[];
    resalePrice?: string;
    scoutData?: any;
    description?: string;
    marketDescription?: string;
    imageId?: string; // Pre-uploaded image ID
    estLow?: string;
    estHigh?: string;
}

export async function saveItemToInventory(itemData: any, imageFile: File | null, extraData: ExtraItemData = {}, teamId?: string, ownerType: 'team' | 'user' = 'team') {
    if (!import.meta.env.PUBLIC_APPWRITE_DB_ID) {
        throw new Error("Missing PUBLIC_APPWRITE_DB_ID in .env");
    }

    console.log(`[Inventory] Save called. Bucket=${BUCKET_ID}, DB=${DB_ID}, Collection=${COLLECTION_ID}`);
    if (imageFile) console.log(`[Inventory] Has Image File: ${imageFile.name} (${imageFile.size})`);
    else console.log(`[Inventory] NO Image File passed.`);

    try {
        let imageId: string | null = extraData.imageId || null;

        // 1. Upload Image (FORCED ATTEMPT) - Only if not already provided
        if (!imageId && imageFile) {
            console.log(`[Inventory] FORCING Upload of: ${imageFile.name} (${imageFile.type}, ${imageFile.size} bytes)`);
            try {
                // Ensure ID.unique() is called fresh
                const upload = await storage.createFile(
                    BUCKET_ID || 'item_images', // Fallback
                    ID.unique(),
                    imageFile
                );
                imageId = upload.$id;
                console.log(`[Inventory] Image Upload Success: ${imageId}`);
            } catch (e: any) {
                console.error("Image upload failed (FORCED):", e);
                // Throw it so UI sees it
                throw new Error(`Image Upload Failed: ${e.message}`);
            }
        } else {
            console.warn(`[Inventory] Skipping Image Upload - imageFile is NULL`);
        }

        let receiptImageId: string | null = null;
        if (extraData.receiptFile && extraData.receiptFile.size > 0 && BUCKET_ID) {
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
        
        let safeNotes = itemData.condition_notes || '';
        
        // Append extra analytics/data to notes since DB columns might be missing
        const extraInfo: string[] = [];
        if (extraData.paidPrice) extraInfo.push(`Paid: $${extraData.paidPrice}`);
        if (extraData.resalePrice) extraInfo.push(`Resale: $${extraData.resalePrice}`);
        if (extraData.maxBuyPrice) extraInfo.push(`Max Buy: $${extraData.maxBuyPrice}`);
        if (extraData.purchaseLocation) extraInfo.push(`Location: ${extraData.purchaseLocation}`);
        if (extraData.binLocation) extraInfo.push(`Bin: ${extraData.binLocation}`);
        if (extraData.orderId) extraInfo.push(`Order #: ${extraData.orderId}`);
        if (imageId) extraInfo.push(`[MAIN IMAGE ID: ${imageId}]`);
        if (galleryIds.length > 0) extraInfo.push(`[GALLERY IDS: ${galleryIds.join(', ')}]`);
        if (galleryIds.length > 0) extraInfo.push(`[GALLERY IDS: ${galleryIds.join(', ')}]`);
        if (receiptImageId) extraInfo.push(`[RECEIPT ID: ${receiptImageId}]`);
        // Save Estimates
        if (extraData.estLow) extraInfo.push(`Est. Low: $${extraData.estLow}`);
        if (extraData.estHigh) extraInfo.push(`Est. High: $${extraData.estHigh}`);

        if (extraData.scoutData) {
            try {
                const jsonStr = JSON.stringify(extraData.scoutData);
                let fileId: string | null = null;
                
                // Strategy 1: Try .json
                try {
                    const file = new File([jsonStr], 'scout.json', { type: 'application/json' });
                    const upload = await storage.createFile(BUCKET_ID, ID.unique(), file);
                    fileId = upload.$id;
                } catch(err1: any) {
                    
                    // SELF-REPAIR & RETRY
                    if (err1.code === 400 || err1.message?.includes('extension')) {
                        console.warn("Bucket missing .json support (CREATE), attempting auto-fix...");
                        try {
                            await fetch('/api/dev/fix-bucket');
                            
                            // Retry JSON
                            const file = new File([jsonStr], 'scout.json', { type: 'application/json' });
                            const upload = await storage.createFile(BUCKET_ID, ID.unique(), file);
                            fileId = upload.$id;
                        } catch (retryErr) {
                             // Fallback to TXT
                             try {
                                const file = new File([jsonStr], 'scout.txt', { type: 'text/plain' });
                                const upload = await storage.createFile(BUCKET_ID, ID.unique(), file);
                                fileId = upload.$id;
                             } catch(e3) {
                                 throw retryErr; 
                             }
                        }
                    } else {
                        // Fallback to TXT
                        try {
                            const file = new File([jsonStr], 'scout.txt', { type: 'text/plain' });
                            const upload = await storage.createFile(BUCKET_ID, ID.unique(), file);
                            fileId = upload.$id;
                        } catch (e4) {
                            throw err1;
                        }
                    }
                }

                if (fileId) {
                    extraInfo.push(`[SCOUT_REPORT_ID: ${fileId}]`);
                } else {
                     throw new Error("File upload failed to return ID");
                }
            } catch (e) {
                console.warn("Failed to upload Scout Data file, using Lite Fallback", e);
                // Strategy 3: Lite Data (Base64)
                const lite = { 
                    ...extraData.scoutData, 
                    comparables: [], 
                    keywords: [],
                    red_flags: extraData.scoutData.red_flags || [],
                    price_breakdown: extraData.scoutData.price_breakdown
                };
                delete lite.description;
                delete lite.condition_notes;
                
                try {
                    const jsonLite = JSON.stringify(lite);
                    const b64 = typeof btoa === 'function' ? btoa(jsonLite) : Buffer.from(jsonLite).toString('base64');
                    extraInfo.push(`[SCOUT_DATA_LITE: ${b64}]`);
                } catch(e2) {
                    console.warn("Lite save failed", e2);
                }
            }
        }
        
        if (extraInfo.length > 0) {
            safeNotes += '\n\n--- IMPORT DETAILS ---\n' + extraInfo.join('\n');
        }

        // TRUNCATE NOTES to avoid 1000 char limit error
        // Reduced to 800 to account for multi-byte emojis causing byte-length overflow
        if (safeNotes.length > 800) {
            console.warn("Notes too long (" + safeNotes.length + "), truncating to 800.");
            safeNotes = safeNotes.substring(0, 800);
        }

        const doc: any = {
            title: itemData.title,
            identity: typeof itemData.identity === 'object' ? JSON.stringify(itemData.identity) : itemData.identity,
            conditionNotes: safeNotes,
            // createdAt: new Date().toISOString(), // REMOVED: Appwrite handles this automatically
            status: extraData.status || 'scouted',
            tenantId: teamId || null, // tenantId is required by your DB
            // teamId: teamId // REMOVED: Likely invalid attribute
        };


        let permissions: string[] = [];
        if (teamId) {
            const role = ownerType === 'team' ? Role.team(teamId) : Role.user(teamId);
            permissions = [
                Permission.read(role),
                Permission.update(role),
                Permission.delete(role),
            ];
        }

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
                Query.limit(100),
                ...(teamId ? [Query.equal('tenantId', teamId)] : [])
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
        // 1. Fetch the item to find associated images
        const item = await databases.getDocument(DB_ID, COLLECTION_ID, documentId);
        
        const imagesToDelete = new Set<string>();

        // A. Check Standard Fields
        if (item.imageId) imagesToDelete.add(item.imageId);
        if (item.receiptImageId) imagesToDelete.add(item.receiptImageId);
        if (item.galleryImageIds && Array.isArray(item.galleryImageIds)) {
            item.galleryImageIds.forEach((id: string) => imagesToDelete.add(id));
        }

        // B. Check Notes for "Safe Mode" IDs
        if (item.conditionNotes) {
            // Main Image
            const mainMatch = item.conditionNotes.match(/\[MAIN IMAGE ID: ([^\]]+)\]/i);
            if (mainMatch) imagesToDelete.add(mainMatch[1].trim());

            // Gallery
            const galleryMatch = item.conditionNotes.match(/\[GALLERY IDS: ([^\]]+)\]/i);
            if (galleryMatch) {
                galleryMatch[1].split(',').forEach((s: string) => {
                    const id = s.trim();
                    if (id) imagesToDelete.add(id);
                });
            }

            // Receipt
            const receiptMatch = item.conditionNotes.match(/\[RECEIPT ID: ([^\]]+)\]/i);
            if (receiptMatch) imagesToDelete.add(receiptMatch[1].trim());

            // Scout Report
            const scoutMatch = item.conditionNotes.match(/\[SCOUT_REPORT_ID: ([^\]]+)\]/i);
            if (scoutMatch) imagesToDelete.add(scoutMatch[1].trim());
        }

        // 2. Delete Identified Images
        if (imagesToDelete.size > 0 && BUCKET_ID) {
            console.log(`Deleting ${imagesToDelete.size} images for item ${documentId}...`);
            await Promise.allSettled(Array.from(imagesToDelete).map(id => 
                storage.deleteFile(BUCKET_ID, id).catch(e => console.warn(`Failed to delete image ${id}:`, e))
            ));
        }

        // 3. Delete Document
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
        // 1. Fetch current document to safely update notes
        const currentDoc = await databases.getDocument(DB_ID, COLLECTION_ID, documentId);
        let notes = currentDoc.conditionNotes || '';

        // Helper to update or append values in notes
        const updateNoteValue = (key: string, value: string) => {
            // Escape key for regex usage (e.g. "Est. Low" -> "Est\. Low")
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`${escapedKey}:\\s*(.+)`, 'i');
            
            if (regex.test(notes)) {
                notes = notes.replace(regex, `${key}: ${value}`);
            } else {
                notes = notes + `\n${key}: ${value}`;
            }
        };

        // Helper for bracket tags [TAG: Value]
        const updateTagValue = (tag: string, value: string) => {
            const regex = new RegExp(`\\[${tag}:\\s*([^\\]]+)\\]`, 'i');
            if (regex.test(notes)) {
                notes = notes.replace(regex, `[${tag}: ${value}]`);
            } else {
                notes = notes + `\n\n[${tag}: ${value}]`;
            }
        };

        const data: any = {};
        
        // Handle Status (This exists in schema)
        if (updates.status) data.status = updates.status;
        if (updates.title) data.title = updates.title;
        if (updates.description) data.marketDescription = updates.description;

        // --- Handle File Uploads & Update Notes ---

        // Receipt
        if (updates.receiptFile && BUCKET_ID) {
             const upload = await storage.createFile(BUCKET_ID, ID.unique(), updates.receiptFile);
             updateTagValue('RECEIPT ID', upload.$id);
        }

        // Main Image
        if (updates.imageFile && BUCKET_ID) {
             const upload = await storage.createFile(BUCKET_ID, ID.unique(), updates.imageFile);
             updateTagValue('MAIN IMAGE ID', upload.$id);
        }

        // Gallery
        // Determine existing IDs first
        let currentGalleryIds: string[] = [];
        // Try to parse from notes
        const galleryMatch = notes.match(/\[GALLERY IDS: ([^\]]+)\]/i);
        if (galleryMatch) {
            currentGalleryIds = galleryMatch[1].split(',').map((s: string) => s.trim()).filter((s: string) => s);
        } else if (updates.existingGalleryIds) {
             currentGalleryIds = updates.existingGalleryIds;
        }

        // Upload new gallery files
        if (updates.galleryFiles && updates.galleryFiles.length > 0 && BUCKET_ID) {
            const uploads = await Promise.all(updates.galleryFiles.map(file => 
                storage.createFile(BUCKET_ID, ID.unique(), file)
            ));
            const newIds = uploads.map(u => u.$id);
            currentGalleryIds = [...currentGalleryIds, ...newIds];
        }

        // Update Gallery Tag if changed
        if ((updates.galleryFiles?.length || 0) > 0 || updates.existingGalleryIds) {
             if (currentGalleryIds.length > 0) {
                updateTagValue('GALLERY IDS', currentGalleryIds.join(', '));
             }
        }

        // --- Handle Text Fields (Safe Mode updates to Notes) ---

        if (updates.paidPrice !== undefined && updates.paidPrice !== '') {
             updateNoteValue('Paid', `$${parseFloat(updates.paidPrice).toFixed(2)}`);
             data.purchasePrice = parseFloat(updates.paidPrice); 
        }
        if (updates.resalePrice !== undefined && updates.resalePrice !== '') {
             updateNoteValue('Resale', `$${parseFloat(updates.resalePrice).toFixed(2)}`);
             data.resalePrice = parseFloat(updates.resalePrice);
        }
        if (updates.purchaseLocation) updateNoteValue('Location', updates.purchaseLocation);
        if (updates.binLocation) updateNoteValue('Bin', updates.binLocation);
        if (updates.orderId) updateNoteValue('Order #', updates.orderId);
        
        if (updates.estLow !== undefined && updates.estLow !== '') {
            updateNoteValue('Est. Low', `$${parseFloat(updates.estLow).toFixed(2)}`);
            data.estLow = parseFloat(updates.estLow);
        }
        if (updates.estHigh !== undefined && updates.estHigh !== '') {
            updateNoteValue('Est. High', `$${parseFloat(updates.estHigh).toFixed(2)}`);
            data.estHigh = parseFloat(updates.estHigh);
        }
        
        // Save Scout Data (Base64 encoded JSON to avoid regex issues)
        if (updates.scoutData) {
            try {
                const jsonStr = JSON.stringify(updates.scoutData);
                let fileId: string | null = null;
                
                try {
                    // Strategy 1: Try .json
                    const file = new File([jsonStr], 'scout.json', { type: 'application/json' });
                    const upload = await storage.createFile(BUCKET_ID, ID.unique(), file);
                    fileId = upload.$id;
                } catch(err1: any) {
                    // SELF-REPAIR: If extension not allowed, try to call fix-bucket endpoint
                    if (err1.code === 400 || err1.message.includes('extension')) {
                        console.warn("Bucket missing .json support, attempting auto-fix...");
                        try {
                            await fetch('/api/dev/fix-bucket');
                            // Retry once
                            const file = new File([jsonStr], 'scout.json', { type: 'application/json' });
                            const upload = await storage.createFile(BUCKET_ID, ID.unique(), file);
                            fileId = upload.$id;
                        } catch(retryErr) {
                             console.warn("Auto-fix retry failed", retryErr);
                             // Fallback to Strategy 2
                             try {
                                const file = new File([jsonStr], 'scout.txt', { type: 'text/plain' });
                                const upload = await storage.createFile(BUCKET_ID, ID.unique(), file);
                                fileId = upload.$id;
                             } catch(e3) {
                                 // Check 'fileId' to see if we succeeded in inner blocks? No, just throw to outer catch for Lite
                                 throw retryErr; 
                             }
                        }
                    } else {
                        // Fallback to Strategy 2
                        try {
                           const file = new File([jsonStr], 'scout.txt', { type: 'text/plain' });
                           const upload = await storage.createFile(BUCKET_ID, ID.unique(), file);
                           fileId = upload.$id;
                        } catch(e4) {
                             throw err1;
                        }
                    }
                }

                if (fileId) {
                    updateTagValue('SCOUT_REPORT_ID', fileId);
                    // Clean up old tags
                    notes = notes.replace(/\[SCOUT_DATA: [^\]]+\]/g, '');
                    notes = notes.replace(/\[SCOUT_DATA_LITE: [^\]]+\]/g, '');
                } else {
                    throw new Error("File upload failed to return ID");
                }

            } catch (e) {
                console.warn("File upload failed (" + e.message + "), falling back to LITE data text storage");
                
                // Strategy 3: Lite Data - Minified to fit in Notes
                // Strip heavy arrays/text that is already in description
                const lite = { 
                    ...updates.scoutData, 
                    comparables: [], // In Desc
                    keywords: [],    // In Desc
                    red_flags: updates.scoutData.red_flags || [],
                    price_breakdown: updates.scoutData.price_breakdown
                };
                
                // Remove other heavy props if any?
                delete lite.description; // In Desc
                delete lite.condition_notes; // In Notes
                
                try {
                    const jsonLite = JSON.stringify(lite);
                    // Use a safe base64
                    const b64 = typeof btoa === 'function' ? btoa(jsonLite) : Buffer.from(jsonLite).toString('base64');
                    
                    updateTagValue('SCOUT_DATA_LITE', b64);
                    
                    // Clean up ID tag if we fell back
                    notes = notes.replace(/\[SCOUT_REPORT_ID: [^\]]+\]/g, '');
                } catch(e2) {
                    console.warn("Lite save failed", e2);
                }
            }
        }
        
        // Always update notes
        // CRITICAL: Ensure we don't exceed Appwrite's 1000 char limit for this string attribute (if not a text area)
        // Using strict 800 char limit
        if (notes.length > 800) {
            console.warn("Inventory Note too long (" + notes.length + " chars). Truncating to 800.");
            notes = notes.substring(0, 800);
        }
        data.conditionNotes = notes;

        console.log("DEBUG: Safe Mode Update keys:", Object.keys(data));
        
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
