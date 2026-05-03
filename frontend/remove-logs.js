import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function removeConsoleLogs(dir) {
  const files = fs.readdirSync(dir);
  let filesModified = 0;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      filesModified += removeConsoleLogs(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      // Removes console.log(...), console.warn(...) but keeps console.error
      const newContent = content.replace(/console\.(log|warn)\(.*?\);?/g, '');
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        filesModified++;
        console.log(`Cleaned up: ${fullPath}`);
      }
    }
  }
  return filesModified;
}

const srcDir = path.join(__dirname, 'src');
console.log(`Searching for console logs in ${srcDir}...`);
const modified = removeConsoleLogs(srcDir);
console.log(`Finished cleanup. Modified ${modified} file(s).`);
