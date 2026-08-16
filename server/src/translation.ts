import { GoogleGenAI, Type } from '@google/genai';

const geminiModel = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

export type HindiTranslation = { hindi_title: string; hindi_content: string };
const ERROR_TEXT = /^(error|sorry|unable|i cannot|i can't|translation failed)\b/i;
const WORDS = /[\p{L}\p{N}]+/gu;

const instructions = `Convert the following English news article into natural, easy-to-read Hindi.

Do NOT summarize the article. Do NOT intentionally shorten the article. Preserve all meaningful information from the source, including names, companies, numbers, dates, percentages, financial figures, locations, technical details, important context, and important statements/quotes. Do not add facts, speculate, or introduce opinions. Write natural Hindi suitable for an Indian reader. Use commonly understood business and technology terminology; a technical/business term may remain in English when clearer.

Return a JSON object with exactly two keys: \`hindi_title\` and \`hindi_content\`, and nothing else.`;

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

export function buildTranslationRequest(title: string, content: string, model: string, systemPrompt: string) {
  return {
    model,
    contents: `Title:\n${title}\n\nArticle:\n${content}`,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hindi_title: { type: Type.STRING },
          hindi_content: { type: Type.STRING },
        },
        required: ['hindi_title', 'hindi_content'],
      },
    },
  };
}

export async function translateToHindi(title: string, content: string): Promise<HindiTranslation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is required');
  const client = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL ?? geminiModel;
  const request = buildTranslationRequest(title, content, model, instructions);
  const response = await client.models.generateContent(request);
  const outputText = response.text ?? '';
  return validateTranslation(outputText, content);
}
