import { writeFileSync } from 'fs';
async function test() {
    try {
        const res1 = await fetch('https://buyerapi.shopgoodwill.com/api/Search/ItemDetail', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ itemId: "260192132" })
        });
        const d1 = await res1.text();
        writeFileSync('sgw-test-1.txt', 'Status1: ' + res1.status + '\n' + d1);

        const res2 = await fetch('https://buyerapi.shopgoodwill.com/api/ItemDetail/GetItemDetail', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ itemId: 260192132 })
        });
        const d2 = await res2.text();
        writeFileSync('sgw-test-2.txt', 'Status2: ' + res2.status + '\n' + d2);
    } catch(e) { console.error(e) }
}
test();
