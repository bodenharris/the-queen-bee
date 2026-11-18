<script lang="ts">
	import { CATEGORY_STYLE } from '../game';
	import type { Question, Result } from '../types';
	import Bee3D from '../retro/Bee3D.svelte';
	import CategoryIcon from '../retro/CategoryIcon.svelte';

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
		<!-- The queen's chamber: chrome rim, glass, and the 3D queen -->
		<div class="cell absolute" style={pos([0, 0])}>
			<span class="hex absolute inset-0 bg-ink"></span>
			<span class="hex chrome absolute inset-[3px]"></span>
			<span class="hex glass absolute inset-[8px]"></span>
			<span class="relative grid h-full place-items-center">
				<Bee3D size={72} {mood} />
			</span>
		</div>

		{#each questions as q, i (q.id)}
			{@const r = results[i]}
			{@const playable = !!r || i === done}
			{@const s = CATEGORY_STYLE[q.category]}
			<button
				class="cell absolute"
				class:active={i === current}
				class:locked={!playable}
				style="{pos(RING[i])} --c:{i === current ? '#ffd23e' : s.color}"
				disabled={!playable}
				onclick={() => onpick(i)}
				title="{q.category}{r ? ` — ${r.score}` : ''}"
				aria-label="{q.category}{r ? `, scored ${r.score}` : playable ? ', up next' : ', locked'}"
			>
				<span class="hex absolute inset-0 bg-ink"></span>
				<span class="hex rim absolute inset-[3px]"></span>
				<span class="hex glass absolute inset-[8px]"></span>
				<span class="hex honey absolute inset-[8px]" style="--fill:{r ? r.score : 0}%"></span>
				<span class="hex gloss absolute inset-[8px]"></span>
				<span class="relative flex h-full flex-col items-center justify-center gap-0.5 leading-none">
					<CategoryIcon category={q.category} size={30} dim={!playable} />
					<span class="text-outline font-y2k text-[9px] font-extrabold tracking-wide uppercase sm:text-[10px]">
						{q.category}
					</span>
					<span class="hud-num text-base sm:text-lg">
						{r ? r.score : i === done ? '?' : ''}
					</span>
				</span>
			</button>
		{/each}
	</nav>

	{#if bubble}
		{#key bubble}
			<div class="speech window-rim" aria-live="polite">
				<p class="window text-outline px-4 py-3 pr-7 font-y2k text-sm leading-snug font-bold sm:text-base">
					{bubble}
					<span class="cursor-blink absolute right-4 bottom-2.5 text-xs text-gold" aria-hidden="true">▼</span>
				</p>
			</div>
		{/key}
	{/if}
</div>

<style>
	.comb {
		--w: 88px;
		--gap: 4px;
		--h: calc(var(--w) * 1.1547);
		--d: calc(var(--w) + var(--gap));
	}
	@media (min-width: 640px) {
		.comb {
			--w: 110px;
		}
	}
	.hive-ring {
		width: calc(2 * var(--d) + var(--w));
		height: calc(1.7321 * var(--d) + var(--h));
	}
	.cell {
		width: var(--w);
		height: var(--h);
		filter: drop-shadow(0 5px 0 rgb(26 13 8 / 0.7));
	}
	.hex {
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	}
	/* Candy plastic rim in the category colour */
	.rim {
		background:
			linear-gradient(180deg, rgb(255 255 255 / 0.55) 0%, rgb(255 255 255 / 0.1) 40%, rgb(0 0 0 / 0.15) 60%, rgb(0 0 0 / 0.4) 100%),
			var(--c);
	}
	.chrome {
		background: linear-gradient(160deg, #ffffff 0%, #ffe39a 20%, #7a3418 45%, #fff2c8 60%, #a8481e 80%, #ffffff 100%);
	}
	/* Recessed dark glass behind the honey */
	.glass {
		background: radial-gradient(ellipse at 50% 30%, #1f6a50 0%, #10392c 60%, #081f19 100%);
		box-shadow: inset 0 4px 8px rgb(0 0 0 / 0.7);
	}
	/* Honey fills from the bottom up to the score, with a bright surface line */
	.honey {
		background: linear-gradient(
			to top,
			#c25a00 0%,
			#ffb21e calc(var(--fill) - 6%),
			#fff0a0 calc(var(--fill) - 1%),
			transparent var(--fill)
		);
	}
	/* Glossy plastic highlight across the top half */
	.gloss {
		background: linear-gradient(180deg, rgb(255 255 255 / 0.35) 0%, rgb(255 255 255 / 0.05) 45%, transparent 50%);
		pointer-events: none;
	}
	.cell.locked .rim {
		filter: saturate(0.35) brightness(0.65);
	}
	button.cell:disabled {
		cursor: default;
	}
	button.cell:not(:disabled):hover {
		filter: drop-shadow(0 5px 0 rgb(26 13 8 / 0.7)) brightness(1.12);
	}
	button.cell.active {
		animation: bob 1.1s ease-in-out infinite;
		z-index: 1;
		filter: drop-shadow(0 5px 0 rgb(26 13 8 / 0.7)) drop-shadow(0 0 14px rgb(255 210 62 / 0.75));
	}
	@keyframes bob {
		50% {
			transform: translateY(-5px);
		}
	}

	/* N64 dialog box */
	.speech {
		position: relative;
		margin-top: 22px;
		max-width: 24rem;
		animation: pop 0.2s ease-out;
	}
	.speech p {
		position: relative;
	}
	@media (min-width: 900px) {
		.speech {
			position: absolute;
			margin: 0;
			top: 50%;
			translate: 0 -50%;
			left: calc(50% + var(--d) + var(--w) / 2 + 26px);
			width: 16rem;
		}
	}
	@keyframes pop {
		from {
			transform: scale(0.85);
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
