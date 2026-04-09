import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = `
          Analyze this item for resale.
          
          TASK:
          1. Detect if there are MULTIPLE distinct items in the image (e.g. a bundle, a lot, or several different products).
          2. If multiple items are found, create a SEPARATE item entry for EACH one in the 'items' array.
          3. Identify each item specifically.

          CRITICAL PRICING & IDENTIFICATION RULES:
          - ACTIVELY READ TEXT & COVERS: Extract the EXACT title directly from the item. If it is a book, game, or media, read the cover text precisely.
          - SPECIFY EDITIONS: For tabletop games, RPGs (like Dungeons & Dragons), and textbooks, you MUST use the cover art style and layout to identify the EXACT EDITION.
          - 3.5 PREMIUM REPRINTS: D&D 3.5e Premium Reprints feature embossed faux-leather tomes with a central crest (an eye, a lock, or a globe). You are STRICTLY FORBIDDEN from calling these "5e", "Alternate Art", or "Hydro74". If you see that artwork, it is unequivocally the "D&D 3.5 Premium Reprint". This is an absolute rule constraint.
          
          OUTPUT FORMAT:
          Return strictly a JSON object with property "items": [ ... ].
          
          Each item object in the array must contain:
          - 'title': A short SEO-friendly title string.
          - 'condition_notes': A thorough condition assessment.
          - 'price_breakdown': An object with estimated values:
              - 'mint': Price range if New/Mint.
              - 'fair': Price range if Used/Good.
              - 'poor': Price range if Poor/Damaged.
`;

async function test() {
    try {
        console.log("Testing with generic D&D MM 3.5 prompt...");
        const result = await model.generateContent([{ text: prompt }, { text: "Image analysis simulated: A book with a faux leather cover and a central red eye." }]);
        console.log(result.response.text());
    } catch(e) {
        console.error(e);
    }
}
test();
