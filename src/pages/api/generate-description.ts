export const prerender = false;

import { Client, Databases, Storage } from 'node-appwrite';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Buffer } from 'node:buffer';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { itemId } = body;
        
        console.log(`[API] generating description for item: ${itemId}`);

        if (!itemId) {
            return new Response(JSON.stringify({ error: 'Item ID is required' }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check Env
        const apiKey = import.meta.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[API] Missing GEMINI_API_KEY');
            return new Response(JSON.stringify({ error: 'Server configuration error: Missing Gemini API Key' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Initialize Appwrite (Server-side)
        const client = new Client();
        client
            .setEndpoint(import.meta.env.PUBLIC_APPWRITE_ENDPOINT)
            .setProject(import.meta.env.PUBLIC_APPWRITE_PROJECT_ID)
            .setKey(import.meta.env.APPWRITE_API_KEY);

        const databases = new Databases(client);
        const storage = new Storage(client);

        const DB_ID = import.meta.env.PUBLIC_APPWRITE_DB_ID;
        const COLLECTION_ID = import.meta.env.PUBLIC_APPWRITE_COLLECTION_ID;
        const BUCKET_ID = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID;

        // 1. Fetch Item Data
        console.log('[API] Fetching item document...');
        const item = await databases.getDocument(DB_ID, COLLECTION_ID, itemId);

        // 2. Collect Image Ids
        const imageIds: string[] = [];
        if (item.imageId) imageIds.push(item.imageId);
        if (item.galleryImageIds && Array.isArray(item.galleryImageIds)) {
            imageIds.push(...item.galleryImageIds);
        }

        if (imageIds.length === 0) {
            console.warn('[API] No images found for item');
            return new Response(JSON.stringify({ message: 'No images to analyze' }), { 
                status: 200,
                 headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Download Images & Prepare for Gemini
        console.log(`[API] Downloading ${imageIds.length} images...`);
        const imageParts = await Promise.all(imageIds.map(async (id) => {
            try {
                // getFileDownload returns an ArrayBuffer in node-appwrite (check version, usually ArrayBuffer or Buffer)
                const buffer = await storage.getFileDownload(BUCKET_ID, id);
                return {
                    inlineData: {
                        data: Buffer.from(buffer).toString('base64'),
                        mimeType: 'image/jpeg' // Assuming JPEG for now, or check file extension/mime
                    }
                };
            } catch (e) {
                console.error(`[API] Failed to download image ${id}:`, e);
                return null;
            }
        }));

        const validImageParts = imageParts.filter(p => p !== null);

        if (validImageParts.length === 0) {
            console.error('[API] All image downloads failed');
            return new Response(JSON.stringify({ error: 'Failed to download any images. Check Storage permissions.' }), { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 4. Call Gemini
        console.log('[API] Calling Gemini...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
        You are an expert eBay reseller. Write a compelling, SEO-friendly product description for this item based on the provided photos.
        
        Item Title: ${item.title}
        Brand/Keywords: ${item.keywords || 'N/A'}
        Details: ${item.conditionNotes || 'N/A'}
        
        The description should be in Markdown format and include:
        - A catchy headline.
        - Key features bullet points.
        - Condition assessment based on photos and notes (be honest but highlighting value).
        - Measurements if visible (estimate if possible or state "See photos for measurements").
        - "Why buy this?" section.
        
        Do not include placeholder text like "[Insert size here]". If you don't know, omit it or describe what you see.
        `;

        const result = await model.generateContent([prompt, ...validImageParts]);
        const response = await result.response;
        const text = response.text();
        console.log('[API] Gemini response received');

        // 5. Update Item
        console.log('[API] Updating item with description...');
        let saved = false;
        let saveError = null;
        try {
            await databases.updateDocument(DB_ID, COLLECTION_ID, itemId, {
                marketDescription: text
            });
            saved = true;
        } catch (dbErr) {
            console.error('[API] Failed to save description to DB:', dbErr);
            saveError = dbErr.message || 'Database update failed';
            // We do NOT throw here, we return the text anyway
        }

        return new Response(JSON.stringify({ 
            success: true, 
            description: text,
            saved: saved,
            warning: saveError ? `Generated but failed to save: ${saveError}` : null
        }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[API] Error generating description:', error);
        // Ensure we return JSON even on error
        return new Response(JSON.stringify({ 
            error: error.message || 'Unknown server error',
            stack: import.meta.env.DEV ? error.stack : undefined 
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
