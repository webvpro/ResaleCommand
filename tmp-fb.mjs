import { readFileSync} from 'fs';
const fetchHtml = async () => {
    const res = await fetch('https://www.facebook.com/share/1P3zwphJ5G/', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }});
    const html = await res.text();
    const matches = html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*>/gi);
    console.log(matches.filter(m => m.includes('price') || m.includes('amount') || m.includes('currency') || m.includes('$')));
}
fetchHtml().catch(console.error);
