import assert from 'node:assert/strict';
import test from 'node:test';
import { validateTranslation, buildTranslationRequest } from '../src/translation.js';

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
