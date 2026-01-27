import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("No GEMINI_API_KEY found in environment");
    process.exit(1);
}

async function listModels() {
    console.log("Checking available models...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.error("Failed to list models:", data);
        }
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}

listModels();
