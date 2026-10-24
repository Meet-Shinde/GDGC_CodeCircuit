import DocumentImport from './DocumentImport';
import type { FormEvent, RefObject } from 'react';
import type { ContextType } from '../types/analysis';
import { SectionHeading } from './ResultShared';
import LoadingState from './LoadingState';
interface Props {
 clause: string; setClause: (text: string) => void; context: ContextType; setContext: (context: ContextType) => void;
 setImporting: (busy: boolean) => void; loading: boolean; error: string; setError: (error: string) => void; overLimit: boolean;
 input: RefObject<HTMLTextAreaElement | null>; submit: (event: FormEvent) => void;
}
export default function ClauseInput({ clause, setClause, context, setContext, loading, error, setError, overLimit, input, submit, setImporting }: Props) {
 return (<section className="paper entry-paper"><span className="tape" aria-hidden="true"/><SectionHeading number="1" title="What does your contract say?"/><form onSubmit={event => { if (loading) { event.preventDefault(); return; } submit(event); }} noValidate aria-busy={loading}>
          <DocumentImport disabled={loading} onBusy={setImporting} onText={text=>{setClause(text);setError('');}}/>
          <label className="field-label" htmlFor="clause">Paste a paragraph from your agreement</label><p className="field-help" id="clause-help">Just the relevant excerpt is enough. Maximum 6,000 characters.</p>
          <textarea id="clause" ref={input} value={clause} disabled={loading} onChange={e => { setClause(e.target.value); setError(''); }} aria-describedby={`clause-help character-count${error || overLimit ? ' input-error' : ''}`} aria-invalid={Boolean(error) || overLimit} placeholder="The tenant shall provide written notice at least…" className={overLimit ? 'invalid' : ''} />
          <div className="input-bottom"><span className="private-note">⌁ Text stays here until you analyze.</span><span id="character-count" className={overLimit ? 'character-count over' : 'character-count'} aria-live="polite">{clause.length.toLocaleString()} / 6,000</span></div>
          <fieldset disabled={loading} className="context-options"><legend>What kind of agreement is this?</legend>{(['general', 'rental', 'freelance'] as ContextType[]).map(c => <label key={c} className={context === c ? 'context selected' : 'context'}><input type="radio" name="context" value={c} checked={context === c} onChange={() => setContext(c)}/><span aria-hidden="true">{c === 'general' ? '≋' : c === 'rental' ? '⌂' : '✎'}</span>{c[0].toUpperCase() + c.slice(1)}</label>)}</fieldset>
          {(error || overLimit) && <p className="error" id="input-error" role="alert">{error || 'This excerpt is a little long. Please shorten it to 6,000 characters or fewer.'}</p>}
          <button type="submit" className="primary-button" disabled={loading || overLimit}>{loading ? <><LoadingState/></> : <>Explain my clause <span aria-hidden="true">↗</span></>}</button>
          <p className="form-disclaimer">Informational explanations, not legal advice.</p><p className="submit-note" role="status">{loading ? 'Reading the excerpt and checking source quotes. This can take a moment.' : 'Your text is sent to the configured backend and its inference provider for analysis.'}</p>
        </form></section>);
}
