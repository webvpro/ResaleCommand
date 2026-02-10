
import type { APIRoute } from 'astro';
import { Client, Storage, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
// import { InputFile } from 'node-appwrite/file'; // Try this import if needed, but InputFile from main package might work on server runtime in some setups?
// Actually, let's use buffer upload which is robust.

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { imageUrl, filename } = body;

        if (!imageUrl) {
            return new Response(JSON.stringify({ error: 'Missing imageUrl' }), { status: 400 });
        }

        console.log(`[UploadRemote] Processing: ${imageUrl}`);

        // 1. Download the Image (Server-Side)
        const imgRes = await fetch(imageUrl, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0'
            }
        });

        if (!imgRes.ok) {
            throw new Error(`Failed to fetch remote image: ${imgRes.status} ${imgRes.statusText}`);
        }

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
        
        if (buffer.length === 0) {
             throw new Error("Remote image is empty (0 bytes)");
        }

        // Determine content-type
        const contentType = imgRes.headers.get('content-type') || 'application/octet-stream';
        console.log(`[UploadRemote] Downloaded ${buffer.length} bytes (${contentType})`);

        // 2. Upload to Appwrite (Server-Side)
        const client = new Client();
        const endpoint = import.meta.env.PUBLIC_APPWRITE_ENDPOINT;
        const project = import.meta.env.PUBLIC_APPWRITE_PROJECT_ID;
        const key = import.meta.env.APPWRITE_API_KEY;
        const bucketId = import.meta.env.PUBLIC_APPWRITE_BUCKET_ID || 'item_images';

        if (!key) throw new Error("Missing Server API Key");

        client.setEndpoint(endpoint).setProject(project).setKey(key);
        const storage = new Storage(client);

        // Robust Filename Logic
        let finalName = filename;
        const mimeToExt: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'application/json': 'json',
            'text/plain': 'txt'
        };

        let ext = mimeToExt[contentType];

        // Fallback or Clean up
        if (!ext) {
             const parts = contentType.split('/');
             if (parts.length > 1) {
                 ext = parts[1].split(';')[0]; // Handle 'plain; charset=utf-8'
             }
        }
        
        // Handle generic/unknown types
        if (!ext || ext === 'octet-stream' || ext === 'unknown') {
             ext = 'jpg'; // Default to jpg if unknown
        }

        if (!finalName) {
             finalName = `upload-${Date.now()}.${ext}`;
        } else if (!finalName.includes('.')) {
             // Append extension if missing (Appwrite requires this validation)
             finalName = `${finalName}.${ext}`;
        }
        
        console.log(`[UploadRemote] Final Filename: ${finalName} (Type: ${contentType})`);
        
        // Use InputFile from buffer
        const filePayload = InputFile.fromBuffer(buffer, finalName);
        
        const file = await storage.createFile(
            bucketId,
            ID.unique(),
            filePayload
        );

        console.log(`[UploadRemote] Success! File ID: ${file.$id}`);

        let finalMime = contentType;
        if (!finalMime || finalMime === 'application/octet-stream' || !finalMime.startsWith('image/')) {
             finalMime = 'image/jpeg';
        }
        
        // Return Base64 for AI processing
        const base64 = `data:${finalMime};base64,${buffer.toString('base64')}`;

        return new Response(JSON.stringify({
            success: true,
            fileId: file.$id,
            mimeType: file.mimeType,
            base64: base64
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[UploadRemote] Error:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), { status: 500 });
    }
};
