import type { APIRoute } from 'astro';
import { model } from '../../lib/gemini';

export const prerender = false;

// Handle both POST and PUT, plus OPTIONS for CORS
export const ALL: APIRoute = async ({ request }) => {
    
    // 1. Handle Preflight / CORS
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Client-Claim",
            }
        });
    }

    if (request.method !== "POST" && request.method !== "PUT") {
         return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    try {
        if (!model) {
            console.error("Gemini model not initialized.");
            return new Response(JSON.stringify({ error: 'Gemini not configured', details: 'Missing GEMINI_API_KEY' }), { 
                status: 500,
                headers: { "Access-Control-Allow-Origin": "*" } 
            });
        }

        // Debug logging
        const urlObj = new URL(request.url);
        const expectedLen = urlObj.searchParams.get("len");
        console.log(`Debug - URL Received: ${request.url}`);
        
        // 2. Read Body
        let rawBody = "";
        try {
            const ab = await request.arrayBuffer();
            if (ab.byteLength > 0) {
                rawBody = new TextDecoder().decode(ab);
            } else {
                // Fallback attempt
                rawBody = await request.text();
            }
        } catch (readError: any) {
            console.error("Debug - Failed to read request body:", readError);
            return new Response(JSON.stringify({ 
                error: "Read Failed", 
                details: `Server could not read request stream: ${readError.message}` 
            }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
        }

        console.log(`Debug - Body Length Read: ${rawBody ? rawBody.length : 0} | Expected: ${expectedLen}`);

        if (!rawBody || rawBody.length === 0) {
            return new Response(JSON.stringify({ 
                error: "Empty Body", 
                details: `Server received 0 bytes. (Expected: ${expectedLen}). URL: ${request.url}` 
            }), { 
                status: 400,
                headers: { "Access-Control-Allow-Origin": "*" } 
            });
        }
        
        let base64Image = "";
        let mimeType = "image/jpeg";

        if (rawBody.trim().startsWith("data:")) {
            // Option 1: Raw Data URL string (text/plain)
            const parts = rawBody.split(",");
            // "data:image/png;base64" -> "image/png"
            const match = parts[0].match(/:(.*?);/);
            if (match) mimeType = match[1];
            base64Image = parts[1];
        } else if (rawBody.trim().startsWith("{")) {
            // Option 2: JSON payload
            try {
                const json = JSON.parse(rawBody);
                // supports { image: "data:..." }
                const imageStr = json.image || "";
                if (imageStr.startsWith("data:")) {
                     const parts = imageStr.split(",");
                     const match = parts[0].match(/:(.*?);/);
                     if (match) mimeType = match[1];
                     base64Image = parts[1];
                } else {
                     base64Image = imageStr;
                }
            } catch (e) {
                console.error("JSON parse failed", e);
            }
        } 
        
        // Option 3: Fallback (maybe just raw base64?)
        if (!base64Image) {
             // Attempt to treat whole body as base64 if it looks like it
             if (rawBody.length > 100 && !rawBody.includes("{")) {
                 base64Image = rawBody;
             } else {
                 return new Response(JSON.stringify({ error: "Parsing Failed", details: "Could not detect image data in body." }), { 
                    status: 400,
                    headers: { "Access-Control-Allow-Origin": "*" }
                });
             }
        }

        const prompt = `
          Analyze this item for resale. 
          
          OUTPUT FORMAT:
          Return strictly JSON.
          - 'identity': A single string describing the item (e.g. "Nike Air Max 90").
          - 'title': A short SEO-friendly title string.
          - 'keywords': An array of strings.
          - 'condition_notes': A string describing the visible condition from the image.
          - 'price_breakdown': An object with estimated values for 3 conditions:
              - 'mint': Price range if New/Mint.
              - 'fair': Price range if Used/Good.
              - 'poor': Price range if Poor/Damaged.
        `;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          }
        ]);

        const taskResponse = result.response.text();
        // Clean up potential markdown code blocks ```json ... ```
        const cleanedResponse = taskResponse.replace(/```json|```/g, '').trim();

        return new Response(cleanedResponse, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "*"
            }
        });

    } catch (error: any) {
        console.error("Detailed Gemini Analysis Error:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: 'Analysis failed', details: errorMessage }), { 
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
}
