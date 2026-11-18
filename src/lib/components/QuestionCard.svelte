<script lang="ts">
	import { CATEGORY_STYLE, elfVerdict, display, findAnswer, ranked, scoreAnswer } from '../game';
	import type { Question, Result } from '../types';
	import CategoryIcon from '../retro/CategoryIcon.svelte';
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
	const verdict = $derived(result ? elfVerdict(result.score) : null);
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
					: `“${input.trim()}” isn't on the Nice List. Check the spelling or try another — no coal!`;
			onmessage?.(
				m.kind === 'ambiguous' ? 'Which one, dear? Be more specific!' : "Never heard of it! Try again — no coal."
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

<div class="window-rim">
	<div class="window px-5 py-6 sm:px-7 sm:py-7">
		<div class="flex items-center justify-between gap-2">
			<span
				class="tile inline-flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1.5 font-retro text-sm tracking-wide text-white [text-shadow:0_2px_0_rgb(0_0_0/0.6)]"
				style="--c:{style.color}"
			>
				<CategoryIcon category={question.category} size={26} />
				{question.category}
			</span>
			<span class="text-outline font-retro text-sm tracking-wider text-cream">
				GIFT <span class="hud-num text-lg">{number}</span>/6
			</span>
		</div>

		<h2 class="text-gold mt-6 font-retro text-3xl leading-tight sm:text-4xl">
			{question.prompt}
		</h2>
		<p
			class="tile mt-4 inline-block rounded-xl px-3.5 py-1.5 font-retro text-lg tracking-wide text-ink sm:text-xl"
			style="--c:#ffc21e; text-shadow: 0 1px 0 rgb(255 255 255 / 0.6)"
		>
			{question.twist}
		</p>

		{#if !result}
			<form class="mt-7" onsubmit={submit}>
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center" class:animate-shake={shake}>
					<div class="flex min-w-0 flex-1 items-center gap-3">
						<HexTimer {remaining} total={LIMIT} />
						<input
							bind:this={inputEl}
							bind:value={input}
							oninput={() => (message = '')}
							placeholder="Enter your answer..."
							autocomplete="off"
							autocapitalize="off"
							spellcheck="false"
							aria-label="Your answer"
							class="field min-w-0 flex-1 rounded-xl px-4 py-3 text-lg font-bold text-[#fff6a8] placeholder:text-mute"
						/>
					</div>
					<button class="btn-plastic rounded-full px-7 py-3 text-lg" disabled={!input.trim()}>LOCK IN</button>
				</div>
				{#if message}
					<p class="text-outline mt-4 text-sm font-bold text-[#ff9ab0]" role="alert">{message}</p>
				{/if}
			</form>
		{:else}
			<div class="mt-7">
				<div class="flex items-end justify-between gap-4">
					<div class="min-w-0">
						{#if !result.timedOut}<p class="text-outline font-retro text-xs tracking-widest text-cream">YOU SAID</p>{/if}
						<p class="text-outline truncate font-retro text-2xl text-white sm:text-3xl">{result.answer}</p>
						{#if result.display}<p class="text-outline text-sm font-bold text-[#fff6a8]">{result.display}</p>{/if}
					</div>
					<div class="shrink-0 text-right">
						<p class="hud-num text-6xl leading-none tabular-nums sm:text-7xl">{shown}</p>
						{#if !result.timedOut}<p class="text-outline mt-1 font-retro text-sm text-gold">{verdict?.title}</p>{/if}
					</div>
				</div>

				<!-- Segmented plastic meter -->
				<div class="mt-6">
					<div
						class="meter flex gap-[3px] rounded-full p-[3px]"
						role="meter"
						aria-valuenow={result.score}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label="Score"
					>
						{#each Array(SEGMENTS) as _, i (i)}
							{@const lit = (i + 1) * (100 / SEGMENTS) <= shown + 100 / SEGMENTS / 2}
							<span
								class="seg h-4 flex-1 first:rounded-l-full last:rounded-r-full"
								class:lit
								style="--c:hsl({10 + i * 2.6} 100% {52 + i * 0.5}%)"
							></span>
						{/each}
					</div>
					<div class="text-outline mt-2 flex justify-between gap-4 text-xs font-bold text-cream">
						<span>1 · {worst.name}</span>
						<span class="text-right">{best.name} · 100</span>
					</div>
				</div>

				{#if !result.timedOut}
					<p class="text-outline mt-4 text-sm font-bold text-cream">
						Ranked <span class="hud-num text-base">#{result.rank}</span> of {result.total} answers on the Nice List.
					</p>
				{/if}

				<details class="field mt-5 rounded-xl px-4 py-3 text-sm">
					<summary class="cursor-pointer font-retro tracking-wide text-gold">TOP ANSWERS</summary>
					<ol class="mt-3 space-y-1 font-bold">
						{#each order.slice(0, 5) as a, i (a.name)}
							<li class="flex justify-between gap-4 {a.name === result.answer ? 'text-gold' : 'text-white/85'}">
								<span>{i + 1}. {a.name}</span>
								<span class="text-right text-cream/80">{display(question, a)}</span>
							</li>
						{/each}
					</ol>
				</details>

				<button onclick={onnext} class="btn-plastic mt-7 w-full rounded-full py-4 text-xl">
					{isLast ? 'SEE YOUR CHEER ▶' : 'NEXT GIFT ▶'}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.meter {
		background: linear-gradient(180deg, #07170f, #123326);
		box-shadow:
			inset 0 2px 4px rgb(0 0 0 / 0.8),
			0 0 0 2px var(--color-ink);
	}
	.seg {
		background: #1f4a3a;
		box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.35);
	}
	.seg.lit {
		background:
			linear-gradient(180deg, rgb(255 255 255 / 0.6) 0%, rgb(255 255 255 / 0.1) 45%, rgb(0 0 0 / 0.2) 100%),
			var(--c);
		box-shadow: 0 0 6px var(--c);
	}
</style>
