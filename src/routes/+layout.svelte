<script lang="ts">
	import './layout.css';
	import World from '../lib/retro/World.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// A faceted green elf hat with a white band and gold pom-pom.
	const favicon =
		'data:image/svg+xml,' +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g stroke="#1a0d08" stroke-width="1.5" stroke-linejoin="round"><polygon points="16,3 7,24 16,24" fill="#45c46f"/><polygon points="16,3 25,24 16,24" fill="#16824a"/><rect x="5" y="23" width="22" height="6" rx="2" fill="#fff4e6"/><circle cx="16" cy="4" r="3" fill="#ffd23e"/></g></svg>'
		);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<World />
<div class="crt" aria-hidden="true"></div>

{@render children()}
