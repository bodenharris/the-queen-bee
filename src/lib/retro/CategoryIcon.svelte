<script lang="ts">
	import type { Category } from '../types';
	import { categoryIcons } from './icons';

	let {
		category,
		size = 32,
		dim = false
	}: { category: Category; size?: number; dim?: boolean } = $props();

	// The page only runs in the browser (ssr is off), so WebGL is available here.
	const src = $derived(categoryIcons()[category]);
</script>

<img
	{src}
	alt=""
	width={size}
	height={size}
	draggable="false"
	class="icon inline-block shrink-0 align-middle"
	class:dim
/>

<style>
	/* Soft bilinear upscale + a hard drop shadow, like a pre-rendered sprite */
	.icon {
		image-rendering: auto;
		filter: drop-shadow(0 2px 0 rgb(26 13 8 / 0.8));
	}
	.icon.dim {
		opacity: 0.4;
		filter: grayscale(1) drop-shadow(0 2px 0 rgb(26 13 8 / 0.8));
	}
</style>
