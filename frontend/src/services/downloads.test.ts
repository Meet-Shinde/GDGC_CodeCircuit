import test from 'node:test';
import assert from 'node:assert/strict';
import { formatReport, reminderCalendar } from './downloads.ts';

test('report preserves all schema sections, nullable values, and evidence limitations', () => {
 const report = formatReport({plain_english:'An explanation',obligations:[{party:'Tenant',action:'Pay rent',timing:'By the 5th',financial_effect:null,evidence_quote:null,evidence_verified:true}],unclear_points:[{issue:'Notice period unclear',question_to_ask:'How many days?',evidence_quote:'written notice',evidence_verified:false}],not_specified:['Penalty'],verification_warnings:['A quote could not be matched']},'rental');
 for(const text of ['An explanation','By the 5th','Financial effect: Not specified','Unverified / no quote','How many days?','Penalty','A quote could not be matched','does not establish legal correctness']) assert.ok(report.includes(text));
});
test('calendar uses explicit chosen time, escapes user input, and includes alarm', () => {
 const now = new Date('2026-01-01T00:00:00Z');
 const ics = reminderCalendar('Notice, rent; next\nline','2027-01-02T15:00:00Z',now);
 assert.match(ics,/DTSTART:20270102T150000Z/);assert.match(ics,/DTEND:20270102T151500Z/);
 assert.ok(ics.includes('SUMMARY:Notice\\, rent\\; next\\nline'));
 assert.match(ics,/TRIGGER:-PT15M/); assert.match(ics,/BEGIN:VCALENDAR/);
});
test('calendar rejects blank titles, missing or past dates', () => {
 for(const [title,date] of [['','2028-01-01'],['Review',''],['Review','2000-01-01']]) assert.throws(()=>reminderCalendar(title,date));
});
test('calendar folds Unicode lines to 75 UTF-8 bytes and prevents new properties', () => {
 const ics=reminderCalendar('Notice\nATTENDEE:someone '+ '₹😀'.repeat(70),'2028-01-01');
 for(const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line,'utf8')<=75);
 assert.ok(!ics.includes('\r\nATTENDEE:'));
});
