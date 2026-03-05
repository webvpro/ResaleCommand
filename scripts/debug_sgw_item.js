
import fetch from 'node-fetch';

const ITEM_ID = '251363265';
const API_URL = `https://buyerapi.shopgoodwill.com/api/ItemDetail/GetItemDetailByItemId/${ITEM_ID}`;
const PUBLIC_URL = `https://shopgoodwill.com/item/${ITEM_ID}`;

async function runDebug() {
    console.log(`🔍 Debugging Item: ${ITEM_ID}`);

    // 1. Test Official API
    console.log(`\n--- 1. Testing Official API ---`);
    try {
        const apiRes = await fetch(API_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Origin': 'https://shopgoodwill.com',
                'Referer': 'https://shopgoodwill.com/'
            }
        });
        console.log(`Status: ${apiRes.status} ${apiRes.statusText}`);
        if (apiRes.ok) {
            const data = await apiRes.json();
            console.log(`Data found?`, data ? (data.itemId || 'No ItemId in JSON') : 'Empty JSON');
            if (data && data.imageURL) console.log(`Main Image: ${data.imageURL}`);
        } else {
            console.log(`API Request Failed`);
        }
    } catch (e) {
        console.log(`API Error: ${e.message}`);
    }

    // 2. Test Public Page Scraping
    console.log(`\n--- 2. Testing Public Page Scraping ---`);
    try {
        const pageRes = await fetch(PUBLIC_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log(`Status: ${pageRes.status} ${pageRes.statusText}`);
        
        if (pageRes.ok) {
            const html = await pageRes.text();
            console.log(`HTML Length: ${html.length} chars`);

            // Check for app-image-gallery
            const galleryRegex = /<app-image-gallery[^>]*\[itemImages\]="([^"]*)"/i; 
            const galleryMatch = html.match(galleryRegex);
            
            if (galleryMatch) {
                console.log(`✅ Found <app-image-gallery> component!`);
                try {
                    const jsonStr = galleryMatch[1].replace(/&quot;/g, '"');
                    // console.log(`Raw JSON String: ${jsonStr.substring(0, 100)}...`); 
                    const parsed = JSON.parse(jsonStr);
                    console.log(`Parsed Images:`, parsed);
                } catch (e) {
                    console.log(`❌ Failed to parse JSON attribute: ${e.message}`);
                }
            } else {
                console.log(`❌ <app-image-gallery> NOT found in HTML.`);
            }

            // Check for Azure Images regex
            const imgRegex = /src="(https:\/\/sgwproductimages\.azureedge\.net\/[^\"]+)"/g;
            let m;
            let count = 0;
            while ((m = imgRegex.exec(html)) !== null) {
                count++;
                if (count <= 3) console.log(`Regex Match ${count}: ${m[1]}`);
            }
            console.log(`Total Regex Matches: ${count}`);
        }
    } catch (e) {
        console.log(`Scraping Error: ${e.message}`);
    }
}

runDebug();
