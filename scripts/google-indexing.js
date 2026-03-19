/**
 * Google Indexing API Submission Script (Automated Version)
 *
 * PREREQUISITES:
 * 1. Create a Service Account in Google Cloud Console.
 * 2. Enable the Indexing API for your project.
 * 3. Store the Service Account JSON key as a GitHub Secret (GOOGLE_SERVICE_ACCOUNT).
 * 4. Give the Service Account 'Owner' permission in Google Search Console.
 * 5. Ensure environment variables are set: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * USAGE:
 * `node scripts/google-indexing.js`
 */

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'service-account.json');
const SITEMAP_URL = 'https://aiprintverse.com/sitemap.xml';

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

async function getUnindexedUrls(urls) {
  console.log('🔍 Filtering for unindexed /blog/ and /designs/ URLs...');

  // Filter for blog and designs URLs first
  const targetUrls = urls.filter(url => url.includes('/blog/') || url.includes('/designs/'));

  if (targetUrls.length === 0) return [];

  // Get all indexed slugs from blog_posts and designs
  const { data: blogPosts, error: blogError } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('indexing_status', 'indexed');

  const { data: designs, error: designError } = await supabase
    .from('designs')
    .select('id, name') // Assuming designs might use IDs or slugs in the URL
    .eq('indexing_status', 'indexed');

  if (blogError || designError) {
    console.error('❌ Error fetching indexing status from Supabase:', blogError || designError);
    // Conservative fallback: If we can't check the DB, don't submit anything to avoid quota issues
    return [];
  }

  const indexedBlogSlugs = new Set(blogPosts.map(p => p.slug));

  const unindexedUrls = targetUrls.filter(url => {
    const pathParts = url.split('/');
    const slug = pathParts[pathParts.length - 1];

    if (url.includes('/blog/')) {
      return !indexedBlogSlugs.has(slug);
    }

    if (url.includes('/designs/')) {
      // Check for exact ID match or semantic slug match
      const isIndexed = designs.some(d => {
        const designSlug = d.name ? d.name.toLowerCase().replace(/ /g, '-') : null;
        return slug === d.id || (designSlug && slug === designSlug);
      });
      return !isIndexed;
    }

    return false;
  });

  console.log(`🎯 Found ${unindexedUrls.length} unindexed high-priority URLs.`);
  return unindexedUrls;
}

async function updateIndexingStatus(url) {
  const pathParts = url.split('/');
  const slug = pathParts[pathParts.length - 1];

  if (url.includes('/blog/')) {
    await supabase
      .from('blog_posts')
      .update({ indexing_status: 'indexed' })
      .eq('slug', slug);
  } else if (url.includes('/designs/')) {
    // Attempt to update by ID if the slug looks like a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    if (isUUID) {
      await supabase
        .from('designs')
        .update({ indexing_status: 'indexed' })
        .eq('id', slug);
    } else {
      // If it's a semantic slug, we might need a slug column in designs too (which was added in a previous migration)
      await supabase
        .from('designs')
        .update({ indexing_status: 'indexed' })
        .eq('slug', slug);
    }
  }
}

async function main() {
  console.log('--- Google Indexing API Automated Submitter ---');

  // 1. Handle Authentication
  let auth;
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    console.log('🔐 Using GOOGLE_SERVICE_ACCOUNT environment variable for authentication.');
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });
  } else if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    console.log(`🔐 Using ${SERVICE_ACCOUNT_FILE} for authentication.`);
    auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_FILE,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });
  } else {
    console.error('❌ Error: Authentication credentials not found.');
    console.info('Provide GOOGLE_SERVICE_ACCOUNT env var or service-account.json file.');
    process.exit(1);
  }

  // 2. Load URLs from sitemap
  const allUrls = await fetchSitemapUrls();

  if (allUrls.length === 0) {
    console.error('❌ Error: No URLs found in sitemap.');
    process.exit(1);
  }

  console.log(`✅ Total URLs in sitemap: ${allUrls.length}`);

  // 3. Filter for unindexed blog posts and design pages
  const urls = await getUnindexedUrls(allUrls);

  if (urls.length === 0) {
    console.log('✨ All target URLs are already indexed. Nothing to do.');
    process.exit(0);
  }

  // 4. Authenticate Client
  const client = await auth.getClient();
  const indexing = google.indexing({
    version: 'v3',
    auth: client,
  });

  // 5. Submission Logic
  console.log(`🚀 Starting submission for ${urls.length} URLs...`);

  const CHUNK_SIZE = 100;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    console.log(`Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} URLs)...`);

    for (const url of chunk) {
      try {
        const res = await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: 'URL_UPDATED',
          },
        });
        console.log(`  ✅ ${url} (Status: ${res.status})`);
        if (res.status === 200) {
          successCount++;
          await updateIndexingStatus(url);
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`  ❌ ${url}: ${err.message}`);
        failCount++;
        // If we hit a quota error, stop processing
        if (err.message?.includes('Quota exceeded')) {
          console.error('🛑 Quota exceeded. Stopping further submissions for today.');
          printSummary(successCount, failCount);
          process.exit(0);
        }
      }
    }

    if (i + CHUNK_SIZE < urls.length) {
      console.log('Waiting before next chunk...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  printSummary(successCount, failCount);
}

function printSummary(successCount, failCount) {
  console.log('\n--- Submission Complete ---');
  console.log(`Summary: ${successCount} URLs successfully 'Published' (Status 200), ${failCount} failed.`);
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
