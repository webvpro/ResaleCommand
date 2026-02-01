import { Client, Databases, Storage } from 'node-appwrite';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Buffer } from 'node:buffer';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  try {
    const body = await request.json();
    const { itemId } = body;
    console.log(`[API] generating description for item: ${itemId}`);
    if (!itemId) {
      return new Response(JSON.stringify({ error: "Item ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const apiKey = "AIzaSyCseyNFcCEE8WRhZFnDUlFeI2v7l7gB8ns";
    if (!apiKey) ;
    const client = new Client();
    client.setEndpoint("https://sfo.cloud.appwrite.io/v1").setProject("69714b35003a8adab6bb").setKey(undefined                                );
    const databases = new Databases(client);
    const storage = new Storage(client);
    const DB_ID = "resale_db";
    const COLLECTION_ID = "items";
    const BUCKET_ID = "item_images";
    console.log("[API] Fetching item document...");
    const item = await databases.getDocument(DB_ID, COLLECTION_ID, itemId);
    const imageIds = [];
    if (item.imageId) imageIds.push(item.imageId);
    if (item.galleryImageIds && Array.isArray(item.galleryImageIds)) {
      imageIds.push(...item.galleryImageIds);
    }
    if (imageIds.length === 0) {
      console.warn("[API] No images found for item");
      return new Response(JSON.stringify({ message: "No images to analyze" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log(`[API] Downloading ${imageIds.length} images...`);
    const imageParts = await Promise.all(imageIds.map(async (id) => {
      try {
        const buffer = await storage.getFileDownload(BUCKET_ID, id);
        return {
          inlineData: {
            data: Buffer.from(buffer).toString("base64"),
            mimeType: "image/jpeg"
            // Assuming JPEG for now, or check file extension/mime
          }
        };
      } catch (e) {
        console.error(`[API] Failed to download image ${id}:`, e);
        return null;
      }
    }));
    const validImageParts = imageParts.filter((p) => p !== null);
    if (validImageParts.length === 0) {
      console.error("[API] All image downloads failed");
      return new Response(JSON.stringify({ error: "Failed to download any images. Check Storage permissions." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("[API] Calling Gemini...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
        You are an expert eBay reseller. Write a compelling, SEO-friendly product description for this item based on the provided photos.
        
        Item Title: ${item.title}
        Brand/Keywords: ${item.keywords || "N/A"}
        Details: ${item.conditionNotes || "N/A"}
        
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
    console.log("[API] Gemini response received");
    console.log("[API] Updating item with description...");
    let saved = false;
    let saveError = null;
    try {
      await databases.updateDocument(DB_ID, COLLECTION_ID, itemId, {
        marketDescription: text
      });
      saved = true;
    } catch (dbErr) {
      console.error("[API] Failed to save description to DB:", dbErr);
      saveError = dbErr.message || "Database update failed";
    }
    return new Response(JSON.stringify({
      success: true,
      description: text,
      saved,
      warning: saveError ? `Generated but failed to save: ${saveError}` : null
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("[API] Error generating description:", error);
    return new Response(JSON.stringify({
      error: error.message || "Unknown server error",
      stack: void 0
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    POST,
    prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
