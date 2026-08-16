import { GoogleGenAI, Type } from '@google/genai';
import { geminiModel } from './config.js';
import { log } from './log.js';

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

export function categorizeError(error: unknown): string {
  if (!error) return 'UNKNOWN_ERROR';
  const message = error instanceof Error ? error.message : String(error);
  const status = (error as any)?.status ?? (error as any)?.statusCode ?? (error as any)?.error?.code;

  if ((error as any)?.name === 'TimeoutError' || /timeout|timed out|ETIMEDOUT|ESOCKETTIMEDOUT/i.test(message)) {
    return 'TIMEOUT';
  }
  if (status === 429 || /429|rate[- ]?limit|resource[- ]?exhausted|quota/i.test(message)) {
    return 'RATE_LIMIT';
  }
  if (status === 401 || status === 403 || /401|403|API_KEY|permission_denied/i.test(message)) {
    return 'AUTH_ERROR';
  }
  if (status === 404 || /404|not_found|no longer available/i.test(message)) {
    return 'NOT_FOUND';
  }
  if (status === 400 || /400|invalid_argument|failed_precondition/i.test(message)) {
    return 'INVALID_ARGUMENT';
  }
  if ((typeof status === 'number' && status >= 500 && status < 600) || /500|502|503|504|internal server|unavailable|overloaded/i.test(message)) {
    return 'SERVER_ERROR';
  }
  if (/network|fetch failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|socket hang up/i.test(message)) {
    return 'NETWORK_ERROR';
  }
  if (/AI returned invalid JSON|AI response is missing|AI response contains|Possible summarization/i.test(message)) {
    return 'VALIDATION_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  const category = categorizeError(error);
  switch (category) {
    case 'TIMEOUT':
    case 'RATE_LIMIT':
    case 'SERVER_ERROR':
    case 'NETWORK_ERROR':
    case 'VALIDATION_ERROR':
      return true;
    case 'AUTH_ERROR':
    case 'NOT_FOUND':
    case 'INVALID_ARGUMENT':
    default:
      return false;
  }
}

export async function translateToHindi(
  title: string,
  content: string,
  clientOverride?: { models: { generateContent: (req: any) => Promise<any> } },
  timeoutMs: number = 60_000
): Promise<HindiTranslation> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && !clientOverride) throw new Error('GEMINI_API_KEY is required');
  const client = clientOverride ?? new GoogleGenAI({ apiKey: apiKey! });
  const model = process.env.GEMINI_MODEL ?? geminiModel;
  const request = buildTranslationRequest(title, content, model, instructions);
  const startTime = Date.now();

  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Gemini translation timed out after ${timeoutMs}ms`);
      err.name = 'TimeoutError';
      reject(err);
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      client.models.generateContent(request),
      timeoutPromise,
    ]);
    const outputText = response.text ?? '';
    return validateTranslation(outputText, content);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorCategory = categorizeError(error);
    log('gemini.translation_failed', {
      model,
      duration_ms: durationMs,
      error_category: errorCategory,
    });
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
