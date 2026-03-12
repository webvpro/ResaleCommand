import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// This is a direct extraction script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const script = `
const fs = require('fs');
const cp = require('child_process');

try {
    // We are going to just read the file from the alpha-1 branch directly using git show
    const out = cp.execSync('git show origin/alpha-1:src/components/inventory/InventoryManager.vue', {encoding: 'utf8'});
    const lines = out.split('\\n');
    let output = '';
    let recording = false;
    for (const l of lines) {
        if (l.includes('const getImageUrl =')) {
            recording = true;
        }
        if (recording) {
            output += l + '\\n';
            if (l.trim() === '};' || (l.trim() === '}' && output.split('\\n').length > 5 && !l.includes('return'))) {
                 break;
            }
        }
    }
    fs.writeFileSync('c:/Users/15034/Projects/ResaleCommand/scripts/old_getImageUrl.txt', output);
} catch(e) {}
`;

writeFileSync(resolve(__dirname, 'run_extraction.js'), script);
