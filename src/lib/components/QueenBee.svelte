<script lang="ts">
	import { BEE, BEE_H, BEE_W, pixels } from '../art';

	let {
		size = 96,
		mood = 'idle'
	}: { size?: number; mood?: 'idle' | 'happy' | 'sad' } = $props();

	const px = pixels(BEE);
	const body = px.filter((p) => !p.wing);
	const wings = px.filter((p) => p.wing);
</script>

<div class="bee {mood}" style="width:{size}px">
	<svg
		viewBox="-1 -1 {BEE_W + 2} {BEE_H + 2}"
		width={size}
		height={(size * (BEE_H + 2)) / (BEE_W + 2)}
		shape-rendering="crispEdges"
		role="img"
		aria-label="The Queen Bee, a bee wearing a royal crown"
	>
		<g class="wings">
			{#each wings as p (p.x + ',' + p.y)}
				<rect x={p.x} y={p.y} width="1.02" height="1.02" fill={p.c} opacity="0.9" />
			{/each}
		</g>
		{#each body as p (p.x + ',' + p.y)}
			<rect x={p.x} y={p.y} width="1.02" height="1.02" fill={p.c} />
		{/each}
		<!-- crown sparkle -->
		<rect class="sparkle" x="16" y="-1" width="1" height="1" fill="#fff" />
	</svg>
</div>

<style>
	.bee {
		animation: bob 1.6s steps(4) infinite;
		filter: drop-shadow(0 4px 0 rgb(0 0 0 / 0.25));
	}
	.bee.happy {
		animation: hop 0.5s steps(3) 3;
	}
	.bee.sad {
		animation: droop 2.4s steps(4) infinite;
	}
	.wings {
		transform-origin: 50% 55%;
		animation: flap 0.16s steps(2) infinite;
	}
	.sparkle {
		animation: twinkle 1.8s steps(2) infinite;
	}
	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-6px);
		}
	}
	@keyframes hop {
		0%,
		100% {
			transform: translateY(0) rotate(0);
		}
		50% {
			transform: translateY(-18px) rotate(-6deg);
		}
	}
	@keyframes droop {
		0%,
		100% {
			transform: translateY(4px) rotate(4deg);
		}
		50% {
			transform: translateY(8px) rotate(4deg);
		}
	}
	@keyframes flap {
		0% {
			transform: scaleY(1);
		}
		100% {
			transform: scaleY(0.75);
		}
	}
	@keyframes twinkle {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bee,
		.wings,
		.sparkle {
			animation: none;
		}
	}
</style>
