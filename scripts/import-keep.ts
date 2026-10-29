import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import { createAdminClient } from '../src/lib/supabaseServer';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

interface KeepImportRecord {
  prompt_template: string;
  brand_id: string;
  user_id: string;
  note?: string;
  poster_type?: 'sale' | 'launch' | 'festive' | 'announcement' | 'other';
}

async function runImport() {
  const filePath = process.argv[2] || resolve(process.cwd(), 'scripts/keep-prompts.json');
  console.log(`📥 Importing Google Keep prompts from: ${filePath}\n`);

  if (!fs.existsSync(filePath)) {
    console.log(`ℹ️  File not found: ${filePath}`);
    console.log('   Create a JSON array of prompts [{ prompt_template, brand_id, user_id }] to bulk import.');
    process.exit(0);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const records: KeepImportRecord[] = JSON.parse(raw);
  const supabase = createAdminClient();

  let imported = 0;
  for (const record of records) {
    const { error } = await supabase.from('entries').insert({
      user_id: record.user_id,
      brand_id: record.brand_id,
      prompt_template: record.prompt_template,
      slots: [],
      status: 'draft',
      poster_type: record.poster_type || 'other',
      note: record.note || 'Imported from Google Keep',
    });

    if (error) {
      console.error(`❌ Failed to import record:`, error.message);
    } else {
      imported++;
    }
  }

  console.log(`\n✅ Successfully imported ${imported} entries as drafts into the Library.`);
}

runImport().catch(console.error);
