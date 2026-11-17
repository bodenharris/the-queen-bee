<script lang="ts">
	import './layout.css';
	import { beeFavicon } from '../lib/art';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={beeFavicon()} />
</svelte:head>

{@render children()}
