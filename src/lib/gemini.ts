import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure this is only run on the server or use a public proxy if strictly necessary, 
// but for Astro SSR, 'GEMINI_API_KEY' (without PUBLIC_) is safe in .env
const apiKey = import.meta.env.GEMINI_API_KEY;

// Initialize only if key is present to avoid build errors
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Using the detected available model for this API Key
export const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }) : null;
