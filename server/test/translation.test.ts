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
  const request = buildTranslationRequest('My Title', 'My Content', 'moonshot-v1-8k', 'System instructions here');
  assert.equal(request.model, 'moonshot-v1-8k');
  assert.deepEqual(request.response_format, { type: 'json_object' });
  assert.equal(request.messages.length, 2);
  assert.equal(request.messages[0].role, 'system');
  assert.equal(request.messages[0].content, 'System instructions here');
  assert.equal(request.messages[1].role, 'user');
  assert.equal(request.messages[1].content, 'Title:\nMy Title\n\nArticle:\nMy Content');
});
