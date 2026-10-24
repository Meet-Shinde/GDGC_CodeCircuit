import type { Evidence } from '../types/analysis';
export function EvidenceQuote({ evidence_quote, evidence_verified }: Evidence) {
  const matched = Boolean(evidence_quote?.trim()) && evidence_verified;
  return <div className={`evidence ${matched ? 'matched' : 'unverified'}`}>
    <span className="evidence-badge">{matched ? '✓ Quote matched to source' : evidence_quote ? '! Quote not verified' : '— No supporting quote provided'}</span>
    {evidence_quote && <blockquote>{evidence_quote}</blockquote>}
  </div>;
}
export function SectionHeading({ number, title, count }: { number: string; title: string; count?: number }) {
  return <div className="section-heading"><h2><span className="step-number">{number}</span>{title}</h2>{count !== undefined && <span className="count">{count} {count === 1 ? 'item' : 'items'}</span>}</div>;
}
