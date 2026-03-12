const { execSync } = require('child_process');
try {
    const output = execSync('git log -p -1 src/components/inventory/InventoryManager.vue', { encoding: 'utf8' });
    const lines = output.split('\n');
    let found = false;
    for (const line of lines) {
        if (line.includes('const getImageUrl')) {
            found = true;
        }
        if (found) {
            console.log(line);
            if (line.startsWith('-}') || line.startsWith('+}')) {
                 break;
            }
        }
    }
} catch (e) {
    console.error(e.message);
}
