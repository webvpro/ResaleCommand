
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

async function testModel() {
    // Model to test: gemini-2.0-flash-exp (which was requested)
    const modelName = "gemini-2.0-flash-exp";
    console.log(`🤖 Testing connection to model: ${modelName}...`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello! Are you working?");
        const response = await result.response;
        console.log("✅ Success! AI Response:", response.text());
    } catch (error) {
        console.error("❌ Model Connection Failed:");
        if (error.message.includes("404")) {
            console.error(`Status 404: The model '${modelName}' was not found for your API key.`);
            console.error("This usually means user doesn't have access to the 2.0 experimental tier yet, or the model name changed.");
        } else {
            console.error(error.message);
        }
    }
}

testModel();
