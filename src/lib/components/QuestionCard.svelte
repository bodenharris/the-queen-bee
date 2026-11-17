<script lang="ts">
	import { CATEGORY_STYLE, beeVerdict, display, findAnswer, ranked, scoreAnswer } from '../game';
	import type { Question, Result } from '../types';
	import PixelIcon from './PixelIcon.svelte';
	import HexTimer from './HexTimer.svelte';
	import { loadTimerStart, saveTimerStart } from '../storage';

	let {
		question,
		number,
		result,
		date,
		paused = false,
		onanswer,
		onnext,
		onmessage,
		isLast
	}: {
		question: Question;
		number: number;
		result: Result | null;
		date: string;
		paused?: boolean;
		onanswer: (r: Result) => void;
		onnext: () => void;
		onmessage?: (text: string) => void;
		isLast: boolean;
	} = $props();

	// ───── 30-second clock ─────
	const LIMIT = 30;
	let remaining = $state(LIMIT);
	let startedAt = 0;
	let pausedAt: number | null = null;
	let fired = false;

	function timeOut() {
		if (fired || result) return;
		fired = true;
		const n = question.answers.length;
		onanswer({
			qid: question.id,
			input: '',
			answer: 'Out of time',
			display: '',
			score: 0,
			rank: n,
			total: n,
			timedOut: true
		});
	}

	$effect(() => {
		if (result) return;
		let start = loadTimerStart(date, question.id);
		if (start == null) {
			start = Date.now();
			saveTimerStart(date, question.id, start);
		}
		startedAt = start;
		const tick = () => {
			if (pausedAt != null) return;
			remaining = LIMIT - (Date.now() - startedAt) / 1000;
			if (remaining <= 0) timeOut();
		};
		tick();
		const id = setInterval(tick, 200);
		return () => clearInterval(id);
	});

	// Freeze the clock while the How to play popup is open.
	$effect(() => {
		if (paused) {
			pausedAt ??= Date.now();
		} else if (pausedAt != null) {
			startedAt += Date.now() - pausedAt;
			pausedAt = null;
			saveTimerStart(date, question.id, startedAt);
		}
	});

	let input = $state('');
	let message = $state('');
	let shake = $state(false);
	let shown = $state(0); // animated score counter
	let inputEl: HTMLInputElement | undefined = $state();

	const style = $derived(CATEGORY_STYLE[question.category]);
	const order = $derived(ranked(question));
	const best = $derived(order[0]);
	const worst = $derived(order[order.length - 1]);
	const verdict = $derived(result ? beeVerdict(result.score) : null);
	const SEGMENTS = 20;

	$effect(() => {
		if (!result && inputEl) setTimeout(() => inputEl?.focus({ preventScroll: true }), 50);
	});

	$effect(() => {
		if (!result) return;
		const target = result.score;
		const start = performance.now();
		let raf = 0;
		const tick = (now: number) => {
			const p = Math.min(1, (now - start) / 700);
			shown = Math.round(target * (1 - Math.pow(1 - p, 3)));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		// rAF pauses in background tabs; make sure the real score always lands.
		const fallback = setTimeout(() => (shown = target), 800);
		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(fallback);
		};
	});

	function submit(e: SubmitEvent) {
		e.preventDefault();
		if (!input.trim() || remaining <= 0) return;
		const m = findAnswer(question, input);
		if (m.kind !== 'ok') {
			message =
				m.kind === 'ambiguous'
					? `“${input.trim()}” could mean more than one thing — be more specific.`
					: `“${input.trim()}” isn't in the royal records. Check the spelling or try another — no sting!`;
			onmessage?.(
				m.kind === 'ambiguous' ? 'Which one, dear? Be more specific!' : "Never heard of it! Try again — no sting."
			);
			shake = true;
			setTimeout(() => (shake = false), 400);
			return;
		}
		const s = scoreAnswer(question, m.answer);
		onanswer({
			qid: question.id,
			input: input.trim(),
			answer: m.answer.name,
			display: display(question, m.answer),
			...s
		});
	}
</script>

<div class="pixel-box bg-hive-800 p-5 sm:p-7" style="--pb:{style.color}">
	<div class="flex items-center justify-between gap-2 font-pixel text-xs sm:text-sm">
		<span class="inline-flex items-center gap-2 px-2 py-1 text-hive-950" style="background:{style.color}">
			<PixelIcon category={question.category} size={18} />
			{question.category}
		</span>
		<span class="text-honey-300/70">Cell {number} / 6</span>
	</div>

	<h2 class="mt-5 font-pixel text-2xl leading-tight text-cream sm:text-3xl">
		{question.prompt}
	</h2>
	<p class="mt-3 inline-block bg-honey-400 px-2 py-1 font-pixel text-base text-hive-950 sm:text-lg">
		{question.twist}
	</p>

	{#if !result}
		<form class="mt-6" onsubmit={submit}>
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center" class:animate-shake={shake}>
				<div class="flex min-w-0 flex-1 items-center gap-3">
				<HexTimer {remaining} total={LIMIT} />
				<input
					bind:this={inputEl}
					bind:value={input}
					oninput={() => (message = '')}
					placeholder="type your answer…"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					aria-label="Your answer"
					class="pixel-box min-w-0 flex-1 bg-hive-950 px-4 py-3 font-mono text-lg text-cream outline-none placeholder:text-honey-200/30 [--pb:var(--color-hive-600)] focus:[--pb:var(--color-honey-400)]"
				/>
				</div>
				<button class="pixel-btn bg-honey-500 px-6 py-3 text-base text-hive-950" disabled={!input.trim()}>
					Lock in
				</button>
			</div>
			{#if message}
				<p class="mt-4 text-sm text-ruby" role="alert">{message}</p>
			{/if}		</form>
	{:else}
		<div class="mt-6">
			<div class="flex items-end justify-between gap-4">
				<div class="min-w-0">
					{#if !result.timedOut}<p class="font-pixel text-xs text-honey-200/60">You said</p>{/if}
					<p class="truncate font-pixel text-xl text-cream sm:text-2xl">{result.answer}</p>
					{#if result.display}<p class="text-sm text-honey-200/80">{result.display}</p>{/if}
				</div>
				<div class="shrink-0 text-right">
					<p class="title-glow text-5xl tabular-nums sm:text-6xl">{shown}</p>
					{#if !result.timedOut}<p class="font-pixel text-xs text-honey-300">{verdict?.title}</p>{/if}
				</div>
			</div>

			<!-- pixel meter -->
			<div class="mt-6">
				<div class="flex gap-[3px]" role="meter" aria-valuenow={result.score} aria-valuemin={0} aria-valuemax={100} aria-label="Score">
					{#each Array(SEGMENTS) as _, i (i)}
						{@const lit = (i + 1) * (100 / SEGMENTS) <= shown + 100 / SEGMENTS / 2}
						<span
							class="h-4 flex-1"
							style="background:{lit ? `hsl(${30 + i * 1.6} 100% ${50 + i * 0.6}%)` : '#3d2912'}"
						></span>
					{/each}
				</div>
				<div class="mt-2 flex justify-between gap-4 text-[11px] text-honey-200/60 sm:text-xs">
					<span>1 · {worst.name}</span>
					<span class="text-right">{best.name} · 100</span>
				</div>
			</div>

			{#if !result.timedOut}
				<p class="mt-4 text-sm text-honey-200/80">
					Ranked <b class="text-honey-400">#{result.rank}</b> of {result.total} answers in the royal records.
				</p>
			{/if}

			<details class="pixel-box mt-5 bg-hive-900 p-4 text-sm" style="--pb: var(--color-hive-600)">
				<summary class="cursor-pointer font-pixel text-xs text-honey-300">Top answers</summary>
				<ol class="mt-3 space-y-1">
					{#each order.slice(0, 5) as a, i (a.name)}
						<li class="flex justify-between gap-4 {a.name === result.answer ? 'text-honey-400' : 'text-cream/80'}">
							<span>{i + 1}. {a.name}</span>
							<span class="text-right text-honey-200/50">{display(question, a)}</span>
						</li>
					{/each}
				</ol>
			</details>

			<button onclick={onnext} class="pixel-btn mt-7 w-full bg-honey-500 py-4 text-lg text-hive-950">
				{isLast ? '👑 See your honey' : 'Next cell ▶'}
			</button>
		</div>
	{/if}
</div>
