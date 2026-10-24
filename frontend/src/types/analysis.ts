export type ContextType = 'rental' | 'freelance' | 'general';
export interface AnalyzeRequest { clause_text: string; context_type: ContextType }
export interface Evidence { evidence_quote: string | null; evidence_verified: boolean }
export interface Obligation extends Evidence { party: string; action: string; timing: string; financial_effect: string | null }
export interface UnclearPoint extends Evidence { issue: string; question_to_ask: string }
export interface ClauseMap { plain_english: string; obligations: Obligation[]; unclear_points: UnclearPoint[]; not_specified: string[]; verification_warnings: string[] }
