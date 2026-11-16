import test from 'node:test';
import assert from 'node:assert/strict';
test('demo question contract', () => { const payload = { question: 'What changed?' }; assert.equal(typeof payload.question, 'string'); });
