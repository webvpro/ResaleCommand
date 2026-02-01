import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';

// Load .env from root
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No GEMINI_API_KEY found in .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-pro-vision" 
];

async function test() {
    console.log("Testing API Key with various models...");
    
    for (const modelName of modelsToTest) {
        process.stdout.write(`Testing ${modelName.padEnd(25)} ... `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Simple prompt
            const result = await model.generateContent("Hello?");
            const response = await result.response;
            console.log("✅ SUCCESS");
        } catch (e) {
            if (e.message.includes("404")) {
                console.log("❌ 404 (Not Found / Not Supported)");
            } else {
                console.log(`❌ ERROR: ${e.message.split('\n')[0]}`);
            }
        }
    }
}

test();
