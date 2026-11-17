import type { Result } from './types';
import { todayKey } from './game';

const PREFIX = 'queen-bee:';

function read<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(PREFIX + key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function write(key: string, value: unknown) {
	try {
		localStorage.setItem(PREFIX + key, JSON.stringify(value));
	} catch {
		/* storage unavailable — game still works for this session */
	}
}

export const loadDay = (date: string): (Result | null)[] => read(`day:${date}`, []);
export const saveDay = (date: string, results: (Result | null)[]) => write(`day:${date}`, results);

/**
 * When the clock started for a question (ms since epoch). Persisted so a
 * page reload can't reset the timer.
 */
export const loadTimerStart = (date: string, qid: string): number | null =>
	read(`timer:${date}:${qid}`, null);
export const saveTimerStart = (date: string, qid: string, start: number) =>
	write(`timer:${date}:${qid}`, start);

/** date -> final total, for finished games only. */
export const loadHistory = (): Record<string, number> => read('history', {});

export function recordFinished(date: string, total: number) {
	const h = loadHistory();
	h[date] = total;
	write('history', h);
}

export const hasSeenHelp = () => read('seen-help', false);
export const markSeenHelp = () => write('seen-help', true);

export function stats(today: string) {
	const h = loadHistory();
	const totals = Object.values(h);
	let streak = 0;
	const d = new Date(today + 'T12:00:00');
	// Today's game may not be finished yet; don't break the streak for that.
	if (!(today in h)) d.setDate(d.getDate() - 1);
	for (;;) {
		const key = todayKey(d);
		if (!(key in h)) break;
		streak++;
		d.setDate(d.getDate() - 1);
	}
	return {
		played: totals.length,
		average: totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0,
		best: totals.length ? Math.max(...totals) : 0,
		streak
	};
}
