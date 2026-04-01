const { execSync } = require('child_process');

try {
    console.log("Checking out main...");
    console.log(execSync('git checkout main').toString());
    
    console.log("Merging scout-item-data-updates...");
    console.log(execSync('git merge scout-item-data-updates').toString());
    
    console.log("Git merge completed successfully.");
} catch (e) {
    console.error("Git operation failed:");
    if (e.stdout) console.error(e.stdout.toString());
    if (e.stderr) console.error(e.stderr.toString());
}
