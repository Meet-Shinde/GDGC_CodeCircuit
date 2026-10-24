import { downloadFile, formatReport } from './services/downloads';
import JournalDetails, { JournalCollage, ProcessNotes } from './components/JournalDetails';
import ClauseInput from './components/ClauseInput';
import AnalysisResults from './components/AnalysisResults';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { analyzeClause, MAX_CHARS, validateClause } from './services/api';
import type { ClauseMap, ContextType } from './types/analysis';

type SavedAnalysis = { data: ClauseMap; source: string; context: ContextType };
const samples: { name: string; context: ContextType; text: string }[] = [
  { name: 'Rental notice', context: 'rental', text: 'The tenant must give the landlord at least 30 days’ written notice before vacating the premises. Rent of ₹15,000 is payable on or before the 5th day of each month. The refundable security deposit may be adjusted against unpaid rent.' },
  { name: 'Freelance payment', context: 'freelance', text: 'The client shall pay the freelancer ₹20,000 within 14 days of receiving the final invoice. The freelancer shall provide two rounds of revisions. Additional revisions require prior written agreement on fees.' },
  { name: 'General agreement', context: 'general', text: 'Either party may terminate this agreement by providing written notice. The receiving party must return all confidential materials upon termination. The parties shall cooperate to complete any outstanding handover.' },
];
export default function App() {
  const [clause, setClause] = useState('');
  const [context, setContext] = useState<ContextType>('general');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);
  const [page, setPage] = useState<'input' | 'map'>('input');
  const [copied, setCopied] = useState('');
  const mapTitle = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const pending = useRef(false);
  const overLimit = clause.length > MAX_CHARS;
  useEffect(() => { if (page === 'map') { mapTitle.current?.focus(); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } }, [page, analysis]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || importing) return;
    const invalid = validateClause(clause);
    if (invalid) { setError(invalid); input.current?.focus(); return; }
    pending.current = true; setLoading(true); setError(''); setCopied('');
    try { const data = await analyzeClause({ clause_text: clause, context_type: context }); setAnalysis({ data, source: clause.trim(), context }); setPage('map'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); }
    finally { pending.current = false; setLoading(false); }
  }
  function backToInput() { setPage('input'); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); requestAnimationFrame(() => input.current?.focus()); }
  async function copyResults() {
    if (!analysis) return;
    try { await navigator.clipboard.writeText(JSON.stringify(analysis.data, null, 2)); setCopied('Clause Map copied.'); }
    catch { setCopied('Copy is unavailable here. You can select and copy the results directly.'); }
  }
  const data = analysis?.data;
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="topbar"><a className="brand" href="#main" onClick={e => { e.preventDefault(); if (!loading && !importing) backToInput(); }}><span className="brand-icon" aria-hidden="true"><svg viewBox="0 0 32 40" fill="none"><path d="M5 3l17 1 6 7-1 25-23 1zM21 4v8h7M9 17h12M9 23h12M9 29h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span>LegalEase<small>A LITTLE CLARITY GOES A LONG WAY</small></span></a><div className="header-note"><span aria-hidden="true">✦</span> A friend to the fine print.</div><nav className="header-links" aria-label="Main navigation"><a href="#main">Notebook</a><a href="#faq">A few questions</a></nav></header>
    <main id="main" className="shell">
      <nav className="step-nav" aria-label="Workspace steps"><button aria-current={page === 'input' ? 'step' : undefined} disabled={loading || importing} onClick={backToInput}><span>01</span> Your clause</button><span className="nav-line" aria-hidden="true"/><button aria-current={page === 'map' ? 'step' : undefined} disabled={!analysis || loading || importing} onClick={() => setPage('map')}><span>02</span> Your Clause Map</button></nav>
      {page === 'input' ? <>
        <section className="intro"><div className="intro-copy"><p className="eyebrow">A FRIEND TO THE FINE PRINT</p><h1>Big legal words.<br/>Little moments<br className="hero-break"/> of <span className="highlight">clarity.</span></h1><p className="tagline">Understand the clause. See the obligations.<br className="desktop-break"/> Know what to ask.</p><p className="together">Let’s figure it out, together. <span aria-hidden="true">⤵</span></p></div><JournalCollage/></section>
        <div className="input-grid" id="workspace"><ClauseInput clause={clause} setClause={setClause} context={context} setContext={setContext} loading={loading || importing} setImporting={setImporting} error={error} setError={setError} overLimit={overLimit} input={input} submit={submit}/>
        <aside className="side-notes"><section className="sticky-note"><span className="tape" aria-hidden="true"/><p className="note-label">A NOTE BEFORE YOU START</p><p className="hand-note">Small print. Clearer picture.</p><ol className="feature-list"><li><span>01</span><div><h3>The plain-English version</h3><p>A short explanation of what the excerpt says.</p></div></li><li><span>02</span><div><h3>Who needs to do what</h3><p>Obligations, timing, money, and the source quotes.</p></div></li><li><span>03</span><div><h3>Questions worth asking</h3><p>Unclear terms and details the excerpt leaves out.</p></div></li></ol><p className="margin-note">No need to untangle it all at once.</p></section><section className="samples"><p className="eyebrow">NEED A STARTING POINT?</p><h3>Borrow a little fine print.</h3><p>Fictional clauses to try. These fill the input; every analysis uses the API.</p><div className="sample-buttons">{samples.map(s => <button disabled={loading || importing} key={s.name} onClick={() => { setClause(s.text); setContext(s.context); setError(''); input.current?.focus(); }}>{s.name} <span aria-hidden="true">↗</span></button>)}</div></section></aside></div>
        <ProcessNotes/>
      </> : analysis && data && <>
        <section className="result-intro"><div><p className="eyebrow">YOUR FINE PRINT, UNFOLDED</p><h1 ref={mapTitle} tabIndex={-1}>Your <span className="highlight">Clause Map.</span></h1><p className="tagline">A clearer view of what is written — and what isn't.</p></div><div className="result-actions"><button className="secondary-button" onClick={backToInput}>← Edit clause</button><button className="secondary-button" onClick={copyResults}>Copy results ↗</button><button className="secondary-button" onClick={()=>downloadFile('LegalEase-Clause-Map.txt', formatReport(data!, analysis!.context))}>Download notes (.txt)</button><button className="secondary-button print-action" onClick={()=>window.print()}>Save as PDF / Print</button><span className="copy-status" role="status">{copied}</span></div></section>
        <AnalysisResults analysis={analysis} data={data} backToInput={backToInput}/>
      </>}
      <JournalDetails/>
      <aside className="disclaimer"><span aria-hidden="true">✧</span><p><strong>A little reminder.</strong> LegalEase provides informational explanations, not legal advice. For consequential decisions, consult a qualified legal professional.</p></aside>
    </main><footer><span>Made for the fine print, and the people reading it.</span><span className="footer-hand">Less head-scratching. More “oh, got it.”</span></footer>
  </>;
}
