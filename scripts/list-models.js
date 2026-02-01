import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

// Helper for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("CRITICAL: No GEMINI_API_KEY found in .env");
    process.exit(1);
}

async function listModels() {
    console.log("Your API Key starts with:", apiKey.substring(0, 5) + "...");
    console.log("Fetching available models from Google API...");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`\nAPI Error ${response.status}:`);
            console.error(await response.text());
            return;
        }
        
        const data = await response.json();
        
        if (!data.models) {
            console.log("No models returned. API Key might be invalid or has no access.");
            return;
        }

        console.log("\n✅ AVAILABLE MODELS (Supported for generateContent):");
        const generateModels = data.models.filter(m => 
            m.supportedGenerationMethods && 
            m.supportedGenerationMethods.includes("generateContent")
        );

        generateModels.forEach(m => {
            console.log(`- ${m.name.replace('models/', '')}`);
        });

        console.log("\nTry using one of the above names in src/lib/gemini.ts");

    } catch (e) {
        console.error("Script execution error:", e);
    }
}

listModels();
