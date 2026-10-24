import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeClause, isClauseMap, validateClause } from './api.ts';

const empty = { plain_english: 'An explanation.', obligations: [], unclear_points: [], not_specified: [], verification_warnings: [] };
const request = { clause_text: '  Synthetic clause.  ', context_type: 'rental' as const };
// Test-only transport fixture. Never imported by the application or used as an API fallback.
function withFetch(implementation: typeof fetch, run: () => Promise<void>) {
  return async () => { const original = globalThis.fetch; globalThis.fetch = implementation; try { await run(); } finally { globalThis.fetch = original; } };
}
test('validates blank, boundary-length and oversized input', () => {
  assert.ok(validateClause(' \n ')); assert.equal(validateClause('a'.repeat(6000)), null); assert.ok(validateClause('a'.repeat(6001)));
});
test('accepts empty arrays, nullable fields and unverified quotes', () => {
  assert.equal(isClauseMap(empty), true);
  assert.equal(isClauseMap({ ...empty, obligations: [{ party: 'Tenant', action: 'Give notice', timing: '30 days', financial_effect: null, evidence_quote: null, evidence_verified: false }], unclear_points: [{ issue: 'Delivery method absent', question_to_ask: 'How is notice delivered?', evidence_quote: null, evidence_verified: false }], verification_warnings: ['Quote could not be matched'] }), true);
  assert.equal(isClauseMap({ ...empty, obligations: [{ party: 'Tenant' }] }), false);
  assert.equal(isClauseMap({ ...empty, verification_warnings: null }), false);
});
test('sends exact route, trimmed request and enum and reads response', withFetch(async (url, init) => {
  assert.equal(url, 'http://test-backend/api/analyze'); assert.equal(init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(init?.body)), { clause_text: 'Synthetic clause.', context_type: 'rental' });
  return new Response(JSON.stringify(empty), { status: 200 });
}, async () => { assert.deepEqual(await analyzeClause(request, 'http://test-backend/'), empty); }));
test('invalid input never makes an API request', withFetch(async () => { throw Error('Should never fetch'); }, async () => {
  await assert.rejects(analyzeClause({ ...request, clause_text: ' ' }), /Add a clause/);
  await assert.rejects(analyzeClause({ ...request, clause_text: 'x'.repeat(6001) }), /6,000/);
}));
test('handles backend failure without echoing server input', withFetch(async () => new Response(JSON.stringify({ detail: 'Private clause contents' }), { status: 422 }), async () => {
  await assert.rejects(analyzeClause(request), /could not validate/);
}));
test('handles provider failure', withFetch(async () => new Response('error', { status: 503 }), async () => {
  await assert.rejects(analyzeClause(request), /service is having trouble/);
}));
test('handles malformed JSON', withFetch(async () => new Response('not json', { status: 200 }), async () => {
  await assert.rejects(analyzeClause(request), /unreadable response/);
}));
test('rejects schema drift', withFetch(async () => new Response(JSON.stringify({ summary: 'Wrong shape' }), { status: 200 }), async () => {
  await assert.rejects(analyzeClause(request), /agreed Clause Map/);
}));
test('handles network and CORS failure', withFetch(async () => { throw new TypeError('Failed to fetch'); }, async () => {
  await assert.rejects(analyzeClause(request), /CORS/);
}));
