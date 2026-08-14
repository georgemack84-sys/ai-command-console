import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve } from 'node:path';

const [directory, portText] = process.argv.slice(2);
const root = resolve(directory ?? 'storybook-static');
const port = Number(portText ?? 6006);
const types = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

const server = createServer((request, response) => {
  const requested = decodeURIComponent(request.url?.split('?')[0] ?? '/');
  const target = resolve(
    root,
    `.${requested === '/' ? '/index.html' : requested}`,
  );
  if (!target.startsWith(root) || !existsSync(target)) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader(
    'Content-Type',
    types[extname(target)] ?? 'application/octet-stream',
  );
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1');

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    server.close(() => process.exit(0));
  });
}
