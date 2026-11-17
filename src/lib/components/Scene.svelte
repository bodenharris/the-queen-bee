<script lang="ts">
	import { FLOWER, FLOWER_PALETTE } from '../art';
	import QueenBee from './QueenBee.svelte';

	let {
		bubble = '',
		mood = 'idle',
		tall = false,
		showBee = true
	}: { bubble?: string; mood?: 'idle' | 'happy' | 'sad'; tall?: boolean; showBee?: boolean } = $props();

	const CLOUD = ['...WWW......', '..WWWWW.WW..', '.WWWWWWWWWW.', 'WWWWWWWWWWWW'];
	const flowers = [
		{ left: 6, petal: '#ff8fa3', s: 3 },
		{ left: 14, petal: '#ffffff', s: 2 },
		{ left: 27, petal: '#b892ff', s: 3 },
		{ left: 63, petal: '#ffffff', s: 2 },
		{ left: 72, petal: '#ff8fa3', s: 3 },
		{ left: 84, petal: '#ffd84a', s: 2 },
		{ left: 93, petal: '#b892ff', s: 3 }
	];
</script>

{#snippet sprite(map: string[], colors: Record<string, string>, scale: number)}
	<svg
		width={map[0].length * scale}
		height={map.length * scale}
		viewBox="0 0 {map[0].length} {map.length}"
		shape-rendering="crispEdges"
		aria-hidden="true"
	>
		{#each map as row, y (y)}
			{#each [...row] as ch, x (x)}
				{#if ch !== '.'}<rect {x} {y} width="1.02" height="1.02" fill={colors[ch]} />{/if}
			{/each}
		{/each}
	</svg>
{/snippet}

<div class="scene relative overflow-hidden {tall ? 'h-72 sm:h-80' : showBee ? 'h-44 sm:h-52' : 'h-28 sm:h-32'}">
	<!-- sun -->
	<div class="absolute top-5 right-[12%] h-12 w-12 bg-[#ffe680] shadow-[0_0_0_6px_#fff3b0,0_0_40px_10px_#ffd84a88]"></div>

	<!-- clouds -->
	<div class="cloud absolute top-6 left-[-10%] opacity-90" style="animation-duration: 70s">
		{@render sprite(CLOUD, { W: '#ffffff' }, 6)}
	</div>
	<div class="cloud absolute top-16 left-[30%] opacity-70" style="animation-duration: 95s; animation-delay: -40s">
		{@render sprite(CLOUD, { W: '#ffffff' }, 4)}
	</div>
	<div class="cloud absolute top-3 left-[60%] opacity-80" style="animation-duration: 120s; animation-delay: -20s">
		{@render sprite(CLOUD, { W: '#ffffff' }, 5)}
	</div>

	<!-- meadow -->
	<div class="meadow absolute inset-x-0 bottom-0 h-8"></div>
	{#each flowers as f (f.left)}
		<div class="absolute bottom-5" style="left:{f.left}%">
			{@render sprite(FLOWER, FLOWER_PALETTE(f.petal), f.s)}
		</div>
	{/each}

	<!-- mascot + speech bubble -->
	{#if showBee}
	<div class="absolute inset-x-0 {tall ? 'bottom-12' : 'bottom-8'} flex items-end justify-center gap-3 px-4">
		<QueenBee size={tall ? 120 : 84} {mood} />
		{#if bubble}
			{#key bubble}
				<div class="bubble pixel-box mb-8 max-w-[15rem] bg-[#fffaf0] px-3 py-2 font-mono text-xs leading-snug text-[#2b1a0c] sm:max-w-xs sm:text-sm">
					{bubble}
				</div>
			{/key}
		{/if}
	</div>
	{/if}
</div>

<style>
	.scene {
		background: linear-gradient(
			to bottom,
			#8fd3ff 0%,
			#8fd3ff 30%,
			#b8e4ff 30%,
			#b8e4ff 55%,
			#ffe2b8 55%,
			#ffe2b8 75%,
			#ffd09a 75%
		);
		image-rendering: pixelated;
	}
	.meadow {
		background:
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='8' shape-rendering='crispEdges'%3E%3Cpath fill='%2357b84a' d='M0 4h2V2h2v2h4V0h2v4h4V2h2v6H0z'/%3E%3C/svg%3E")
				repeat-x top / 32px 16px,
			linear-gradient(#57b84a, #57b84a) bottom / 100% 60% no-repeat;
		border-bottom: 4px solid #3f9a3a;
	}
	.cloud {
		animation: drift linear infinite;
	}
	@keyframes drift {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(120vw);
		}
	}
	.bubble {
		--pb: #2b1a0c;
		position: relative;
		animation: pop 0.25s steps(3);
	}
	.bubble::after {
		content: '';
		position: absolute;
		left: -10px;
		bottom: 6px;
		width: 8px;
		height: 8px;
		background: #fffaf0;
		box-shadow:
			-4px 4px 0 #fffaf0,
			0 -4px 0 #2b1a0c,
			-4px 0 0 #2b1a0c,
			-8px 4px 0 #2b1a0c,
			-4px 8px 0 #2b1a0c,
			0 4px 0 #2b1a0c;
	}
	@keyframes pop {
		from {
			transform: scale(0.6);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cloud,
		.bubble {
			animation: none;
		}
	}
</style>
