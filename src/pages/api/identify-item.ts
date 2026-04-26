import type { APIRoute } from 'astro';
import { model, generateContentWithBackoff } from '../../lib/gemini';

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
                
                // NEW: Allow passing an array of remote URLs (e.g. from Appwrite)
                if (Array.isArray(json.remoteImageUrls)) {
                    const promises = json.remoteImageUrls.slice(0, 5 - imageParts.length).map((imgUrl: string) => fetchAndAddImage(imgUrl));
                    await Promise.all(promises);
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
                                  
                                  // ONLY fetch external images if the client didn't provide any
                                  if (imageParts.length === 0) {
                                      const imgUrls: string[] = [];
                                      const fixUrl = (u: string) => u ? (u.startsWith('//') ? 'https:' + u : u) : '';
                                      
                                      if (itemData.imageURL) imgUrls.push(fixUrl(itemData.imageURL));
                                      if (itemData.additionalImages) {
                                          itemData.additionalImages.forEach((img: any) => imgUrls.push(fixUrl(img.imageURL)));
                                      }
                                      
                                      if (imgUrls.length > 0) successfulImageUrl = imgUrls[0];
                                      
                                      const promises = [];
                                      for (let i = 0; i < Math.min(imgUrls.length, 3); i++) {
                                          promises.push(fetchAndAddImage(imgUrls[i]));
                                      }
                                      await Promise.all(promises);
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

                            // ONLY fetch external images if the client didn't provide any
                            if (imageParts.length === 0) {
                                const topImages = Array.from(imageUrls).slice(0, 3);
                                if (topImages.length > 0 && !successfulImageUrl) successfulImageUrl = topImages[0];
                                
                                const promises = topImages.map(imgUrl => fetchAndAddImage(imgUrl));
                                await Promise.all(promises);
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
          4. IF DETECTING A LOT (>1 item), YOU MUST OMIT 'comparables', 'red_flags', and 'purchase_strategy' from EVERY item object to save time. Keep output extremely brief!

          CRITICAL PRICING & IDENTIFICATION RULES:
          - ACTIVELY READ TEXT & COVERS: Extract the EXACT title directly from the item. If it is a book, game, or media, read the cover text precisely (e.g., "Monster Manual", "Spell Compendium"). Pay close attention to small sub-text like "v.3.5".
          - SPECIFY EDITIONS: For tabletop games, RPGs (like Dungeons & Dragons), and textbooks, you MUST use the cover art style and layout to identify the EXACT EDITION (e.g., 1st Edition, v3.5, 4th Edition, 5e) and put it in the title.
          - 3.5 PREMIUM REPRINTS: D&D 3.5e Premium Reprints feature embossed faux-leather tomes with a central crest (an eye, a lock, or a globe). You are STRICTLY FORBIDDEN from calling these "5e", "Alternate Art", or "Hydro74". If you see that artwork, it is unequivocally the "D&D 3.5 Premium Reprint". This is an absolute rule constraint.
          - ACTIVELY READ TAGS: Pay very close attention to any tags or labels. If you see a brand tag or "New With Tags" (NWT) label, you MUST use that exact brand for identification and reflect its true higher value.
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
          - 'condition_notes': A VERY BRIEF (1-2 sentences max) condition assessment.
          - 'red_flags': An array of strings highlighting potential issues. Return empty if none.
          - 'price_breakdown': An object with estimated values:
              - 'mint': Price range if New/Mint.
              - 'fair': Price range if Used/Good.
              - 'poor': Price range if Poor/Damaged.
              - 'boutique_premium': Price range if sold in a curated physical boutique or antique shop.
              - 'confidence': (Low/Medium/High)
          - 'comparables': (OMIT IF LOT) An array of EXACTLY 1 similar item sold on eBay/etc (BE BRIEF).
               - 'name': Specific item name/title.
               - 'price': approx sold price.
               - 'status': "Sold" or "Listed"
          - 'purchase_strategy': (OMIT IF LOT) An object containing strategic advice for sourcing this item:
               - 'verdict': ONE of these strict enums: "PASS", "WATCH", "BUY_NOW", "NEGOTIATE", "CHASE_AUCTION".
               - 'current_asking_price': State the current bid or asking price if found.
               - 'advice': ONE VERY BRIEF SENTENCE detailing the sourcing strategy.
        `;

        const contentParts: any[] = [{ text: prompt }];
        if (imageParts.length > 0) {
            contentParts.push(...imageParts);
        }

        const result = await generateContentWithBackoff({
            contents: [{ role: 'user', parts: contentParts }],
            generationConfig: { responseMimeType: "application/json" }
        }, 3, 2000); // Only retry 3 times for real-time frontend calls to prevent 2.5 minute UI hangs
        
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
        let errorMessage = error instanceof Error ? error.message : 'Unknown error';
        let statusCode = 500;
        
        if (error?.status === 429 || errorMessage.includes('429 Too Many Requests')) {
            errorMessage = "AI Rate Limit Reached (15 requests/min). Please wait 60 seconds and try again.";
            statusCode = 429;
        }
        
        return new Response(JSON.stringify({ error: 'Analysis failed', details: errorMessage, isRateLimit: statusCode === 429 }), { 
            status: statusCode,
            headers: { "Access-Control-Allow-Origin": "*" }
        });
    }
}
