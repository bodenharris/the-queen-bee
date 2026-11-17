import { CATEGORIES, type Answer, type Category, type Question } from './types';
import { QUESTIONS } from './data/questions';

// ───────────── Text matching ─────────────

const ROMAN = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'];

export function normalize(s: string): string {
	let t = s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/['’`.]/g, '')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
	t = t.replace(/^(the|a|an|king|queen|president) /, '');
	t = t.replace(/\bst\b/g, 'saint');
	// "Henry 8" == "Henry VIII", "Toy Story II" == "Toy Story 2"
	t = t
		.split(' ')
		.map((w) => (/^[1-9]$/.test(w) ? ROMAN[+w] : w))
		.join(' ');
	return t;
}

/** "james k polk" -> "james polk"; only strips single letters in the middle. */
function dropMiddleInitials(t: string): string {
	const w = t.split(' ');
	if (w.length < 3) return t;
	return [w[0], ...w.slice(1, -1).filter((x) => x.length > 1), w[w.length - 1]].join(' ');
}

const NUMERAL = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/;
const numerals = (t: string) => t.split(' ').filter((w) => NUMERAL.test(w)).join(' ');

/** Edit distance where swapping two neighbouring letters ("teh") counts as one typo. */
function editDistance(a: string, b: string): number {
	if (a === b) return 0;
	const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
		Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
	);
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
			}
		}
	}
	return d[a.length][b.length];
}

/**
 * A "sounds-alike" spelling key: ignores spaces and hyphens, doubled letters
 * and a few letters people commonly mix up, so "Phillipines", "Fillipines"
 * and "Philippines" all look the same.
 */
function soundKey(t: string): string {
	return t
		.replace(/ /g, '')
		.replace(/ph/g, 'f')
		.replace(/ck|q/g, 'k')
		.replace(/c(?=[eiy])/g, 's')
		.replace(/c/g, 'k')
		.replace(/z/g, 's')
		.replace(/y/g, 'i')
		.replace(/ou/g, 'u')
		.replace(/(.)\1+/g, '$1');
}

/** How many typos we forgive for an answer of this length. */
function typoAllowance(len: number): number {
	if (len <= 3) return 0;
	if (len <= 5) return 1;
	if (len <= 8) return 2;
	if (len <= 12) return 3;
	return 4;
}

type Index = Map<string, Answer | null>; // null = ambiguous key
const indexCache = new Map<string, Index>();

function buildIndex(q: Question): Index {
	const idx: Index = new Map();
	const add = (key: string, a: Answer) => {
		if (!key) return;
		const existing = idx.get(key);
		if (existing === undefined) idx.set(key, a);
		else if (existing !== a) idx.set(key, null);
	};
	// Primary names first so they always win over another answer's alias.
	const primary = new Set<string>();
	for (const a of q.answers) {
		const k = normalize(a.name);
		primary.add(k);
		add(k, a);
	}
	for (const a of q.answers) {
		const keys = [normalize(a.name), ...(a.aliases ?? []).map(normalize)];
		for (const k of keys) {
			if (primary.has(k) && k !== normalize(a.name)) continue;
			add(k, a);
			const d = dropMiddleInitials(k);
			if (d !== k && !primary.has(d)) add(d, a);
		}
	}
	return idx;
}

export type MatchResult =
	| { kind: 'ok'; answer: Answer }
	| { kind: 'ambiguous' }
	| { kind: 'unknown' };

export function findAnswer(q: Question, input: string): MatchResult {
	let idx = indexCache.get(q.id);
	if (!idx) indexCache.set(q.id, (idx = buildIndex(q)));
	const t = normalize(input);
	if (!t) return { kind: 'unknown' };

	for (const key of [t, dropMiddleInitials(t)]) {
		if (!idx.has(key)) continue;
		const hit = idx.get(key);
		return hit ? { kind: 'ok', answer: hit } : { kind: 'ambiguous' };
	}

	// Forgiving typo match. Misspellings, swapped letters, missing spaces,
	// doubled letters and sound-alike spellings all still count.
	const tSound = soundKey(t);
	const tSquash = t.replace(/ /g, '');
	let best: Answer | null = null;
	let bestDist = Infinity;
	let tie = false;
	for (const [k, a] of idx) {
		if (!a) continue;
		if (numerals(k) !== numerals(t)) continue; // never turn "Toy Story 5" into "Toy Story 4"
		const kSquash = k.replace(/ /g, '');
		const allow = typoAllowance(Math.min(tSquash.length, kSquash.length));
		if (Math.abs(kSquash.length - tSquash.length) > allow + 2) continue;
		const kSound = soundKey(k);
		const dist = Math.min(editDistance(tSquash, kSquash), editDistance(tSound, kSound));
		if (dist > allow) continue;
		// Bigger slips must at least start with the same sound ("Greenland" ≠ "Ireland").
		if (dist >= 2 && tSound[0] !== kSound[0]) continue;
		if (dist < bestDist) {
			best = a;
			bestDist = dist;
			tie = false;
		} else if (dist === bestDist && a !== best) tie = true;
	}
	if (best && !tie) return { kind: 'ok', answer: best };
	if (best && tie) return { kind: 'ambiguous' };

	// Started typing a long name and stopped? Accept a unique prefix ("Liechten").
	if (tSquash.length >= 5) {
		const hits = new Set<Answer>();
		for (const [k, a] of idx) if (a && k.replace(/ /g, '').startsWith(tSquash)) hits.add(a);
		if (hits.size === 1) return { kind: 'ok', answer: [...hits][0] };
		if (hits.size > 1) return { kind: 'ambiguous' };
	}
	return { kind: 'unknown' };
}

// ───────────── Scoring ─────────────

/** Answers ordered best → worst. */
export function ranked(q: Question): Answer[] {
	const dir = q.better === 'higher' ? -1 : 1;
	return [...q.answers].sort((a, b) => dir * (a.value - b.value));
}

/**
 * Percentile score. 100 is reserved for the #1 answer — everything else tops
 * out at 99, even if it would round up. Any real answer earns at least 1;
 * only running out of time scores 0.
 * Tied answers share the average of the positions they occupy.
 */
export function scoreAnswer(q: Question, a: Answer) {
	const n = q.answers.length;
	const isBetter = (x: number) => (q.better === 'higher' ? x > a.value : x < a.value);
	const isWorse = (x: number) => (q.better === 'higher' ? x < a.value : x > a.value);
	const better = q.answers.filter((x) => isBetter(x.value)).length;
	const worse = q.answers.filter((x) => isWorse(x.value)).length;
	const ties = n - better - worse; // includes itself
	const rank = better + 1;
	const percentile = n <= 1 ? 100 : Math.round((100 * (worse + (ties - 1) / 2)) / (n - 1));
	const score = rank === 1 ? 100 : Math.max(1, Math.min(99, percentile));
	return { score, rank, total: n };
}

export const display = (q: Question, a: Answer) => a.note ?? q.format(a.value);

// ───────────── Daily puzzle ─────────────

const EPOCH = Date.UTC(2026, 0, 1);

export function todayKey(d = new Date()): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function puzzleNumber(key: string): number {
	const [y, m, d] = key.split('-').map(Number);
	return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / 86_400_000) + 1;
}

function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function shuffled<T>(arr: T[], seed: number): T[] {
	const rand = mulberry32(seed);
	const out = [...arr];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

export const byCategory = (c: Category) => QUESTIONS.filter((q) => q.category === c);

/**
 * One question per category. Within each category we walk through a seeded
 * shuffle, so no question repeats until every question in it has been used.
 */
export function dailyQuestions(key: string): Question[] {
	const day = Math.max(0, puzzleNumber(key));
	return CATEGORIES.map((cat, ci) => {
		const pool = byCategory(cat);
		const cycle = Math.floor(day / pool.length);
		const order = shuffled(pool, cycle * 97 + ci * 7919 + 13);
		return order[day % pool.length];
	});
}

export const CATEGORY_STYLE: Record<Category, { emoji: string; color: string }> = {
	Geography: { emoji: '🌍', color: '#6fd35f' },
	Sports: { emoji: '🏀', color: '#ff8a3d' },
	'Movies/TV': { emoji: '🎬', color: '#c77dff' },
	History: { emoji: '📜', color: '#e8c17a' },
	Food: { emoji: '🍰', color: '#ff6b8b' },
	Science: { emoji: '🔬', color: '#3fc6ff' }
};

/** Share-grid glyph: a full honey pot for great answers, down to a bare comb. */
export function scoreSquare(score: number): string {
	if (score >= 90) return '🍯';
	if (score >= 70) return '🟨';
	if (score >= 40) return '🟧';
	return '⬛';
}

/** What Her Majesty says about an answer. */
export function beeVerdict(score: number): { title: string; line: string; mood: 'happy' | 'idle' | 'sad' } {
	if (score === 100) return { title: 'Royal decree!', line: 'Un-bee-lievable. The perfect answer!', mood: 'happy' };
	if (score >= 90) return { title: 'Bee-autiful!', line: 'The whole hive is buzzing about that one.', mood: 'happy' };
	if (score >= 70) return { title: 'Sweet as honey', line: 'A fine contribution to the royal stores.', mood: 'happy' };
	if (score >= 40) return { title: 'Not too shabby', line: 'Respectable work, little worker bee.', mood: 'idle' };
	if (score >= 15) return { title: 'A bit waxy…', line: 'Hmm. Her Majesty expected more nectar.', mood: 'sad' };
	return { title: 'Bzzzt!', line: 'Wrong end of the hive, I’m afraid!', mood: 'sad' };
}

/** Rank title for a full day's total out of 600. */
export function hiveRank(total: number): string {
	if (total >= 540) return 'Queen Bee 👑';
	if (total >= 450) return 'Royal Guard';
	if (total >= 350) return 'Honey Maker';
	if (total >= 250) return 'Worker Bee';
	if (total >= 150) return 'Drone';
	return 'Larva';
}
