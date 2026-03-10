/**
 * Google Indexing API Submission Script (Batch Version)
 *
 * IMPORTANT: Google officially states that the Indexing API is only for pages
 * containing `JobPosting` or `BroadcastEvent` embedded in a `VideoObject`.
 * Using it for other types of pages (like blog posts) may not have any effect
 * and could potentially lead to quota issues or other restrictions.
 *
 * PREREQUISITES:
 * 1. Create a Service Account in Google Cloud Console.
 * 2. Enable the Indexing API for your project.
 * 3. Download the Service Account JSON key as `service-account.json` in the root.
 * 4. Give the Service Account 'Owner' permission in Google Search Console.
 * 5. Install dependencies: `bun add googleapis`
 *
 * USAGE:
 * `node scripts/google-indexing.js`
 */

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

// Configuration
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'service-account.json');
const SITEMAP_URL = 'https://aiprintverse.com/sitemap.xml';

async function fetchSitemapUrls() {
  console.log(`📡 Fetching sitemap from ${SITEMAP_URL}...`);
  try {
    const response = await fetch(SITEMAP_URL);
    const xml = await response.text();
    const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
    const urls = [];
    let match;
    while ((match = locRegex.exec(xml)) !== null) {
      urls.push(match[1]);
    }
    return [...new Set(urls)];
  } catch (err) {
    console.error('❌ Error fetching sitemap:', err.message);
    return [];
  }
}

async function main() {
  console.log('--- Google Indexing API Batch Submitter ---');

  // 1. Check for Service Account file
  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error(`❌ Error: ${SERVICE_ACCOUNT_FILE} not found.`);
    console.info('Please see script comments for setup instructions.');
    process.exit(1);
  }

  // 2. Load URLs from sitemap
  const urls = await fetchSitemapUrls();

  if (urls.length === 0) {
    console.error('❌ Error: No URLs found in sitemap.');
    process.exit(1);
  }

  console.log(`✅ Loaded ${urls.length} unique URLs from sitemap.`);

  // 3. Authenticate
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const client = await auth.getClient();
  const indexing = google.indexing({
    version: 'v3',
    auth: auth,
  });

  // 4. Batch Submission Logic
  console.log('🚀 Starting submission...');

  const CHUNK_SIZE = 100;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    console.log(`Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} URLs)...`);

    await Promise.all(chunk.map(async (url) => {
      try {
        const res = await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: 'URL_UPDATED',
          },
        });
        console.log(`  ✅ ${url} (${res.status})`);
        if (res.status === 200) successCount++;
        else failCount++;
      } catch (err) {
        console.error(`  ❌ ${url}: ${err.message}`);
        failCount++;
      }
    }));

    if (i + CHUNK_SIZE < urls.length) {
      console.log('Waiting before next chunk...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n--- Submission Complete ---');
  console.log(`Summary: ${successCount} URLs submitted successfully, ${failCount} failed.`);
  console.log('Warning: It may take some time for Google to crawl and index these pages.');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
