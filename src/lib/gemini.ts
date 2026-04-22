import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure this is only run on the server or use a public proxy if strictly necessary, 
// but for Astro SSR, 'GEMINI_API_KEY' (without PUBLIC_) is safe in .env
const apiKey = import.meta.env.GEMINI_API_KEY;

// Initialize only if key is present to avoid build errors
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Using the latest valid model namespace
export const model = genAI ? genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: "You are a master appraiser. CRITICAL DIRECTIVE: You must NEVER misidentify D&D 3.5e Premium Reprints (which feature a solitary embossed eye, lock, or globe on faux-leather) as '5e', 'Alternate Art', or 'Hydro74'. That specific artwork is explicitly 3.5e."
}) : null;

// Helper to provide robust exponential backoff for generateContent calls
// Useful for dealing with free-tier 429 rate limits or transient 503 errors (e.g. 27% errors)
export const generateContentWithBackoff = async (
    request: any, 
    maxRetries = 10, 
    baseDelayMs = 2500
) => {
    if (!model) throw new Error("Gemini model not initialized");
    
    let retries = maxRetries;
    let delayMs = baseDelayMs;
    
    while (retries > 0) {
        try {
            const result = await model.generateContent(request);
            return result;
        } catch (err: any) {
            const msg = (err.message || "").toLowerCase();
            const status = err.status || 0;
            
            // Catch 429, 503, 500, Resource Exhausted, and network fetch failures (which Vertex/Gemini sometimes throws under load)
            const isTransient = status === 429 || status === 503 || status === 500 || 
                                msg.includes('429') || msg.includes('503') || 
                                msg.includes('exhausted') || msg.includes('fetch failed') || msg.includes('overloaded');
                                
            if (isTransient && retries > 1) {
                // Calculate Jitter (0 to 1500ms) to prevent specific stampede collisions
                const jitter = Math.floor(Math.random() * 1500);
                const waitTime = delayMs + jitter;
                
                console.warn(`[Gemini] ${status || 'Transient'} Error. Retrying in ${(waitTime / 1000).toFixed(1)}s... (${retries - 1} left)`);
                await new Promise(res => setTimeout(res, waitTime));
                
                retries--;
                delayMs = Math.min(delayMs * 1.5, 30000); // 1.5x backoff, max 30s base wait
            } else {
                throw err;
            }
        }
    }
    throw new Error("Failed to receive a valid response from the AI model after retries.");
};
