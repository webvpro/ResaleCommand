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
        console.log(`Debug - Using Model: gemini-2.5-flash`); // Confirm model update


        let successfulImageUrl: string | null = null;
        
        // Helper 3b: Fetch Image from URL and add to parts
        const fetchAndAddImage = async (imgUrl: string) => {
             if(!imgUrl) return;
             try {
                console.log(`Debug - Fetching Image: ${imgUrl}`);
                // Use a proxy-like fetch with User-Agent
                const res = await fetch(imgUrl, {
                     headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                     }
                });
                
                if(res.ok) {
                    const arrayBuffer = await res.arrayBuffer();
                    
                    // Robust helper to converting ArrayBuffer to Base64 in any env
                    const toBase64 = (buffer: ArrayBuffer) => {
                        let binary = '';
                        const bytes = new Uint8Array(buffer);
                        const len = bytes.byteLength;
                        for (let i = 0; i < len; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        if (typeof btoa === 'function') {
                            return btoa(binary);
                        }
                        if (typeof globalThis.Buffer !== 'undefined') {
                            // @ts-ignore
                            return globalThis.Buffer.from(buffer).toString('base64');
                        }
                        return '';
                    };

                    const base64 = toBase64(arrayBuffer);
                    
                    if (base64) {
                        // Detect mime
                        let mime = res.headers.get('content-type');
                        
                        // Forcefully validate mime before pushing
                        if (!mime || mime === 'application/octet-stream' || !mime.startsWith('image/')) {
                             // Attempt to infer or default
                             console.log("Debug - Forcing octet-stream to image/jpeg");
                             mime = 'image/jpeg';
                        }
                        
                        // Double check
                        if (!mime.startsWith('image/')) {
                             console.warn(`Debug - Invalid Mime for Gemini: ${mime}, skipping.`);
                             return; // Skip adding this part
                        }
                        
                        imageParts.push({
                            inlineData: {
                                data: base64,
                                mimeType: mime
                            }
                        });
                        successfulImageUrl = imgUrl; // Track success
                        console.log(`Debug - Successfully added image part. Mime: ${mime}, Length: ${base64.length}`);
                    }
                } else {
                    console.warn(`Debug - Image fetch status: ${res.status}`);
                }
             } catch(e) {
                 console.warn(`Failed to fetch external image: ${imgUrl}`, e);
             }
        };

        // 2. Read Body
        let rawBody = "";
        let userNotes = "";

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
        
        let imageParts: Array<{ inlineData: { data: string; mimeType: string } }> = [];

        if (rawBody.trim().startsWith("data:")) {
            // Option 1: Raw Data URL string (text/plain) - Single Image
            const parts = rawBody.split(",");
            const match = parts[0].match(/:(.*?);/);
            const mime = match ? match[1] : "image/jpeg";
            imageParts.push({
                inlineData: {
                    data: parts[1],
                    mimeType: mime
                }
            });
        } else if (rawBody.trim().startsWith("{")) {
            // Option 2: JSON payload
            try {
                const json = JSON.parse(rawBody);
                
                // Extract User Notes if present
                if (json.notes) {
                    userNotes = json.notes;
                }
                
                // Helper to process a single data-url string
                const processDataUrl = (url: string) => {
                     if (url.startsWith("data:")) {
                         const parts = url.split(",");
                         const match = parts[0].match(/:(.*?);/);
                         let mime = match ? match[1] : "image/jpeg";
                         
                         // Robust Mime Validation (prevent 500s)
                         if (!mime || mime === 'application/octet-stream' || !mime.startsWith('image/')) {
                             mime = 'image/jpeg';
                         }
                         
                         return {
                             inlineData: {
                                 data: parts[1],
                                 mimeType: mime
                             }
                         };
                     }
                     return null;
                };



                // Check for 'images' array
                if (Array.isArray(json.images)) {
                    json.images.forEach((img: string) => {
                        const part = processDataUrl(img);
                        if (part) imageParts.push(part);
                    });
                } 
                // Fallback check for single 'image'
                else if (json.image) {
                     const part = processDataUrl(json.image);
                     if (part) imageParts.push(part);
                }
                
                // NEW: Allow passing direct 'imageUrl'
                if (json.imageUrl && imageParts.length === 0) {
                    await fetchAndAddImage(json.imageUrl);
                }

            } catch (e) {
                console.error("JSON parse failed", e);
            }
        } 




        // 3. Smart URL Handling (The "Scout Link" Feature)
        if (imageParts.length === 0 && userNotes) {
            const urlMatch = userNotes.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                const targetUrl = urlMatch[0];
                console.log(`Debug - Found URL in notes: ${targetUrl}`);
                
                // A. ShopGoodwill API Strategy
                const sgwMatch = targetUrl.match(/shopgoodwill\.com\/item\/(\d+)/i);
                if (sgwMatch) {
                    const itemId = sgwMatch[1];
                    try {
                         const apiRes = await fetch(`https://buyerapi.shopgoodwill.com/api/ItemDetail/GetItemDetailByItemId/${itemId}`);
                         if (apiRes.ok) {
                             const itemData = await apiRes.json();
                             if (itemData) {
                                  // Found it!
                                  const fetchedTitle = itemData.title || itemData.itemName;
                                  const fetchedDesc = itemData.description || "";
                                  
                                  // Enhance Context
                                  userNotes = `[SYSTEM FETCHED DATA]\nTitle: ${fetchedTitle}\nDescription Snippet: ${fetchedDesc.substring(0, 500)}...\n\n${userNotes}`;
                                  
                                  // Fetch Images (Try Main, then Additional)
                                  if (itemData.imageURL) {
                                      await fetchAndAddImage(itemData.imageURL);
                                  } else if (itemData.additionalImages && itemData.additionalImages.length > 0) {
                                      await fetchAndAddImage(itemData.additionalImages[0].imageURL);
                                  }
                             }
                         }
                    } catch (err) {
                        console.error("Failed to fetch ShopGoodwill API details:", err);
                    }
                }

                // B. Generic Fallback (OpenGraph) if still no image
                if (imageParts.length === 0) {
                     try {
                        const pageRes = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                        if(pageRes.ok) {
                            const html = await pageRes.text();
                            const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
                            if(ogMatch && ogMatch[1]) {
                                 await fetchAndAddImage(ogMatch[1]);
                            }
                        }
                     } catch(e) { console.warn("Fallback scrape failed", e); }
                }
            }
        }

        // Relaxed Check: Allow if images exist OR if we have notes (now potentially enhanced)
        if (imageParts.length === 0 && !userNotes) {
                 return new Response(JSON.stringify({ error: "Parsing Failed", details: "No image data AND no notes found in body." }), { 
                    status: 400,
                    headers: { "Access-Control-Allow-Origin": "*" }
                });
        }

        const prompt = `
          Analyze this item for resale.
          
          CONTEXT / USER NOTES: "${userNotes}"
          (If a URL is provided in notes, visit it or infer details from it if possible, otherwise rely on general knowledge of such items).
          
          TASK:
          1. Detect if there are MULTIPLE distinct items in the image (e.g. a bundle, a lot, or several different products).
          2. If multiple items are found, create a SEPARATE item entry for EACH one in the 'items' array.
          3. Identify each item specifically.

          CRITICAL PRICING RULES:
          - BE CONSERVATIVE. Do not assume high-end designer brands (e.g. Gucci, Vivienne Westwood) unless the LOGO is clearly visible or explicitly mentioned in notes.
          - For "Style" items (e.g. "Goth Style", "Victorian Style"), price them as UNBRANDED/COSTUME jewelry ($10-$30 range usually), NOT as authentic antiques or designer pieces unless proven otherwise.
          - If the item is a "Lot" of small items, estimate the value of the ENTIRE LOT as a single entry if they are small/similar, OR itemize them but keep individual values realistic (e.g. $2-$5 per costume ring).
          - AVOID HALLUCINATIONS. If you are unsure, provide a low "Generic" estimate.
          
          OUTPUT FORMAT:
          Return strictly a JSON object with property "items": [ ... ].
          
          Each item object in the array must contain:
          - 'identity': A single string describing the item (e.g. "Nike Air Max 90" or "Harry Potter Book 1").
          - 'title': A short SEO-friendly title string.
          - 'keywords': An array of strings.
          - 'condition_notes': A string describing the visible condition (or noted condition).
          - 'red_flags': An array of strings highlighting potential issues. Return empty if none.
          - 'price_breakdown': An object with estimated values:
              - 'mint': Price range if New/Mint.
              - 'fair': Price range if Used/Good.
              - 'poor': Price range if Poor/Damaged.
              - 'confidence': (Low/Medium/High) - How sure are you about this ID?
          - 'comparables': An array of 3-5 similar items sold on eBay/etc.
               - 'name': Specific item name/title.
               - 'price': approx sold price.
               - 'status': "Sold" or "Listed".
        `;

        const contentParts: any[] = [prompt];
        if (imageParts.length > 0) {
            contentParts.push(...imageParts);
        }

        const result = await model.generateContent(contentParts);
        const response = await result.response;
        const taskResponse = response.text();
        
        // Clean up potential markdown code blocks ```json ... ```
        let cleanedResponse = taskResponse.replace(/```json|```/g, '').trim();

        // Inject fetched image URL into response if available
        if (successfulImageUrl) {
            try {
                const jsonObj = JSON.parse(cleanedResponse);
                if (jsonObj.items && jsonObj.items.length > 0) {
                    jsonObj.items[0].fetched_image = successfulImageUrl;
                }
                cleanedResponse = JSON.stringify(jsonObj);
            } catch (e) {
                console.warn("Could not parse Gemini response to inject image URL", e);
            }
        }

        return new Response(cleanedResponse, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                "Access-Control-Allow-Origin": "*"
            }
        });

    } catch (error: any) {
        console.error("Detailed Gemini Analysis Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: 'Analysis failed', details: errorMessage }), { 
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
}
