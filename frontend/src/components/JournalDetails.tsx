export function JournalCollage() {
  return <div className="journal-collage" aria-label="Balance scales and a highlighted contract excerpt">
    <div className="blue-scrap" aria-hidden="true"/>
    <img className="scales-picture" src="/images/balance-scales.png" alt="" aria-hidden="true" width="1536" height="1024"/>
    <div className="excerpt-scrap"><span className="tape" aria-hidden="true"/><span className="note-label">FROM THE FINE PRINT</span><p>“The tenant shall give<br/><mark>30 days’ written notice</mark>…”</p><span className="excerpt-note">↳ a deadline worth noting</span></div>
    <p className="collage-caption">Less “what does that mean?”<br/>More “okay, I understand.”</p>
  </div>;
}
export function ProcessNotes() {
  return <section className="process" id="how-it-works" aria-labelledby="process-title"><div className="process-title"><span className="eyebrow">ONE PARAGRAPH AT A TIME</span><h2 id="process-title">A little less tangled.</h2></div><ol>{[
    ['paste', 'Paste your clause.', 'Start with a paragraph from your agreement. Pick the context that fits.'],
    ['mark', 'We break it down.', 'Read the explanation, responsibilities, and words they’re based on.'],
    ['ask', 'You know what to ask.', 'Take the unclear points and missing details into your next conversation.'],
  ].map(([kind,title,body],i)=><li key={kind}><svg aria-hidden="true" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{i===0?<><path d="M12 8l25-2 7 38-29 4zM19 19l16-2M20 26l15-1M21 33l10-1"/><path d="M5 22l4 2M43 8l4-3M48 18l4-1"/></>:i===1?<><path d="M9 16h33M9 27h23M9 38h33"/><path d="M8 27h23" stroke="#d9bf5b" strokeWidth="8" opacity=".5"/><path d="M36 28l5 5 9-13"/></>:<><path d="M7 10q20-5 40 0v26H28L17 47V36H7zM21 19q2-8 10-4 7 5-2 10v3M29 32v1"/></>}</svg><span className="process-number">0{i+1}</span><h3>{title}</h3><p>{body}</p></li>)}</ol></section>;
}
export default function JournalDetails() {
  const faqs = [
    ['What should I paste here?', 'A relevant paragraph from a rental, freelance, or general agreement. Keep it under 6,000 characters, and remove personal details you do not need explained. The surrounding contract can affect its meaning.'],
    ['What does “Quote matched to source” mean?', 'The backend checks whether the quoted words appear in your excerpt after normalizing whitespace. A match supports traceability; it does not prove that the interpretation is legally correct.'],
    ['Can this replace legal advice?', 'No. LegalEase offers informational explanations. For advice about your situation or a consequential decision, speak with a qualified legal professional.'],
    ['Where does my clause go?', 'When you choose Explain my clause, your text goes to the configured backend and its inference provider. PDF and .docx files are read locally in your browser; review the extracted text before submitting. This frontend keeps your draft in memory, not local storage. Server and provider handling depends on your team’s configuration.'],
  ];
  return <section className="faq" id="faq" aria-labelledby="faq-title"><div><p className="eyebrow">IN THE MARGINS</p><h2 id="faq-title">A few good questions.</h2><p className="faq-note">Before you turn the page…</p></div><div className="faq-entries">{faqs.map(([q,a])=><details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>;
}
