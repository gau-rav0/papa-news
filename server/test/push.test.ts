import assert from 'node:assert/strict';
import test from 'node:test';
import { chunkTokens, buildMessages } from '../src/push-utils.js';

test('chunkTokens splits into correct batch sizes', () => {
  const tokens = Array.from({ length: 250 }, (_, i) => `ExponentPushToken[token${i}]`);
  const chunks = chunkTokens(tokens, 100);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 100);
  assert.equal(chunks[1].length, 100);
  assert.equal(chunks[2].length, 50);
});

test('chunkTokens returns empty array for empty input', () => {
  assert.deepEqual(chunkTokens([], 100), []);
});

test('chunkTokens handles batch smaller than size', () => {
  const tokens = ['a', 'b', 'c'];
  const chunks = chunkTokens(tokens, 100);
  assert.equal(chunks.length, 1);
  assert.deepEqual(chunks[0], ['a', 'b', 'c']);
});

test('buildMessages creates correct Expo push payload', () => {
  const messages = buildMessages(['tokenA', 'tokenB'], 'Lapaas Hindi News', 'नया लेख');
  assert.equal(messages.length, 2);
  assert.deepEqual(messages[0], { to: 'tokenA', title: 'Lapaas Hindi News', body: 'नया लेख', sound: 'default' });
  assert.deepEqual(messages[1], { to: 'tokenB', title: 'Lapaas Hindi News', body: 'नया लेख', sound: 'default' });
});

test('buildMessages returns empty array for no tokens', () => {
  assert.deepEqual(buildMessages([], 'title', 'body'), []);
});
