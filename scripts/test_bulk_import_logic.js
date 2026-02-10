
// Mock of the logic inside src/components/inventory/BulkImport.vue

const headers = ["View","Order #","Item Id","Item","Quantity","Price","Date","Tracking #","Tax","Shipping","Handling"];
console.log("Testing Headers:", headers);

// The exact function we added to BulkImport.vue
const findCol = (keys, keywords) => {
    // 1. Try EXACT match first (case-insensitive)
    for (const kw of keywords) {
        const exact = keys.find(k => k.toLowerCase().trim() === kw.toLowerCase());
        if (exact) return exact;
    }
    // 2. Partial match
    return keys.find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
};

console.log("\n--- Testing Title Detection ---");
const titleKeywords = ['title', 'item name', 'name', 'description', 'item'];
const detectedTitle = findCol(headers, titleKeywords);

console.log(`Searching for keywords: ${JSON.stringify(titleKeywords)}`);
console.log(`Detected Column: "${detectedTitle}"`);

if (detectedTitle === 'Item') {
    console.log("✅ SUCCESS: Correctly identified 'Item' as the Title column.");
} else if (detectedTitle === 'Item Id') {
    console.log("❌ FAILED: Confused 'Item' with 'Item Id'.");
} else {
    console.log(`❌ FAILED: Detected '${detectedTitle}' instead of 'Item'.`);
}

console.log("\n--- Testing Item ID Detection ---");
// BulkImport logic for ID (heuristic)
// let itemId = row['Item ID'] || row['ID'] || row['Item #'] || row['ItemId'] || row['Item Id'] || row['Item#'];
// It relies on direct access first.
const directAccessCheck = headers.includes('Item Id');
console.log(`Direct 'Item Id' check: ${directAccessCheck ? '✅ Found' : '❌ Not Found'}`);
