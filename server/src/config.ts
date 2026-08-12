import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

export const supabase = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function positiveInteger(name: string, fallback: number, max: number): number {
  const value = Number.parseInt(process.env[name] ?? String(fallback), 10);
  if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`${name} must be an integer from 1 to ${max}`);
  return value;
}

export const fetchLimit = positiveInteger('FETCH_LIMIT', 20, 100);
export const translationBatchSize = positiveInteger('TRANSLATION_BATCH_SIZE', 5, 100);
export const openAiModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';


