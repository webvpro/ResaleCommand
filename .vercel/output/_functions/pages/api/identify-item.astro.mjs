import { GoogleGenerativeAI } from '@google/generative-ai';
export { renderers } from '../../renderers.mjs';

const apiKey = "AIzaSyCseyNFcCEE8WRhZFnDUlFeI2v7l7gB8ns";
const genAI = new GoogleGenerativeAI(apiKey) ;
console.log("DEBUG: Initializing Gemini Model: gemini-1.5-flash");
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

const prerender = false;
const ALL = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Client-Claim"
      }
    });
  }
  if (request.method !== "POST" && request.method !== "PUT") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  try {
    if (!model) {
      console.error("Gemini model not initialized.");
      return new Response(JSON.stringify({ error: "Gemini not configured", details: "Missing GEMINI_API_KEY" }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }
    const urlObj = new URL(request.url);
    const expectedLen = urlObj.searchParams.get("len");
    console.log(`Debug - URL Received: ${request.url}`);
    let rawBody = "";
    let userNotes = "";
    try {
      const ab = await request.arrayBuffer();
      if (ab.byteLength > 0) {
        rawBody = new TextDecoder().decode(ab);
      } else {
        rawBody = await request.text();
      }
    } catch (readError) {
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
    let imageParts = [];
    if (rawBody.trim().startsWith("data:")) {
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
      try {
        const json = JSON.parse(rawBody);
        if (json.notes) {
          userNotes = json.notes;
        }
        const processDataUrl = (url) => {
          if (url.startsWith("data:")) {
            const parts = url.split(",");
            const match = parts[0].match(/:(.*?);/);
            return {
              inlineData: {
                data: parts[1],
                mimeType: match ? match[1] : "image/jpeg"
              }
            };
          }
          return null;
        };
        if (Array.isArray(json.images)) {
          json.images.forEach((img) => {
            const part = processDataUrl(img);
            if (part) imageParts.push(part);
          });
        } else if (json.image) {
          const part = processDataUrl(json.image);
          if (part) imageParts.push(part);
        }
      } catch (e) {
        console.error("JSON parse failed", e);
      }
    }
    if (imageParts.length === 0 && rawBody.length > 100 && !rawBody.includes("{")) {
      imageParts.push({
        inlineData: {
          data: rawBody,
          mimeType: "image/jpeg"
        }
      });
    }
    if (imageParts.length === 0) {
      return new Response(JSON.stringify({ error: "Parsing Failed", details: "Could not detect image data in body." }), {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" }
      });
    }
    const prompt = `
          Analyze these items (or multiple views of the same item) for resale. 
          
          USER NOTES (from seller): "${userNotes}"
          
          TASK:
          Identify the item(s) in the image. 
          - If it is a SINGLE item (or multiple angles of one item), return an array with ONE result.
          - If it is a GROUP/LOT of distinct items (e.g. a row of books, several video games, a pile of clothes), return an array with a result for EACH distinct item you can identify.
          
          OUTPUT FORMAT:
          Return strictly a JSON object with property "items": [ ... ].
          
          Each item object in the array must contain:
          - 'identity': A single string describing the item (e.g. "Nike Air Max 90" or "Harry Potter Book 1").
          - 'title': A short SEO-friendly title string.
          - 'keywords': An array of strings.
          - 'condition_notes': A string describing the visible condition.
          - 'red_flags': An array of strings highlighting potential issues (e.g. "Stained", "Torn", "Missing Button", "Discolored"). Return empty if none.
          - 'price_breakdown': An object with estimated values:
              - 'mint': Price range if New/Mint.
              - 'fair': Price range if Used/Good.
              - 'poor': Price range if Poor/Damaged.
          - 'comparables': An array of 3-5 similar items sold on eBay/etc.
               - 'name': Specific item name/title.
               - 'price': approx sold price.
               - 'status': "Sold" or "Listed".
        `;
    console.log("Debug - generatedContent calling model gemini-1.5-flash...");
    const result = await model.generateContent([
      prompt,
      ...imageParts
    ]);
    const taskResponse = result.response.text();
    const cleanedResponse = taskResponse.replace(/```json|```/g, "").trim();
    return new Response(cleanedResponse, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Detailed Gemini Analysis Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: "Analysis failed", details: errorMessage }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    ALL,
    prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
