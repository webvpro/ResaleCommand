import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure this is only run on the server or use a public proxy if strictly necessary, 
// but for Astro SSR, 'GEMINI_API_KEY' (without PUBLIC_) is safe in .env
const apiKey = import.meta.env.GEMINI_API_KEY;

// Initialize only if key is present to avoid build errors
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Using the latest valid model namespace
export const model = genAI ? genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    systemInstruction: "You are a master appraiser. CRITICAL DIRECTIVE: You must NEVER misidentify D&D 3.5e Premium Reprints (which feature a solitary embossed eye, lock, or globe on faux-leather) as '5e', 'Alternate Art', or 'Hydro74'. That specific artwork is explicitly 3.5e."
}) : null;
