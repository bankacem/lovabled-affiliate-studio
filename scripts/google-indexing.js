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
 * 3. Download the Service Account JSON key as `service_account.json` in the root.
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
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'service_account.json');
const SLUGS_FILE = path.join(process.cwd(), 'all_slugs.json');
const BASE_URL = 'https://aiprintverse.com/blog';

async function main() {
  console.log('--- Google Indexing API Batch Submitter ---');

  // 1. Check for Service Account file
  if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.error('❌ Error: service_account.json not found.');
    console.info('Please see script comments for setup instructions.');
    process.exit(1);
  }

  // 2. Load slugs
  if (!fs.existsSync(SLUGS_FILE)) {
    console.error('❌ Error: all_slugs.json not found. Run sync-slugs.js first.');
    process.exit(1);
  }

  const slugsData = JSON.parse(fs.readFileSync(SLUGS_FILE, 'utf8'));
  const urls = [...new Set(slugsData.map(item => `${BASE_URL}/${item.slug}`))];

  console.log(`✅ Loaded ${urls.length} unique URLs.`);

  // 3. Authenticate
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const client = await auth.getClient();
  const indexing = google.indexing({
    version: 'v1',
    auth: auth,
  });

  // 4. Batch Submission Logic
  // The Indexing API supports a batch endpoint at:
  // https://indexing.googleapis.com/batch

  console.log('🚀 Starting batch submission...');

  // Note: While google-api-nodejs-client has some support for batching,
  // the Indexing API's multipart batching is often easier to handle via direct requests
  // if the library's batching is not explicitly exposed for this specific API.
  // Here we use a chunked approach to stay within standard API quotas (default 200/day).

  const CHUNK_SIZE = 100;
  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    console.log(`Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} URLs)...`);

    // We iterate the chunk. If you have higher quotas and need true multipart batching,
    // you would typically use a library like `axios` with a multipart body.
    // For 109 URLs, individual calls within the client is robust.

    await Promise.all(chunk.map(async (url) => {
      try {
        const res = await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: 'URL_UPDATED',
          },
        });
        console.log(`  ✅ ${url} (${res.status})`);
      } catch (err) {
        console.error(`  ❌ ${url}: ${err.message}`);
      }
    }));

    if (i + CHUNK_SIZE < urls.length) {
      console.log('Waiting before next chunk...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n--- Submission Complete ---');
  console.log('Warning: It may take some time for Google to crawl and index these pages.');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
