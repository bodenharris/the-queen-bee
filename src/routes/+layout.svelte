<script lang="ts">
	import './layout.css';
	import World from '../lib/retro/World.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Faceted gold honeycomb cell: six flat-shaded triangles around the centre.
	const shades = ['#fff3a0', '#ffd23e', '#e89a00', '#a85a00', '#c87400', '#ffe066'];
	const pt = (i: number) => {
		const a = Math.PI / 6 + (i * Math.PI) / 3;
		return `${(16 + 14 * Math.cos(a)).toFixed(1)},${(16 + 14 * Math.sin(a)).toFixed(1)}`;
	};
	const facets = shades.map((c, i) => `<polygon points="16,16 ${pt(i)} ${pt(i + 1)}" fill="${c}"/>`).join('');
	const outline = Array.from({ length: 6 }, (_, i) => pt(i)).join(' ');
	const favicon =
		'data:image/svg+xml,' +
		encodeURIComponent(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${facets}<polygon points="${outline}" fill="none" stroke="#0b0820" stroke-width="2" stroke-linejoin="round"/></svg>`
		);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<World />
<div class="crt" aria-hidden="true"></div>

{@render children()}
