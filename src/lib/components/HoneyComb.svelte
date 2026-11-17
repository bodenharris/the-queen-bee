<script lang="ts">
	import { CATEGORY_STYLE } from '../game';
	import type { Question, Result } from '../types';
	import QueenBee from './QueenBee.svelte';
	import PixelIcon from './PixelIcon.svelte';

	let {
		questions,
		results,
		current,
		onpick,
		mood = 'idle',
		bubble = ''
	}: {
		questions: Question[];
		results: (Result | null)[];
		current: number | null;
		onpick: (i: number) => void;
		mood?: 'idle' | 'happy' | 'sad';
		bubble?: string;
	} = $props();

	const done = $derived(results.filter(Boolean).length);

	// Ring positions (pointy-top hexes), clockwise from the top-left,
	// in units of the centre-to-centre distance.
	const S = Math.sqrt(3) / 2;
	const RING: [number, number][] = [
		[-0.5, -S],
		[0.5, -S],
		[1, 0],
		[0.5, S],
		[-0.5, S],
		[-1, 0]
	];
	const pos = ([x, y]: [number, number]) =>
		`left: calc(50% + ${x} * var(--d) - var(--w) / 2); top: calc(50% + ${y} * var(--d) - var(--h) / 2);`;
</script>

<div class="comb relative flex flex-col items-center">
	<nav class="hive-ring relative" aria-label="Today's six questions">
		<!-- the queen's chamber -->
		<div class="cell absolute" style={pos([0, 0])}>
			<span class="hex absolute inset-0 bg-honey-400"></span>
			<span class="hex chamber absolute inset-[5px]"></span>
			<span class="relative grid h-full place-items-center pt-1">
				<QueenBee size={56} {mood} />
			</span>
		</div>

		{#each questions as q, i (q.id)}
			{@const r = results[i]}
			{@const playable = !!r || i === done}
			{@const s = CATEGORY_STYLE[q.category]}
			<button
				class="cell absolute"
				class:active={i === current}
				style={pos(RING[i])}
				disabled={!playable}
				onclick={() => onpick(i)}
				title="{q.category}{r ? ` — ${r.score}` : ''}"
				aria-label="{q.category}{r ? `, scored ${r.score}` : playable ? ', up next' : ', locked'}"
			>
				<span class="hex absolute inset-0" style="background:{i === current ? '#ffd84a' : s.color}"></span>
				<span class="hex absolute inset-[5px] bg-hive-800"></span>
				<span class="hex honey absolute inset-[5px]" style="--fill:{r ? r.score : 0}%"></span>
				<span class="relative flex h-full flex-col items-center justify-center gap-0.5 leading-none">
					<span class="icon"><PixelIcon category={q.category} size={24} dim={!playable} /></span>
					<span class="font-pixel text-[8px] text-cream/80 uppercase [text-shadow:0_1px_0_#140c05] sm:text-[9px]">
						{q.category}
					</span>
					<span class="font-pixel text-sm text-cream [text-shadow:0_2px_0_#140c05] sm:text-base">
						{r ? r.score : i === done ? '?' : '·'}
					</span>
				</span>
			</button>
		{/each}
	</nav>

	{#if bubble}
		{#key bubble}
			<p class="speech pixel-box bg-cream px-4 py-2 font-mono text-sm leading-snug text-hive-950" aria-live="polite">
				{bubble}
			</p>
		{/key}
	{/if}
</div>

<style>
	.comb {
		--w: 84px;
		--gap: 6px;
		--h: calc(var(--w) * 1.1547);
		--d: calc(var(--w) + var(--gap));
	}
	@media (min-width: 640px) {
		.comb {
			--w: 108px;
		}
	}
	.hive-ring {
		width: calc(2 * var(--d) + var(--w));
		height: calc(1.7321 * var(--d) + var(--h));
	}
	.cell {
		width: var(--w);
		height: var(--h);
	}
	.icon {
		filter: drop-shadow(0 2px 0 #140c05);
	}
	@media (min-width: 640px) {
		.icon :global(svg) {
			width: 30px;
			height: 30px;
		}
	}
	.hex {
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	}
	.chamber {
		background: radial-gradient(circle at 50% 45%, #5a3d1a, #2c1d0d 70%);
	}
	.honey {
		background: linear-gradient(to top, #e8960c 0, #ffc928 var(--fill), transparent var(--fill));
	}
	button.cell:disabled {
		cursor: default;
	}
	button.cell:not(:disabled):hover {
		filter: brightness(1.15);
	}
	button.cell.active {
		animation: pulse 1.2s steps(2) infinite;
		z-index: 1;
	}
	@keyframes pulse {
		50% {
			transform: scale(1.05);
		}
	}
	.speech {
		--pb: var(--color-honey-400);
		position: relative;
		margin-top: 20px;
		max-width: 24rem;
		text-align: center;
		animation: pop 0.25s steps(3);
	}
	/* Wide screens: bubble sits beside the hive, pointing left at it. */
	@media (min-width: 900px) {
		.speech {
			position: absolute;
			margin: 0;
			top: 50%;
			translate: 0 -50%;
			left: calc(50% + var(--d) + var(--w) / 2 + 24px);
			width: 15rem;
			text-align: left;
		}
		.speech::before {
			left: -8px !important;
			top: 50% !important;
			margin: -4px 0 0 0 !important;
			box-shadow:
				0 -4px 0 var(--color-honey-400),
				0 4px 0 var(--color-honey-400),
				-4px 0 0 var(--color-honey-400) !important;
		}
	}
	/* stepped pointer up toward the queen */
	.speech::before {
		content: '';
		position: absolute;
		left: 50%;
		top: -8px;
		width: 8px;
		height: 8px;
		margin-left: -4px;
		background: var(--color-cream);
		box-shadow:
			-4px 0 0 var(--color-honey-400),
			4px 0 0 var(--color-honey-400),
			0 -4px 0 var(--color-honey-400);
	}
	@keyframes pop {
		from {
			transform: scale(0.7);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		button.cell.active,
		.speech {
			animation: none;
		}
	}
</style>
