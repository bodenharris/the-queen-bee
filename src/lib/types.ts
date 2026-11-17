export const CATEGORIES = ['Geography', 'Sports', 'Movies/TV', 'History', 'Food', 'Science'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Answer {
	name: string;
	value: number;
	aliases?: string[];
	/** Optional display text shown instead of the formatted value. */
	note?: string;
}

export interface Question {
	id: string;
	category: Category;
	/** The easy part, e.g. "Name a country". */
	prompt: string;
	/** The twist, e.g. "smaller is better". */
	twist: string;
	better: 'higher' | 'lower';
	format: (v: number) => string;
	/** Short note about what is being measured. */
	measure: string;
	answers: Answer[];
}

export interface Result {
	qid: string;
	input: string;
	answer: string;
	display: string;
	score: number;
	rank: number;
	total: number;
	/** True when the 30-second clock ran out before an answer was locked in. */
	timedOut?: boolean;
}
