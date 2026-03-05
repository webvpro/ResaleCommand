import Papa from 'papaparse';

// 1. The Mock Data from User
const csvContent = `"View","Order #","Item Id","Item","Quantity","Price","Date","Tracking #","Tax","Shipping","Handling"
"View Order","60088377","253302322","Assorted Figurines: Smurfs, Mario, and Others","1","$9.99","01/23/2026","398227947274","0","9.98","2"
"View Order","59568751","251131964","Sandman Master of Dreams Comic Book Lot - 3 Issues - Good Used Condition","1","$38.00","12/29/2025","397442814588","0","9.05","2"
"View Order","60181304","253788828","Hallmark Keepsake Ornaments (Lot of 11) Star Wars, Disney, Christmas, Etc.","1","$26.00","01/28/2026","398342394541","0","9.34","2"
"View Order","59686884","251841002","Silver Cloud Black Cashmere Blend Woven in Italy Trenchcoat - size (S/42)","1","$26.00","01/04/2026","397604917106","0","12.53","10"
"View Order","59686884","251867242","Sublime/AC/DC/Sheryl Crow Men's Large: Band/Music Tour T-Shirts (Lot of 3)","1","$19.00","01/04/2026","397604917106","0","12.53","10"
"View Order","59686884","251854857","Vintage 1967 U.S. Military Army Man's Overcoat Cotton Satten OG-107 Small Long","1","$9.99","01/04/2026","397604917106","0","12.53","10"
"View Order","59686884","251864293","Levi Strauss & Co Size Small Vintage Button-Up Denim Trucker Jacket","1","$21.00","01/04/2026","397604917106","0","12.53","10"
"View Order","59686884","251734985","Calvin Klein light blue wool-cashmere blend peacoat Women's size S","1","$9.99","01/04/2026","397604917106","0","12.53","10"
"View Order","60298743","254126769","+Signed SilverTone Goth MM Fashion JewelryLot+ArticulatedRing ElasticBangleSkull","1","$20.99","02/02/2026","9434636208303369436518","0","8","3"`;

// 2. SIMULATE THE VUE COMPONENT LOGIC
console.log("🛠️  Running Simulation of CsvImporter logic...\n");

Papa.parse(csvContent, {
    header: false,
    skipEmptyLines: true,
    complete: (results) => {
        const lines = results.data;
        if (lines.length < 2) {
            console.error("❌ CSV too short.");
            return;
        }

        const rawHeaders = lines[0].map(h => (h || '').toString());
        const headers = rawHeaders.map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase());

        console.log(`📋 Detected Headers: [${headers.join(', ')}]`);

        // Mappings
        const map = { title: -1, itemId: -1, orderId: -1, price: -1, shipping: -1, handling: -1 };

        // 1. GOLDEN PATH
        const colId = headers.findIndex(h => h === 'item id' || h === 'itemid');
        const colTitle = headers.findIndex(h => h === 'item');

        if (colId !== -1 && colTitle !== -1) {
            console.log("✅ Golden Path Detected!");
            map.itemId = colId;
            map.title = colTitle;
            map.orderId = headers.findIndex(h => h.includes('order'));
            map.price = headers.findIndex(h => h.includes('price'));
            map.shipping = headers.findIndex(h => h.includes('shipping'));
            map.handling = headers.findIndex(h => h.includes('handling'));
        } else {
            // 2. FUZZY MATCHING (Full Implementation)
            console.log("⚠️  Using Fuzzy Logic...");
            
            const firstDataRow = lines[1] || []; 

            const isNumeric = (val) => /^\d+$/.test(val.replace(/[^0-9]/g, ''));
            const isShopGoodwillId = (val) => /^\d{8,10}$/.test(val.replace(/[^0-9]/g, ''));

            const findCol = (keywords, antiKeywords = [], type = 'any') => {
                const isValidContent = (idx) => {
                    if (idx === -1 || !firstDataRow[idx]) return true; 
                    const val = firstDataRow[idx].toString().trim();
                    if (!val) return true;
                    
                    if (type === 'text') {
                        if (isNumeric(val) && val.length > 4) return false; 
                        if (isShopGoodwillId(val)) return false;
                        if (val.startsWith('$')) return false;
                    }
                    if (type === 'id') {
                        if (!/\d/.test(val)) return false; 
                        if (val.length > 3 && !/\d{3}/.test(val)) return false;
                    }
                    return true;
                };

                for (const keyword of keywords) {
                    const idx = headers.findIndex(h => h === keyword);
                    if (idx !== -1 && isValidContent(idx)) return idx;
                }
                
                for (const keyword of keywords) {
                    const idx = headers.findIndex(h => {
                         const containsKey = h.includes(keyword);
                         const containsAnti = antiKeywords.some(ak => h.includes(ak));
                         return containsKey && !containsAnti;
                    });
                    if (idx !== -1 && isValidContent(idx)) return idx;
                }
                return -1;
            };

             map.title = findCol(['description', 'title', 'item name', 'name', 'product name', 'product', 'item'], ['id', 'price', 'number', '#', 'count'], 'text');
             map.itemId = findCol(['item #', 'item id', 'order #', 'order number', 'order id', 'listing id', 'item'], ['price'], 'id');
             map.price = findCol(['price', 'amount', 'winning bid', 'sale price', 'cost', 'paid'], ['shipping', 'tax', 'total']);
             map.shipping = findCol(['shipping', 'ship cost', 'postage'], ['handling']);
             map.handling = findCol(['handling', 'processing', 'fee', 'tax'], ['shipping']); 
             map.orderId = findCol(['order #', 'order number', 'invoice', 'order'], ['item']);
             
             // Smart ID Scan
             if (map.itemId === -1) {
                 const idIdx = firstDataRow.findIndex(val => isShopGoodwillId(val));
                 if (idIdx !== -1) {
                     map.itemId = idIdx;
                     console.log(`[CSV] Smart Scan: Found 9-digit ID in column ${idIdx}`);
                 }
             }

             // Smart Title Fallback (Avg Length)
            if (map.title === -1) {
                console.log("[CSV] Title not found by keyword. Attempting smart length detection...");
                let longestColIdx = -1;
                let maxAvgLen = 0;
                
                const sampleRows = lines.slice(1, 11);
                const numCols = lines[0].length;
                
                for (let c = 0; c < numCols; c++) {
                    if (Object.values(map).includes(c) && c !== map.itemId) continue; 
                    
                    let totalLen = 0;
                    let count = 0;
                    sampleRows.forEach(row => {
                        if (row[c]) {
                            if (isNumeric(row[c].toString())) return;
                            totalLen += row[c].toString().length;
                            count++;
                        }
                    });
                    const avg = count > 0 ? totalLen / count : 0;
                    if (avg > maxAvgLen) {
                        maxAvgLen = avg;
                        longestColIdx = c;
                    }
                }
                
                if (longestColIdx !== -1 && maxAvgLen > 5) {
                    map.title = longestColIdx;
                    console.log(`[CSV] Smart Fallback: Map 'Title' to column index ${longestColIdx} (Avg Len: ${maxAvgLen})`);
                }
            }
        }

        console.log("🗺️  Final Map:", map);

        const items = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i];
            
            // Clean Data
            const priceStr = map.price !== -1 ? (cols[map.price] || '0') : '0';
            const shipStr = map.shipping !== -1 ? (cols[map.shipping] || '0') : '0';
            const handlingStr = map.handling !== -1 ? (cols[map.handling] || '0') : '0';
            const rawOrderId = map.orderId !== -1 ? (cols[map.orderId] || 'Unknown') : 'Unknown';
            const rawItemId = map.itemId !== -1 ? (cols[map.itemId] || 'Unknown') : 'Unknown';
            const rawTitle = map.title !== -1 ? (cols[map.title] || '') : '';

            const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
            const shippingBase = parseFloat(shipStr.replace(/[^0-9.]/g, '')) || 0;
            const handling = parseFloat(handlingStr.replace(/[^0-9.]/g, '')) || 0;
            const totalShipping = shippingBase + handling;

            // Debug first few rows
            if (i < 5) {
                console.log(`Row ${i}: Price=${price}, Ship=${shippingBase}, Hand=${handling} => TotalShip=${totalShipping}`);
            }

            items.push({
                orderId: rawOrderId.replace(/^"|"$/g, ''),
                itemId: rawItemId.replace(/^"|"$/g, ''),
                title: rawTitle.replace(/^"|"$/g, ''),
                price: price,
                shipping: totalShipping
            });
        }

        console.log(`✅ Parsed ${items.length} items.`);
        if (items.length > 0) {
            console.log("Sample Item:", items[0]);
        }
    }
});
