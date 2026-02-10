
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    console.log("🔍 Checking available Gemini models...");
    try {
        // model-list is not directly exposed in the node SDK easily in all versions?
        // Actually it is via a request usually. 
        // Let's try to just use a known model and see if it works, or if there is a list method.
        // GoogleGenerativeAI instance doesn't have listModels directly usually, check docs or try/catch.
        
        // Use fetching directly if SDK doesn't support list easily
        // The API endpoint is GET https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.models) {
            console.log("\n✅ Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                     console.log(`- ${m.name.replace('models/', '')} (${m.version}) [Methods: ${m.supportedGenerationMethods.join(', ')}]`);
                }
            });
            console.log("\n(Recommended: gemini-1.5-flash or gemini-1.5-pro)");
        } else {
            console.log("⚠️ No models returned in list.");
        }

    } catch (error) {
        console.error("❌ Failed to list models:", error.message);
    }
}

listModels();
