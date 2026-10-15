import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') {
  throw new Error('Unexpected build output directory.');
}
await rm(output, { recursive: true, force: true });
await mkdir(output);
// Explicitly publish only website assets. Secrets, tests and server sources stay out.
const directories = ['assets', 'components', 'css', 'fonts', 'js', 'vendor'];
for (const name of directories) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && (entry.name.endsWith('.html') || ['_routes.json', '_headers', '_redirects'].includes(entry.name))) {
    await cp(path.join(root, entry.name), path.join(output, entry.name));
  }
}
console.log('Pages assets prepared in dist/. Functions are compiled separately by Wrangler/Pages.');
