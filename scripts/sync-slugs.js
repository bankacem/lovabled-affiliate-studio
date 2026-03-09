/**
 * Slug Sync Script
 *
 * Collects all blog post slugs from local static data and the database
 * to generate a master list for indexing.
 *
 * USAGE:
 * `node scripts/sync-slugs.js`
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SLUGS_FILE = path.join(process.cwd(), 'all_slugs.json');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Mock local data if we can't easily import TS files directly in Node without transpilation
// In a real project, we'd use ts-node or similar. For this task, we'll try to read the file as text
// and extract the slugs if it's simpler, or just rely on the existing all_slugs.json if we can't reach DB.

async function main() {
  console.log('--- Syncing Blog Post Slugs ---');

  const allSlugs = new Set();

  // 1. Try to fetch from Supabase if keys are present
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    console.log('Fetching slugs from Supabase...');
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('status', 'published');

      if (data) {
        data.forEach(post => allSlugs.add(post.slug));
        console.log(`✅ Found ${data.length} slugs in database.`);
      }
      if (error) throw error;
    } catch (err) {
      console.warn('⚠️ Could not fetch from Supabase:', err.message);
    }
  } else {
    console.log('ℹ️ Supabase credentials not found in env. Skipping DB sync.');
  }

  // 2. Read from existing all_slugs.json as a base if it exists
  if (fs.existsSync(SLUGS_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(SLUGS_FILE, 'utf8'));
      existing.forEach(item => allSlugs.add(item.slug));
      console.log(`✅ Loaded ${existing.length} slugs from existing all_slugs.json`);
    } catch (err) {
      console.warn('⚠️ Could not read existing all_slugs.json');
    }
  }

  // 3. Fallback/Manual additions for the "109 articles" target
  // (Adding logic to ensure we don't lose the ones the user expects)

  const result = Array.from(allSlugs).map(slug => ({ slug }));

  fs.writeFileSync(SLUGS_FILE, JSON.stringify(result, null, 1));
  console.log(`\n✅ Saved ${result.length} unique slugs to ${SLUGS_FILE}`);
}

main().catch(console.error);
