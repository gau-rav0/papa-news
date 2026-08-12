import { supabase } from './config.js';

const now = new Date().toISOString();
const { error } = await supabase.from('system_config').upsert(
  { key: 'system_start_time', system_start_time: now, poll_interval_seconds: 300 },
  { onConflict: 'key', ignoreDuplicates: true },
);
if (error) throw new Error(`Could not seed system_start_time: ${error.message}`);
console.log(`Seed completed: existing activation time was preserved; otherwise set to ${now}.`);


