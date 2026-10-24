import { useRef, useState } from 'react';
import { extractDocument } from '../services/documents';
export default function DocumentImport({ disabled, onText, onBusy }: { disabled: boolean; onText: (text: string) => void; onBusy: (busy: boolean) => void }) {
 const [status, setStatus] = useState('');
 const [error, setError] = useState('');
 const pending = useRef(false);
 return <div className="document-import"><label className="field-label" htmlFor="document-file">Or import a document</label><p className="field-help" id="document-help">PDF or Word (.docx), up to 10 MB. Text-based PDFs only, up to 20 pages. Import replaces the text below; review it before analyzing.</p><input id="document-file" type="file" accept=".pdf,.docx" disabled={disabled} aria-describedby="document-help" onChange={async event => {
   const file = event.target.files?.[0]; event.target.value = '';
   if (!file || pending.current) return;
   pending.current = true; onBusy(true); setError(''); setStatus('Reading document…');
   try { const text = await extractDocument(file); onText(text); setStatus(`Imported ${file.name}. ${text.length.toLocaleString()} characters. ${text.length > 6000 ? 'Keep only the paragraph you want explained (maximum 6,000 characters).' : 'Check the extracted text before submitting.'}`); }
   catch (e) { setStatus(''); setError(e instanceof Error && /Please|Choose|No readable|This document/.test(e.message) ? e.message : 'We could not read this file. It may be password-protected or damaged. Try another file, or paste the clause.'); }
   finally {pending.current = false; onBusy(false);}
 }}/><p className="field-help">The file is read in your browser. Only the reviewed text is sent when you analyze.</p><p className="import-status" role="status">{status}</p>{error && <p className="error" role="alert">{error}</p>}</div>;
}
