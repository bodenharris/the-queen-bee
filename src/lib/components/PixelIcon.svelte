<script lang="ts">
	import { ICONS } from '../art';
	import type { Category } from '../types';

	let {
		category,
		size = 24,
		dim = false
	}: { category: Category; size?: number; dim?: boolean } = $props();

	const icon = $derived(ICONS[category]);
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 {icon.map[0].length} {icon.map.length}"
	shape-rendering="crispEdges"
	aria-hidden="true"
	class="inline-block shrink-0 align-middle {dim ? 'opacity-40 grayscale' : ''}"
>
	{#each icon.map as row, y (y)}
		{#each [...row] as ch, x (x)}
			{#if ch !== '.'}<rect {x} {y} width="1.02" height="1.02" fill={icon.colors[ch]} />{/if}
		{/each}
	{/each}
</svg>
