import OpenAI from 'openai';

const openAiModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

export type HindiTranslation = { hindi_title: string; hindi_content: string };
const ERROR_TEXT = /^(error|sorry|unable|i cannot|i can't|translation failed)\b/i;
const WORDS = /[\p{L}\p{N}]+/gu;

const schema = {
  type: 'object', additionalProperties: false,
  required: ['hindi_title', 'hindi_content'],
  properties: { hindi_title: { type: 'string' }, hindi_content: { type: 'string' } },
} as const;

const instructions = `Convert the following English news article into natural, easy-to-read Hindi.

Do NOT summarize the article. Do NOT intentionally shorten the article. Preserve all meaningful information from the source, including names, companies, numbers, dates, percentages, financial figures, locations, technical details, important context, and important statements/quotes. Do not add facts, speculate, or introduce opinions. Write natural Hindi suitable for an Indian reader. Use commonly understood business and technology terminology; a technical/business term may remain in English when clearer.

Return only the requested JSON fields.`;

export function wordCount(text: string): number { return text.match(WORDS)?.length ?? 0; }

export function validateTranslation(raw: string, englishContent: string): HindiTranslation {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('AI returned invalid JSON'); }
  if (!parsed || typeof parsed !== 'object') throw new Error('AI response JSON is not an object');
  const value = parsed as Partial<HindiTranslation>;
  if (typeof value.hindi_title !== 'string' || typeof value.hindi_content !== 'string') throw new Error('AI response is missing required Hindi fields');
  const translation = { hindi_title: value.hindi_title.trim(), hindi_content: value.hindi_content.trim() };
  if (!translation.hindi_title || !translation.hindi_content) throw new Error('AI response contains empty Hindi fields');
  if (ERROR_TEXT.test(translation.hindi_title) || ERROR_TEXT.test(translation.hindi_content)) throw new Error('AI response contains obvious error text');
  const englishWords = wordCount(englishContent);
  const hindiWords = wordCount(translation.hindi_content);
  if (englishWords > 0 && hindiWords / englishWords < 0.6) {
    throw new Error(`Possible summarization: Hindi word count ${hindiWords} is below 60% of English word count ${englishWords}`);
  }
  return translation;
}

export async function translateToHindi(title: string, content: string): Promise<HindiTranslation> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: openAiModel,
    input: [{ role: 'system', content: instructions }, { role: 'user', content: `Title:\n${title}\n\nArticle:\n${content}` }],
    text: { format: { type: 'json_schema', name: 'hindi_article_translation', strict: true, schema } },
  });
  return validateTranslation(response.output_text, content);
}

