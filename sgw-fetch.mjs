import { writeFileSync } from 'fs';
fetch('https://shopgoodwill.com/item/260192132', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => r.text())
  .then(html => writeFileSync('sgw-html.html', html))
  .catch(console.error);
