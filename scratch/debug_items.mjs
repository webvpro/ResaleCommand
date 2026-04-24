import { Client, Databases } from 'node-appwrite';
import fs from 'fs';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69714b35003a8adab6bb')
    .setKey('standard_aadad46d3fb730d12b78cedc0da5d58710005211afa3e24ea769182808a04dde63e27d9303be34bcecabc4520e1c6758ac9fdd43f6c42bb3b524137c758105df39f50e58ae25638bd51008b146f25c16854a888822384ecbfd02527ecae7424f59a22aee0aaf90a5d1dac6cbaa6bb58864edc0910f507acf3fbb9846d42976a7');

const databases = new Databases(client);

async function run() {
    console.log("Fetching items...");
    let response = await databases.listDocuments('resale_db', 'items_dev');
    let items = response.documents;
    
    let report = [];
    
    for (const item of items) {
        report.push({
            title: item.title || item.itemName,
            status: item.status,
            cost: item.cost,
            purchasePrice: item.purchasePrice,
            estValue: item.estValue,
            listPrice: item.listPrice,
            soldPrice: item.soldPrice,
            price: item.price,
            conditionNotes: item.conditionNotes
        });
    }
    
    fs.writeFileSync('debug_items.json', JSON.stringify(report, null, 2));
    console.log("Done! Wrote " + items.length + " items to debug_items.json");
}

run();
