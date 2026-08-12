import assert from 'node:assert/strict';
import test from 'node:test';
import { validateTranslation } from '../src/translation.js';

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
