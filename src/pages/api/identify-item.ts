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

        let imageParts: Array<{ inlineData: { data: string; mimeType: string } }> = [];
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
        
        // imageParts already declared at top of file

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
        // 3. Smart URL Handling (Deep Listing Analysis)
        if (userNotes) {
            const urlMatch = userNotes.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                const targetUrl = urlMatch[0];
                console.log(`Debug - Found URL for Deep Parse: ${targetUrl}`);
                
                // A. ShopGoodwill API Strategy (High Fidelity)
                const sgwMatch = targetUrl.match(/shopgoodwill\.com\/item\/(\d+)/i);
                if (sgwMatch) {
                    const itemId = sgwMatch[1];
                    try {
                         const apiRes = await fetch(`https://buyerapi.shopgoodwill.com/api/ItemDetail/GetItemDetailByItemId/${itemId}`, {
                             headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                         });
                         if (apiRes.ok) {
                             const itemData = await apiRes.json();
                             if (itemData) {
                                  let contextText = `[Deep Parse - ShopGoodwill]\n`;
                                  contextText += `Title: ${itemData.title || itemData.itemName}\n`;
                                  contextText += `Current Bid: $${itemData.currentPrice} | Bids: ${itemData.bidCount} | Ends: ${itemData.endTime}\n`;
                                  
                                  const rawDesc = itemData.description || "";
                                  const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').substring(0, 3000); // Strip HTML, keep 3000 chars
                                  contextText += `Description: ${cleanDesc}\n\n`;
                                  
                                  // Prepend to user notes
                                  userNotes = contextText + userNotes;
                                  
                                  // Fetch Multiple Images (Max 5 for Gemini context)
                                  const imgUrls: string[] = [];
                                  
                                  const fixUrl = (u: string) => u ? (u.startsWith('//') ? 'https:' + u : u) : '';
                                  
                                  if (itemData.imageURL) imgUrls.push(fixUrl(itemData.imageURL));
                                  if (itemData.additionalImages) {
                                      itemData.additionalImages.forEach((img: any) => imgUrls.push(fixUrl(img.imageURL)));
                                  }
                                  
                                  if (imgUrls.length > 0) successfulImageUrl = imgUrls[0];
                                  
                                  for (let i = 0; i < Math.min(imgUrls.length, 5); i++) {
                                      await fetchAndAddImage(imgUrls[i]);
                                  }
                             }
                         }
                    } catch (err) {
                        console.error("Failed Deep SGW Parse", err);
                    }
                } // <--- Added missing closing brace for if (sgwMatch)

                // B. Generic Full-Page Scrape (For eBay, FB Marketplace, etc)
                else {
                     try {
                        const pageRes = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
                        if(pageRes.ok) {
                            const html = await pageRes.text();
                            
                            // Extract Meta Context
                            const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                            const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) || 
                                              html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
                            
                            let contextText = `[Deep Parse - Generic URL]\n`;
                            if (titleMatch) contextText += `Title: ${titleMatch[1]}\n`;
                            if (descMatch) contextText += `Description: ${descMatch[1].substring(0, 1000)}\n`;
                            
                            // Extract Structured JSON-LD Data (Critical for Pricing/Bids on obscure platforms)
                            const ldRegex = /<script type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
                            let ldMatch;
                            let structuredData = '';
                            while ((ldMatch = ldRegex.exec(html)) !== null) {
                                structuredData += ldMatch[1] + '\n';
                            }
                            if (structuredData) {
                                // Keep the first 1500 characters of structured data to prevent prompt bloat while grabbing price metadata
                                contextText += `Structured Data: ${structuredData.substring(0, 1500)}\n`;
                            }
                            
                            userNotes = contextText + "\n" + userNotes;

                            // Extract Images (Max 5)
                            const imageUrls = new Set<string>();
                            
                            // 1. Get OpenGraph Image
                            const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
                            const fixUrl = (u: string) => u ? (u.startsWith('//') ? 'https:' + u : u) : '';
                            
                            if(ogMatch) imageUrls.add(fixUrl(ogMatch[1]));
                            
                            // 1.5. Extract SGW app-image-gallery (High Quality Gallery fallback for Angular)
                            const galleryRegex = /<app-image-gallery[^>]*\[itemImages\]=["']([^"']*)["']/i; 
                            const galleryMatch = html.match(galleryRegex);
                            if (galleryMatch) {
                                try {
                                    const jsonStr = galleryMatch[1].replace(/&quot;/g, '"');
                                    const parsed = JSON.parse(jsonStr);
                                    if (Array.isArray(parsed)) {
                                        parsed.forEach((img: any) => {
                                             const u = img.imageURL || img.url || img;
                                             if (u && typeof u === 'string') imageUrls.add(fixUrl(u));
                                        });
                                    }
                                } catch (e) {}
                            }

                            const imgRegex = /<img[^>]+src=["'](https:\/\/[^"'\s]+|\/\/[^"'\s]+)["'][^>]*>/gi;
                            let match;
                            let count = 0;
                            while ((match = imgRegex.exec(html)) !== null && count < 20) {
                                const src = fixUrl(match[1]);
                                if (src.match(/\.(jpg|jpeg|png|webp)(\?|&|$)/i) && !src.includes('logo') && !src.includes('icon')) {
                                     imageUrls.add(src);
                                }
                                count++;
                            }

                            // Fetch up to available slots
                            const availableSlots = 5 - imageParts.length;
                            const topImages = Array.from(imageUrls).slice(0, availableSlots);
                            if (topImages.length > 0 && !successfulImageUrl) successfulImageUrl = topImages[0];
                            for (const imgUrl of topImages) {
                                await fetchAndAddImage(imgUrl);
                            }
                        }
                     } catch(e) { console.warn("Deep Scrape failed", e); }
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

          CRITICAL PRICING & IDENTIFICATION RULES:
          - ACTIVELY READ TAGS: Pay very close attention to any tags, labels, or boxes in the images. If you see a brand tag or "New With Tags" (NWT) label, you MUST use that exact brand for identification and reflect its true higher value.
          - CURATED RETAIL PREMIUM: Remember that items sold in "Curated Physical Locations" (vintage boutiques, antique booths) often sell for 30-50% MORE than raw eBay prices due to curation and zero shipping friction. Reflect this in the 'boutique_premium' output.
          - BE CONSERVATIVE BUT ACCURATE: Do not randomly guess high-end designer names if there's no tag/logo, but DO trust clear branding when it is visible. 
          - For "Style" items (e.g. "Goth Style", "Victorian Style"), if no authentic brand/hallmark exists, price them as UNBRANDED/COSTUME ($10-$30 range). 
          - NWT (NEW WITH TAGS): If tags are attached, heavily weight the 'mint' price and specify "NWT" in condition_notes.
          - AVOID HALLUCINATIONS. If you are truly unsure and no tags exist, provide a low "Generic" estimate.
          
          OUTPUT FORMAT:
          Return strictly a JSON object with property "items": [ ... ].
          
          Each item object in the array must contain:
          - 'identity': A single string describing the item.
          - 'title': A short SEO-friendly title string.
          - 'keywords': An array of strings.
          - 'condition_notes': A thorough visual condition assessment based on scanning all provided images. Detail any visible wear, scuffs, damage, or verify if it looks 'Mint/NWT'. If no images are provided or visual assessment is impossible, explicitly state: "Could not assess condition from images."
          - 'red_flags': An array of strings highlighting potential issues. Return empty if none.
          - 'price_breakdown': An object with estimated values:
              - 'mint': Price range if New/Mint.
              - 'fair': Price range if Used/Good.
              - 'poor': Price range if Poor/Damaged.
              - 'boutique_premium': Price range if sold in a curated physical boutique or antique shop (usually higher than eBay 'fair').
              - 'confidence': (Low/Medium/High) - How sure are you about this ID?
          - 'comparables': An array of 3-5 similar items sold on eBay/etc.
               - 'name': Specific item name/title.
               - 'price': approx sold price.
               - 'status': "Sold" or "Listed" or "scouted" or "acquired" or "at_location"
          - 'purchase_strategy': An object containing strategic advice for sourcing this item:
               - 'verdict': ONE of these strict enums: "PASS", "WATCH", "BUY_NOW", "NEGOTIATE", "CHASE_AUCTION". (Choose PASS if unprofitable/risky, BUY_NOW if heavily underpriced, CHASE_AUCTION if worth bidding up to the fair value, etc. You can return other words if those don't fit perfectly).
               - 'current_asking_price': State the current bid or asking price extracted from context, if any (e.g. "$45.00" or "No Asking Price Found").
               - 'advice': A brief paragraph detailing the sourcing strategy (e.g., maximum bid amount, negotiation tactics for FB Marketplace, shipping cost considerations, or why it's a hard pass). IF YOU DETECT THIS IS AN AUCTION (e.g. context mentions "Current Bid" or "Ends:"), explicitly prioritize formulating a MAX BID STRATEGY and remind the user to evaluate SHIPPING COSTS before bidding!
        `;

        const contentParts: any[] = [prompt];
        if (imageParts.length > 0) {
            contentParts.push(...imageParts);
        }

        const result = await model.generateContent(contentParts);
        const response = await result.response;
        const taskResponse = response.text();
        
        // Clean up potential markdown code blocks \`\`\`json ... \`\`\`
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
