import type { ClauseMap } from '../types/analysis';
export function downloadFile(filename: string, content: string, type = 'text/plain;charset=utf-8') {
 const url = URL.createObjectURL(new Blob([content], {type}));
 const a = document.createElement('a'); a.href = url; a.download = filename;
 document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function formatReport(data: ClauseMap, context: string): string {
 const evidence = (q: string | null, verified: boolean) => `Evidence: ${q ?? 'No supporting quote provided'}\nStatus: ${q?.trim() && verified ? 'Quote matched to source' : 'Unverified / no quote'}`;
 return ['LegalEase — Clause Map', `Context: ${context}`, 'Informational explanations, not legal advice. Quote matching does not establish legal correctness.',
 'PLAIN ENGLISH', data.plain_english,
 'IMPORTANT DETAILS / OBLIGATIONS', ...data.obligations.map((o,i)=>`${i+1}. ${o.party}: ${o.action}\nTiming: ${o.timing}\nFinancial effect: ${o.financial_effect ?? 'Not specified in this excerpt'}\n${evidence(o.evidence_quote,o.evidence_verified)}`),
 'QUESTIONS TO ASK', ...data.unclear_points.map(u=>`${u.issue}\nAsk: ${u.question_to_ask}\n${evidence(u.evidence_quote,u.evidence_verified)}`),
 'NOT SPECIFIED', ...(data.not_specified.length ? data.not_specified : ['No items returned. This does not establish completeness.']),
 'VERIFICATION WARNINGS', ...(data.verification_warnings.length ? data.verification_warnings : ['None returned.'])].join('\n\n');
}
const escapeICS = (s: string) => s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
export function reminderCalendar(title: string, localDate: string, now = new Date()): string {
 const start = new Date(localDate);
 if (!title.trim()) throw new Error('Give your reminder a short title.');
 if (!Number.isFinite(start.getTime()) || start <= now) throw new Error('Choose a date and time in the future.');
 const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//LegalEase//Reminders//EN','BEGIN:VEVENT',`UID:${crypto.randomUUID()}@legalease.local`,`DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(new Date(start.getTime()+15*60000))}`,`SUMMARY:${escapeICS(title.trim())}`,'DESCRIPTION:Date chosen by you. Confirm the deadline against your contract. Informational only.','BEGIN:VALARM','TRIGGER:-PT15M','ACTION:DISPLAY','DESCRIPTION:LegalEase reminder','END:VALARM','END:VEVENT','END:VCALENDAR'];
 // RFC 5545 folding: at most 75 UTF-8 octets per physical line.
 const encoder = new TextEncoder();
 return lines.map(line => {let out = '', part = ''; for (const char of line) {if (encoder.encode(part + char).length > 75) {out += part + '\r\n'; part = ' ';} part += char;} return out + part;}).join('\r\n')+'\r\n';
}
