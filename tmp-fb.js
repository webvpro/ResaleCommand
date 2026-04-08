const url = 'https://www.facebook.com/share/1P3zwphJ5G/';
fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } })
  .then(res => res.text())
  .then(html => {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) || 
                      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    console.log("Title:", titleMatch ? titleMatch[1] : "None");
    console.log("Desc:", descMatch ? descMatch[1] : "None");
  });
