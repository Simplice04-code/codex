import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

// Serve only application assets, keeping Git metadata and other project files private.
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/js/app.js', ['js/app.js', 'text/javascript; charset=utf-8']],
  ['/js/traversal.js', ['js/traversal.js', 'text/javascript; charset=utf-8']],
]);

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }
  const asset = assets.get(new URL(request.url, 'http://localhost').pathname);
  if (!asset) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  try {
    const content = await readFile(new URL(asset[0], root));
    response.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    console.error(`Unable to read ${fileURLToPath(new URL(asset[0], root))}: ${error.code}`);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Unable to serve this file');
  }
});

server.listen(port, host, () => console.log(`GraphSearch Tutor is listening on port ${port}.`));
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
