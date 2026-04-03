import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
    const output = execSync('git log -p -1 src/components/inventory/InventoryManager.vue', { encoding: 'utf8', cwd: resolve(__dirname, '../') });
    writeFileSync(resolve(__dirname, 'git_output.txt'), output);
    console.log("Success");
} catch(e) {
    writeFileSync(resolve(__dirname, 'git_output.txt'), e.message);
}
