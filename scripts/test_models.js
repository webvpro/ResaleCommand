
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

const candidates = [
    "gemini-3.0-flash",
    "gemini-3.0-flash-001",
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemini-2.5-flash-001",
    "gemini-2.5-flash-latest",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
];

async function test() {
    console.log("🔍 Checking API Access & Listing Models...");
    try {
        // Method 1: Fetch list from API directly (most reliable)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (response.ok) {
            const data = await response.json();
            console.log("\n📋 API Reported Available Models:");
            const modelNames = data.models ? data.models.map(m => m.name.replace('models/', '')) : [];
            modelNames.forEach(name => console.log(`  - ${name}`));
            
            if (modelNames.length > 0) {
                console.log("\n✅ Recommendation: Use one of the names above in your config.");
                return;
            }
        } else {
            console.warn(`⚠️ Could not list models (Status ${response.status}). Trying manual probe...`);
        }
    } catch (e) {
        console.warn("⚠️ List models failed:", e.message);
    }

    console.log("\n🧪 Probing Specific Model Names (Manual Check)...");
    for (const modelName of candidates) {
        process.stdout.write(`Testing '${modelName}'... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Simple ping
            await model.countTokens("Test");
            console.log("✅ OK");
        } catch (e) {
            if (e.message.includes("404")) {
                console.log("❌ Not Found");
            } else {
                console.log(`❌ Error: ${e.message.split(']')[1] || e.message}`);
            }
        }
    }
}

test();
