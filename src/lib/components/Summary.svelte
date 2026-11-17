<script lang="ts">
	import { CATEGORY_STYLE, hiveRank, scoreSquare } from '../game';
	import type { Question, Result } from '../types';
	import PixelIcon from './PixelIcon.svelte';

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
		return `👑🐝 The Queen Bee #${puzzle}\n${total}/600 · ${hiveRank(total)}\n${lines.join('\n')}`;
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

<div class="pixel-box bg-hive-800 p-5 sm:p-7">
	<p class="text-center font-pixel text-xs tracking-widest text-honey-300/70">Hive #{puzzle} · harvest complete</p>
	<p class="title-glow mt-3 text-center text-7xl tabular-nums">{total}</p>
	<p class="mt-1 text-center text-sm text-honey-200/60">drops of honey out of 600</p>
	<p class="mt-4 text-center">
		<span class="inline-block bg-honey-400 px-3 py-1 font-pixel text-lg text-hive-950">{hiveRank(total)}</span>
	</p>

	<ul class="mt-7 space-y-4">
		{#each questions as q, i (q.id)}
			{@const r = results[i]}
			{@const s = CATEGORY_STYLE[q.category]}
			<li>
				<div class="flex items-center justify-between gap-3">
					<div class="min-w-0">
						<p class="flex items-center gap-1.5 text-xs text-honey-200/60">
							<PixelIcon category={q.category} size={14} />
							<span class="truncate">{q.prompt} — <span class="text-honey-300">{q.twist}</span></span>
						</p>
						<p class="truncate text-cream">
							<b>{r.answer}</b>
							{#if r.display}<span class="text-sm text-honey-200/50">· {r.display}</span>{/if}
						</p>
					</div>
					<span class="shrink-0 font-pixel text-2xl tabular-nums text-cream">{r.score}</span>
				</div>
				<div class="mt-1.5 h-2 bg-hive-700">
					<div class="h-full" style="width:{r.score}%; background:{s.color}"></div>
				</div>
			</li>
		{/each}
	</ul>

	<button onclick={share} class="pixel-btn mt-8 w-full bg-honey-500 py-4 text-lg text-hive-950">
		{copied ? 'Copied! 🐝' : 'Share your honey'}
	</button>

	<div class="mt-7 grid grid-cols-4 gap-2 text-center">
		{#each [['Played', stats.played], ['Average', stats.average], ['Best', stats.best], ['Streak', stats.streak]] as [label, value] (label)}
			<div class="bg-hive-900 py-3">
				<p class="font-pixel text-xl text-honey-400 sm:text-2xl">{value}</p>
				<p class="text-[10px] text-honey-200/60 uppercase sm:text-xs">{label}</p>
			</div>
		{/each}
	</div>

	{#if isToday}
		<p class="mt-6 text-center text-sm text-honey-200/70">
			New hive opens in <span class="font-pixel text-honey-400">{countdown}</span>
		</p>
	{/if}
</div>
