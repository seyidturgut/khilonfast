import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const BASE_URL = 'https://khilonfast.com';
const OUTPUT_DIR = path.resolve('public/legacy-pages');
const PAGE_DIR = path.join(OUTPUT_DIR, 'pages');
const CONCURRENCY = 8;
const FETCH_TIMEOUT_MS = 20000;

function extractLocValues(xml) {
  const values = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    values.push(match[1].trim());
  }
  return values;
}

function normalizePath(url) {
  const parsed = new URL(url);
  let pathname = parsed.pathname;
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  return pathname || '/';
}

function urlToFile(pathname) {
  return `${createHash('sha1').update(pathname).digest('hex')}.html`;
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function runConcurrent(items, worker, limit = 8) {
  let cursor = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const current = items[cursor++];
      await worker(current);
    }
  });
  await Promise.all(runners);
}

async function main() {
  await mkdir(PAGE_DIR, { recursive: true });

  const sitemapIndexXml = await fetchText(`${BASE_URL}/wp-sitemap.xml`);
  const sitemapUrls = extractLocValues(sitemapIndexXml).filter((url) => url.endsWith('.xml'));

  const discoveredUrls = new Set();
  for (const sitemapUrl of sitemapUrls) {
    try {
      const sitemapXml = await fetchText(sitemapUrl);
      const entries = extractLocValues(sitemapXml);
      for (const entry of entries) {
        discoveredUrls.add(entry);
      }
    } catch (error) {
      console.warn(`Skipping sitemap: ${sitemapUrl}`, error.message);
    }
  }

  const filteredUrls = [...discoveredUrls]
    .filter((url) => url.startsWith(BASE_URL))
    .filter((url) => !url.includes('/wp-json'))
    .filter((url) => !url.includes('/wp-admin'))
    .filter((url) => !url.endsWith('.xml'))
    .sort((a, b) => a.localeCompare(b));

  const manifest = {
    generatedAt: new Date().toISOString(),
    base: BASE_URL,
    pages: [],
    failed: [],
  };
  let processed = 0;

  await runConcurrent(
    filteredUrls,
    async (url) => {
      const pathname = normalizePath(url);
      const file = urlToFile(pathname);

      try {
        const html = await fetchText(url);
        await writeFile(path.join(PAGE_DIR, file), html, 'utf8');
        manifest.pages.push({ path: pathname, source: url, file });
      } catch (error) {
        manifest.failed.push({ path: pathname, source: url, error: String(error.message || error) });
      } finally {
        processed += 1;
        if (processed % 20 === 0 || processed === filteredUrls.length) {
          console.log(`Progress: ${processed}/${filteredUrls.length}`);
        }
      }
    },
    CONCURRENCY
  );

  manifest.pages.sort((a, b) => a.path.localeCompare(b.path));
  manifest.failed.sort((a, b) => a.path.localeCompare(b.path));

  await writeFile(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await writeFile(path.join(OUTPUT_DIR, 'urls.txt'), filteredUrls.join('\n') + '\n', 'utf8');

  console.log(`Imported pages: ${manifest.pages.length}`);
  console.log(`Failed pages: ${manifest.failed.length}`);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
