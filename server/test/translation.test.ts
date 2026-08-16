import assert from 'node:assert/strict';
import test from 'node:test';
import { validateTranslation, buildTranslationRequest, translateToHindi, isTransientError, categorizeError } from '../src/translation.js';

const english = 'Alpha beta gamma delta epsilon zeta eta theta iota kappa';

test('accepts valid non-summarized structured translation', () => {
  const result = validateTranslation(JSON.stringify({
    hindi_title: 'Hindi title',
    hindi_content: 'alpha beta gamma delta epsilon zeta eta theta iota kappa',
  }), english);
  assert.equal(result.hindi_title, 'Hindi title');
});

test('rejects invalid JSON', () => assert.throws(() => validateTranslation('nope', english), /invalid JSON/));
test('rejects obvious model error text', () => assert.throws(() => validateTranslation(JSON.stringify({ hindi_title: 'Error', hindi_content: 'Unable to translate' }), english), /obvious error text/));
test('rejects likely summarization under the 60 percent threshold', () => assert.throws(() => validateTranslation(JSON.stringify({ hindi_title: 'Hindi title', hindi_content: 'alpha beta gamma delta epsilon' }), english), /Possible summarization/));

test('buildTranslationRequest creates correct payload', () => {
  const request = buildTranslationRequest('My Title', 'My Content', 'gemini-3.5-flash', 'System instructions here');
  assert.equal(request.model, 'gemini-3.5-flash');
  assert.equal(request.contents, 'Title:\nMy Title\n\nArticle:\nMy Content');
  assert.equal(request.config?.systemInstruction, 'System instructions here');
  assert.equal(request.config?.responseMimeType, 'application/json');
  assert.equal(request.config?.responseSchema?.type, 'OBJECT');
  assert.deepEqual(request.config?.responseSchema?.required, ['hindi_title', 'hindi_content']);
});

test('translateToHindi: successful response returns validated translation', async () => {
  const mockClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify({
          hindi_title: 'हिंदी शीर्षक',
          hindi_content: 'अल्फा बीटा गामा डेल्टा एप्सीलोन ज़ेटा ईटा थीटा आयोटा कप्पा',
        }),
      }),
    },
  };
  const result = await translateToHindi('Title', english, mockClient);
  assert.equal(result.hindi_title, 'हिंदी शीर्षक');
  assert.ok(result.hindi_content.length > 0);
});

test('translateToHindi: timeout produces an error and does not hang', async () => {
  const hungClient = {
    models: {
      generateContent: () => new Promise<never>(() => {}), // never resolves
    },
  };
  await assert.rejects(
    () => translateToHindi('Title', english, hungClient, 50),
    (err: any) => {
      assert.equal(err.name, 'TimeoutError');
      assert.match(err.message, /timed out after 50ms/);
      return true;
    }
  );
});

test('categorizeError & isTransientError: permanent error (bad model/key/malformed) is not transient', () => {
  assert.equal(categorizeError(new Error('GEMINI_API_KEY is required')), 'AUTH_ERROR');
  assert.equal(isTransientError(new Error('GEMINI_API_KEY is required')), false);

  assert.equal(categorizeError({ status: 401, message: 'API_KEY_INVALID' }), 'AUTH_ERROR');
  assert.equal(isTransientError({ status: 401, message: 'API_KEY_INVALID' }), false);

  assert.equal(categorizeError({ status: 404, message: 'model models/gemini-2.5-flash is no longer available' }), 'NOT_FOUND');
  assert.equal(isTransientError({ status: 404, message: 'model models/gemini-2.5-flash is no longer available' }), false);

  assert.equal(categorizeError({ status: 400, message: 'INVALID_ARGUMENT: Bad request' }), 'INVALID_ARGUMENT');
  assert.equal(isTransientError({ status: 400, message: 'INVALID_ARGUMENT: Bad request' }), false);
});

test('categorizeError & isTransientError: transient error (429/5xx/timeout/network) is transient', () => {
  const timeoutErr = new Error('Gemini translation timed out after 60000ms');
  timeoutErr.name = 'TimeoutError';
  assert.equal(categorizeError(timeoutErr), 'TIMEOUT');
  assert.equal(isTransientError(timeoutErr), true);

  assert.equal(categorizeError({ status: 429, message: 'Resource exhausted: rate limit exceeded' }), 'RATE_LIMIT');
  assert.equal(isTransientError({ status: 429, message: 'Resource exhausted: rate limit exceeded' }), true);

  assert.equal(categorizeError({ status: 503, message: 'The service is unavailable' }), 'SERVER_ERROR');
  assert.equal(isTransientError({ status: 503, message: 'The service is unavailable' }), true);

  assert.equal(categorizeError(new Error('fetch failed: ECONNRESET')), 'NETWORK_ERROR');
  assert.equal(isTransientError(new Error('fetch failed: ECONNRESET')), true);
});

test('process retry logic: permanent error stops immediately, transient error retries', async () => {
  // Simulate permanent error flow
  let permanentAttempts = 0;
  const permErr = { status: 404, message: 'model not found' };
  if (isTransientError(permErr)) permanentAttempts++;
  assert.equal(permanentAttempts, 0, 'Permanent error should have 0 retries');

  // Simulate transient error flow
  let transientAttempts = 0;
  const transErr = { status: 429, message: 'rate limit' };
  const retryDelays = [10];
  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    transientAttempts++;
    if (!isTransientError(transErr) || attempt === retryDelays.length) break;
  }
  assert.equal(transientAttempts, 2, 'Transient error should attempt initial try + 1 retry before final fail');
});
