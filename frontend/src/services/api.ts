import type { AnalyzeRequest, ClauseMap } from '../types/analysis.ts';
export const MAX_CHARS = 6000;
export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8000').trim().replace(/\/+$/, '');
export function validateClause(text: string): string | null {
  if (!text.trim()) return 'Add a clause first — a paragraph is a great place to start.';
  if (text.length > MAX_CHARS) return 'This excerpt is a little long. Please shorten it to 6,000 characters or fewer.';
  return null;
}
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const nullableString = (v: unknown) => v === null || typeof v === 'string';
const evidence = (v: Record<string, unknown>) => nullableString(v.evidence_quote) && typeof v.evidence_verified === 'boolean';
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');
export function isClauseMap(v: unknown): v is ClauseMap {
  return object(v) && typeof v.plain_english === 'string'
    && Array.isArray(v.obligations) && v.obligations.every(x => object(x) && ['party', 'action', 'timing'].every(k => typeof x[k] === 'string') && nullableString(x.financial_effect) && evidence(x))
    && Array.isArray(v.unclear_points) && v.unclear_points.every(x => object(x) && typeof x.issue === 'string' && typeof x.question_to_ask === 'string' && evidence(x))
    && strings(v.not_specified) && strings(v.verification_warnings);
}
export async function analyzeClause(request: AnalyzeRequest, baseUrl = API_BASE_URL): Promise<ClauseMap> {
  const error = validateClause(request.clause_text);
  if (error) throw new Error(error);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, clause_text: request.clause_text.trim() }), signal: controller.signal,
    });
    if (!response.ok) {
      // Do not echo server payloads: validation errors may contain the user's clause.
      const messages: Record<number, string> = {
        400: 'The API could not read this clause. Check the text and try again.',
        413: 'The API says this excerpt is too long. Please use a shorter paragraph.',
        422: 'The API could not validate this input. Check the clause and context, then try again.',
        429: 'The service is busy. Give it a moment, then try again.',
        504: 'The explanation took too long. Please try again with a shorter excerpt.',
      };
      throw new Error(messages[response.status] ?? (response.status >= 500 ? 'The explanation service is having trouble. Your text is still here — please try again shortly.' : `The request did not succeed (HTTP ${response.status}). Please check the backend configuration.`));
    }
    let data: unknown;
    try { data = await response.json(); } catch { throw new Error('The API returned an unreadable response. Please try again or ask your team to check the backend.'); }
    if (!isClauseMap(data)) throw new Error('The API response does not match the agreed Clause Map format. Please ask your team to check the backend.');
    return data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('This is taking longer than expected. Please try again; a shorter excerpt may help.');
    if (error instanceof TypeError) throw new Error('We could not reach the API. Check that the backend is running, VITE_API_BASE_URL is correct, and CORS allows this frontend.');
    throw error;
  } finally { clearTimeout(timer); }
}
