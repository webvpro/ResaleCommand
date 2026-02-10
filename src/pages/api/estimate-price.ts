import type { APIRoute } from 'astro';
import { model } from '../../lib/gemini';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { title, description } = await request.json();

    if (!model) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503 });
    }

    const prompt = `
      You are an expert reseller. 
      Estimate the fair market resale value (listing price) for this item:
      Title: "${title}"
      ${description ? `Details: ${description}` : ''}
      
      Return ONLY a JSON object: { "min": number, "max": number, "fair": number, "reason": "short string" }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean markdown
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(jsonStr);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Price Estimate Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
