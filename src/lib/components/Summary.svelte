<script lang="ts">
	import { CATEGORY_STYLE, elfRank, scoreSquare } from '../game';
	import type { Question, Result } from '../types';
	import CategoryIcon from '../retro/CategoryIcon.svelte';

	let {
		questions,
		results,
		puzzle,
		isToday,
		stats
	}: {
		questions: Question[];
		results: Result[];
		puzzle: number;
		isToday: boolean;
		stats: { played: number; average: number; best: number; streak: number };
	} = $props();

	const total = $derived(results.reduce((a, r) => a + r.score, 0));
	let copied = $state(false);
	let countdown = $state('');

	$effect(() => {
		const tick = () => {
			const now = new Date();
			const next = new Date(now);
			next.setHours(24, 0, 0, 0);
			const s = Math.floor((next.getTime() - now.getTime()) / 1000);
			const p = (n: number) => String(n).padStart(2, '0');
			countdown = `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	});

	function shareText() {
		const lines = questions.map((q, i) => {
			const r = results[i];
			return `${CATEGORY_STYLE[q.category].emoji} ${scoreSquare(r.score)} ${r.score}`;
		});
		return `👑🧝 The Elf Queen #${puzzle}\n${total}/600 · ${elfRank(total)}\n${lines.join('\n')}`;
	}

	async function share() {
		const text = shareText();
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			prompt('Copy your results:', text);
		}
	}
</script>

<div class="window-rim">
	<div class="window px-5 py-7 sm:px-7">
		<p class="text-outline text-center font-retro text-sm tracking-[0.2em] text-cream">
			WORKSHOP #{puzzle} · ALL GIFTS WRAPPED
		</p>
		<p class="hud-num mt-3 text-center text-8xl leading-none tabular-nums">{total}</p>
		<p class="text-outline mt-2 text-center text-sm font-bold text-cream">Christmas cheer out of 600</p>
		<p class="mt-5 text-center">
			<span class="tile inline-block rounded-full px-5 py-1.5 font-retro text-xl text-ink" style="--c:#ffc21e; text-shadow:0 1px 0 rgb(255 255 255/0.6)">
				{elfRank(total)}
			</span>
		</p>

		<ul class="mt-8 space-y-3">
			{#each questions as q, i (q.id)}
				{@const r = results[i]}
				{@const s = CATEGORY_STYLE[q.category]}
				<li class="tile flex items-center gap-3 rounded-2xl py-2.5 pr-3 pl-2.5" style="--c:{s.color}">
					<CategoryIcon category={q.category} size={34} />
					<div class="min-w-0 flex-1">
						<p class="text-outline truncate text-xs font-bold text-white/90">
							{q.prompt} — {q.twist}
						</p>
						<p class="text-outline truncate text-base font-extrabold text-white">
							{r.answer}
							{#if r.display}<span class="text-sm font-bold text-white/80">· {r.display}</span>{/if}
						</p>
					</div>
					<span class="hud-num shrink-0 text-3xl tabular-nums">{r.score}</span>
				</li>
			{/each}
		</ul>

		<button onclick={share} class="btn-plastic mt-8 w-full rounded-full py-4 text-xl">
			{copied ? 'COPIED! 🧝' : 'SHARE YOUR CHEER'}
		</button>

		<div class="mt-7 grid grid-cols-4 gap-2 text-center">
			{#each [['Played', stats.played], ['Average', stats.average], ['Best', stats.best], ['Streak', stats.streak]] as [label, value] (label)}
				<div class="field rounded-xl py-3">
					<p class="hud-num text-2xl sm:text-3xl">{value}</p>
					<p class="text-[10px] font-bold tracking-wider text-cream uppercase sm:text-xs">{label}</p>
				</div>
			{/each}
		</div>

		{#if isToday}
			<p class="text-outline mt-6 text-center font-retro text-sm tracking-wide text-cream">
				NEW GIFTS ARRIVE IN <span class="hud-num text-lg">{countdown}</span>
			</p>
		{/if}
	</div>
</div>
