<script lang="ts">
	import { page } from '$app/state';
	import { beeVerdict, dailyQuestions, hiveRank, puzzleNumber, todayKey } from '../lib/game';
	import {
		hasSeenHelp,
		loadDay,
		markSeenHelp,
		recordFinished,
		saveDay,
		stats as loadStats
	} from '../lib/storage';
	import type { Result } from '../lib/types';
	import QuestionCard from '../lib/components/QuestionCard.svelte';
	import Summary from '../lib/components/Summary.svelte';
	import Scene from '../lib/components/Scene.svelte';
	import HoneyComb from '../lib/components/HoneyComb.svelte';
	import QueenBee from '../lib/components/QueenBee.svelte';

	const today = todayKey();
	const requested = $derived(page.url.searchParams.get('date'));
	// Archive play via ?date=YYYY-MM-DD (never the future, never before puzzle #1).
	const date = $derived(
		requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested <= today && puzzleNumber(requested) >= 1
			? requested
			: today
	);
	const isToday = $derived(date === today);
	const puzzle = $derived(puzzleNumber(date));
	const questions = $derived(dailyQuestions(date));

	let results = $state<(Result | null)[]>([]);
	let current = $state(0);
	let showSummary = $state(false);
	let showHelp = $state(false);
	let started = $state(false);
	let override = $state(''); // temporary thing the queen says (e.g. unknown answer)

	$effect(() => {
		const saved = loadDay(date);
		const loaded = questions.map((q, i) => (saved[i]?.qid === q.id ? saved[i] : null));
		results = loaded;
		const firstOpen = loaded.findIndex((r) => !r);
		current = firstOpen === -1 ? 5 : firstOpen;
		showSummary = firstOpen === -1;
	});

	const done = $derived(results.filter(Boolean).length);
	const total = $derived(results.reduce((a, r) => a + (r?.score ?? 0), 0));
	const finished = $derived(done === 6);

	function answer(r: Result) {
		results[current] = r;
		override = '';
		saveDay(date, $state.snapshot(results));
		if (results.every(Boolean)) recordFinished(date, total);
	}

	function go(i: number) {
		current = i;
		showSummary = false;
		override = '';
	}

	function next() {
		override = '';
		if (current < 5) current++;
		else showSummary = true;
	}

	function start() {
		started = true;
		if (!hasSeenHelp()) showHelp = true;
		window.scrollTo({ top: 0 });
	}

	function shiftDate(days: number) {
		const d = new Date(date + 'T12:00:00');
		d.setDate(d.getDate() + days);
		return todayKey(d);
	}
	const prevDate = $derived(shiftDate(-1));
	const nextDate = $derived(shiftDate(1));

	function closeHelp() {
		showHelp = false;
		markSeenHelp();
	}

	// What Her Majesty is saying right now.
	const speech = $derived.by(() => {
		if (!started) return '';
		if (showSummary && finished) return `${total} drops of honey! You are a true ${hiveRank(total).replace(' 👑', '')}.`;
		if (override) return override;
		const r = results[current];
		if (r) return r.timedOut ? 'Too slow, darling! The nectar dried up — no honey for that one.' : beeVerdict(r.score).line;
		return '';
	});
	const mood = $derived.by(() => {
		if (!started) return 'idle' as const;
		if (showSummary && finished) return total >= 350 ? ('happy' as const) : ('idle' as const);
		const r = results[current];
		return r ? beeVerdict(r.score).mood : ('idle' as const);
	});

	const dateLabel = $derived(
		new Date(date + 'T12:00:00').toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		})
	);
</script>

<svelte:head>
	<title>The Queen Bee — daily trivia with a twist</title>
</svelte:head>

{#if !started}
	<!-- ───────────── Title screen ───────────── -->
	<div class="flex min-h-screen flex-col">
		<div class="relative">
			<Scene tall />
			<div class="pointer-events-none absolute inset-x-0 top-6 text-center sm:top-8">
				<h1 class="title-glow text-4xl leading-none sm:text-6xl">The Queen Bee</h1>
			</div>
		</div>
		<main class="hive flex-1 px-4 pt-8 pb-12 text-center">
			<div class="mx-auto max-w-lg">
				<p class="font-pixel text-lg tracking-[0.3em] text-sapphire sm:text-xl">The daily buzz</p>
				<p class="mt-3 text-sm text-honey-200/70">
					6 easy prompts · 30 seconds each · the twist decides your honey
				</p>

				<button onclick={start} class="pixel-btn mt-10 w-full bg-honey-500 py-5 text-xl text-hive-950 sm:text-2xl">
					{finished ? '👑 View your honey' : done > 0 ? '▶ Return to the hive' : '▶ Enter the hive'}
				</button>

				<div class="mt-6 flex flex-wrap items-center justify-between gap-3 font-pixel text-xs text-honey-300/80">
					<span>Hive #{puzzle} · {dateLabel}</span>
					<div class="flex gap-3">
						<button
							class="pixel-box bg-hive-800 px-3 py-2 hover:text-honey-400"
							style="--pb: var(--color-hive-600)"
							onclick={() => (showHelp = true)}>How to play</button
						>
						{#if puzzleNumber(prevDate) >= 1}
							<a
								href="?date={prevDate}"
								onclick={start}
								class="pixel-box bg-hive-800 px-3 py-2 hover:text-honey-400"
								style="--pb: var(--color-hive-600)">Archive ◀</a
							>
						{/if}
					</div>
				</div>
			</div>
		</main>
	</div>
{:else}
	<!-- ───────────── Game ───────────── -->
	<div class="flex min-h-screen flex-col">
		<div class="relative">
			<Scene showBee={false} />
			<header class="absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
				<button
					class="pixel-box bg-hive-900/90 px-2 py-1 text-left"
					style="--pb: var(--color-hive-950)"
					onclick={() => (started = false)}
					title="Back to title"
				>
					<span class="block font-pixel text-sm text-honey-400 sm:text-base">The Queen Bee</span>
					<span class="block text-[11px] text-honey-200/70">#{puzzle} · {dateLabel}</span>
				</button>
				<div class="flex items-start gap-2">
					<div class="pixel-box bg-hive-900/90 px-3 py-1 text-right" style="--pb: var(--color-hive-950)">
						<span class="block font-pixel text-lg leading-tight text-honey-400 tabular-nums">{total}</span>
						<span class="block text-[10px] text-honey-200/70 uppercase">honey</span>
					</div>
					<button
						onclick={() => (showHelp = true)}
						class="pixel-box grid h-10 w-10 place-items-center bg-hive-900/90 font-pixel text-honey-400"
						style="--pb: var(--color-hive-950)"
						aria-label="How to play">?</button
					>
				</div>
			</header>
		</div>

		<main class="hive flex-1 px-4 pt-4 pb-12">
			<!-- archive navigation, tucked into the top-left corner -->
			<div class="flex flex-wrap items-center gap-3 font-pixel text-xs text-honey-300/80">
				{#if !isToday}
					{#if puzzleNumber(prevDate) >= 1}<a href="?date={prevDate}" class="hover:text-honey-400">◀ Older</a>{/if}
					<span class="text-honey-300/50">Archive hive</span>
					<a href={nextDate === today ? '/' : `?date=${nextDate}`} class="hover:text-honey-400">Newer ▶</a>
					<a href="/" class="text-honey-400 underline">Today</a>
				{:else if puzzleNumber(prevDate) >= 1}
					<a href="?date={prevDate}" class="hover:text-honey-400">◀ Play yesterday's hive</a>
				{/if}
			</div>

			<div class="mx-auto mt-2 max-w-xl">
				<HoneyComb
					{questions}
					{results}
					current={showSummary ? null : current}
					onpick={go}
					{mood}
					bubble={speech}
				/>

				<section class="mt-8">
					{#if showSummary && finished}
						<Summary {questions} results={results as Result[]} {puzzle} {isToday} stats={loadStats(today)} />
					{:else}
						{#key `${date}-${current}`}
							<QuestionCard
								question={questions[current]}
								number={current + 1}
								result={results[current]}
								onanswer={answer}
								onnext={next}
								onmessage={(t) => (override = t)}
								isLast={finished}
								{date}
								paused={showHelp}
							/>
						{/key}
					{/if}
				</section>

				<footer class="mt-10 text-center text-[11px] text-honey-200/40">
					A new hive opens every day at midnight
				</footer>
			</div>
		</main>
	</div>
{/if}

{#if showHelp}
	<div
		class="fixed inset-0 z-40 grid place-items-center bg-hive-950/80 p-4"
		role="presentation"
		onclick={(e) => e.target === e.currentTarget && closeHelp()}
	>
		<div class="pixel-box max-h-[90vh] w-full max-w-md overflow-y-auto bg-hive-800 p-6 sm:p-7" role="dialog" aria-modal="true" aria-labelledby="help-title">
			<div class="flex items-center gap-3">
				<QueenBee size={56} />
				<h2 id="help-title" class="font-pixel text-2xl text-honey-400">How to play</h2>
			</div>
			<p class="mt-4 text-sm text-cream/90">
				Every day Her Majesty sets <b class="text-honey-400">six easy prompts</b> — one each from Geography, Sports,
				Movies/TV, History, Food and Science.
			</p>
			<p class="mt-3 text-sm text-cream/90">
				The catch: each one has a <b class="text-honey-400">twist</b>. Any real answer counts, but you earn
				<b class="text-honey-400">0–100 drops of honey</b> depending on how well it fits the twist.
			</p>
			<div class="mt-4 bg-hive-950 p-4 text-sm">
				<p class="font-pixel text-cream">Name a country</p>
				<p class="mt-1 inline-block bg-honey-400 px-1.5 font-pixel text-xs text-hive-950">smaller is better</p>
				<ul class="mt-3 space-y-1 text-honey-200/80">
					<li>Russia → <b class="text-cream">1</b></li>
					<li>France → <b class="text-cream">20</b></li>
					<li>Singapore → <b class="text-cream">81</b></li>
					<li>Vatican City → <b class="text-honey-400">100</b> 👑</li>
				</ul>
			</div>
			<p class="mt-4 text-sm text-cream/90">
				You have <b class="text-honey-400">30 seconds</b> per cell — the hexagon next to the answer box counts down. Run out of time and that cell scores 0. If the hive doesn't recognize an answer, just try another — no sting. Fill all six cells for up to
				600 honey.
			</p>
			<button onclick={closeHelp} class="pixel-btn mt-7 w-full bg-honey-500 py-3 text-lg text-hive-950">
				Let's buzz
			</button>
		</div>
	</div>
{/if}
