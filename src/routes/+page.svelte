<script lang="ts">
	import { page } from '$app/state';
	import { elfVerdict, dailyQuestions, elfRank, puzzleNumber, todayKey } from '../lib/game';
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
	import Logo3D from '../lib/retro/Logo3D.svelte';
	import GiftRing from '../lib/components/GiftRing.svelte';
	import Elf3D from '../lib/retro/Elf3D.svelte';

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
		if (showSummary && finished) return `${total} Christmas cheer! You are a true ${elfRank(total).replace(' 👑', '')}.`;
		if (override) return override;
		const r = results[current];
		if (r) return r.timedOut ? 'Too slow, darling! The sleigh left without that one.' : elfVerdict(r.score).line;
		return '';
	});
	const mood = $derived.by(() => {
		if (!started) return 'idle' as const;
		if (showSummary && finished) return total >= 350 ? ('happy' as const) : ('idle' as const);
		const r = results[current];
		return r ? elfVerdict(r.score).mood : ('idle' as const);
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
	<title>The Elf Queen — daily trivia with a twist</title>
</svelte:head>

{#snippet cheerStar(cls: string)}
	<!-- Flat-shaded gold star pickup -->
	<svg viewBox="0 0 40 40" class={cls} aria-hidden="true">
		<polygon points="20,2 25,15 20,20 15,15" fill="#fff3a0" />
		<polygon points="38,15 28,24 20,20 25,15" fill="#ffc21e" />
		<polygon points="31,37 20,30 20,20 28,24" fill="#c46a00" />
		<polygon points="9,37 12,24 20,20 20,30" fill="#e08a00" />
		<polygon points="2,15 15,15 20,20 12,24" fill="#ffe066" />
		<polygon points="20,2 25,15 38,15 28,24 31,37 20,30 9,37 12,24 2,15 15,15" fill="none" stroke="#1a0d08" stroke-width="2.5" stroke-linejoin="round" />
	</svg>
{/snippet}

{#if !started}
	<!-- ───────────── Title screen ───────────── -->
	<main class="flex min-h-screen flex-col items-center px-4 pt-5 pb-4 text-center sm:pt-7">
		<div class="w-full max-w-2xl">
			<p class="text-gold font-retro text-2xl tracking-[0.4em] sm:text-3xl">THE</p>
			<Logo3D text="ELF QUEEN" label="The Elf Queen" />
		</div>

		<div class="-mt-3 sm:-mt-6">
			<Elf3D size={124} />
		</div>

		<!-- Pinned to the bottom so the fire stays visible in the middle of the screen -->
		<div class="mt-auto flex w-full flex-col items-center pt-44">
			<p class="text-outline font-retro text-lg tracking-[0.35em] text-[#7fe6ff] sm:text-xl">THE DAILY JINGLE</p>
			<p class="text-outline mt-1 max-w-xl text-sm font-bold text-cream sm:text-base">
				6 easy prompts · 30 seconds each · the twist decides your cheer
			</p>

			<button onclick={start} class="btn-plastic mt-4 flex w-full max-w-sm items-center justify-center gap-3 rounded-full py-3.5 text-2xl">
				<span class="cursor-blink" aria-hidden="true">▶</span>
				{finished ? 'VIEW YOUR CHEER' : done > 0 ? 'CONTINUE' : 'PRESS START'}
			</button>

			<div class="mt-5 flex flex-wrap items-center justify-center gap-3">
				<button class="btn-chrome rounded-full px-5 py-2 text-sm" onclick={() => (showHelp = true)}>HOW TO PLAY</button>
				{#if puzzleNumber(prevDate) >= 1}
					<a href="?date={prevDate}" onclick={start} class="btn-chrome rounded-full px-5 py-2 text-sm">◀ ARCHIVE</a>
				{/if}
				<p class="text-outline font-retro text-sm tracking-widest text-cream">
					WORKSHOP <span class="hud-num text-lg">#{puzzle}</span> · {dateLabel.toUpperCase()}
				</p>
			</div>
		</div>
	</main>
{:else}
	<!-- ───────────── Game ───────────── -->
	<div class="min-h-screen px-4 pt-4 pb-14">
		<header class="flex items-start justify-between gap-3">
			<button class="text-left" onclick={() => (started = false)} title="Back to title">
				<span class="text-gold block font-retro text-lg leading-tight sm:text-xl">THE ELF QUEEN</span>
				<span class="text-outline block text-xs font-bold tracking-wider text-cream">
					#{puzzle} · {dateLabel.toUpperCase()}
				</span>
			</button>
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-1.5" aria-label="{total} Christmas cheer">
					{@render cheerStar('h-9 w-9')}
					<span class="hud-num text-3xl tabular-nums">×{String(total).padStart(3, '0')}</span>
				</div>
				<button
					onclick={() => (showHelp = true)}
					class="btn-chrome grid size-10 place-items-center rounded-full text-lg"
					aria-label="How to play">?</button
				>
			</div>
		</header>

		<!-- archive navigation, tucked into the top-left corner -->
		<nav class="text-outline mt-3 flex flex-wrap items-center gap-3 font-retro text-xs tracking-wider text-cream" aria-label="Archive">
			{#if !isToday}
				{#if puzzleNumber(prevDate) >= 1}<a href="?date={prevDate}" class="hover:text-gold">◀ OLDER</a>{/if}
				<span class="opacity-60">ARCHIVE WORKSHOP</span>
				<a href={nextDate === today ? '/' : `?date=${nextDate}`} class="hover:text-gold">NEWER ▶</a>
				<a href="/" class="text-gold underline">TODAY</a>
			{:else if puzzleNumber(prevDate) >= 1}
				<a href="?date={prevDate}" class="hover:text-gold">◀ PLAY YESTERDAY'S GIFTS</a>
			{/if}
		</nav>

		<main class="mx-auto mt-2 max-w-xl">
			<GiftRing {questions} {results} current={showSummary ? null : current} onpick={go} {mood} bubble={speech} />

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

			<footer class="text-outline mt-10 text-center font-retro text-xs tracking-widest text-cream/80">
				NEW GIFTS ARRIVE EVERY DAY AT MIDNIGHT
			</footer>
		</main>
	</div>
{/if}

{#if showHelp}
	<div
		class="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4"
		role="presentation"
		onclick={(e) => e.target === e.currentTarget && closeHelp()}
	>
		<div class="window-rim w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="help-title">
			<div class="window max-h-[85vh] overflow-y-auto px-6 py-6 sm:px-7">
				<div class="flex items-center gap-3">
					<Elf3D size={64} />
					<h2 id="help-title" class="text-gold font-retro text-3xl">HOW TO PLAY</h2>
				</div>
				<p class="text-outline mt-4 text-sm font-bold text-white/95">
					Every day Her Majesty sets <span class="text-gold">six easy prompts</span>, one each from Geography,
					Sports, Movies/TV, History, Food and Science.
				</p>
				<p class="text-outline mt-3 text-sm font-bold text-white/95">
					The catch: each one has a <span class="text-gold">twist</span>. Any real answer counts, but you earn
					<span class="text-gold">0–100 Christmas cheer</span> depending on how well it fits the twist.
				</p>
				<div class="field mt-4 rounded-xl p-4 text-sm">
					<p class="text-gold font-retro text-lg">Name a country</p>
					<p class="tile mt-1 inline-block rounded-lg px-2 py-0.5 font-retro text-sm text-ink" style="--c:#ffc21e">
						smaller is better
					</p>
					<ul class="mt-3 space-y-1 font-bold text-cream">
						<li>Russia → <span class="hud-num">1</span></li>
						<li>France → <span class="hud-num">20</span></li>
						<li>Singapore → <span class="hud-num">81</span></li>
						<li>Vatican City → <span class="hud-num">100</span> 👑</li>
					</ul>
				</div>
				<p class="text-outline mt-4 text-sm font-bold text-white/95">
					You have <span class="text-gold">30 seconds</span> per gift. The hexagon next to the answer box counts down.
					Run out of time and that gift scores 0. If the workshop doesn't recognize an answer, just try another. Fill all
					six gifts for up to 600 cheer.
				</p>
				<button onclick={closeHelp} class="btn-plastic mt-6 w-full rounded-full py-3 text-xl">LET'S JINGLE ▶</button>
			</div>
		</div>
	</div>
{/if}
