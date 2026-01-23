import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const candidates = [
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-1.0-pro",
  "gemini-pro",
  "gemini-pro-vision"
];

async function check() {
  console.log("Testing models...");
  for (const m of candidates) {
      try {
          const model = genAI.getGenerativeModel({ model: m });
          // Simple text prompt
          await model.generateContent("Hi");
          console.log(`✅ WORKS: ${m}`);
      } catch (e) {
          if (e.message.includes("404")) {
              console.log(`❌ 404:   ${m}`);
          } else {
              console.log(`⚠️ Error: ${m} -> ${e.message.split('\n')[0]}`);
          }
      }
  }
}

check();
