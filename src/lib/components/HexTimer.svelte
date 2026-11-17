<script lang="ts">
	let { remaining, total }: { remaining: number; total: number } = $props();

	const secs = $derived(Math.max(0, Math.ceil(remaining)));
	const fill = $derived(Math.max(0, Math.min(100, (remaining / total) * 100)));
	const danger = $derived(secs <= 10);
	const critical = $derived(secs <= 5);
</script>

<div
	class="timer relative shrink-0"
	class:critical
	role="timer"
	aria-label="{secs} seconds left"
	title="{secs} seconds left"
>
	<span class="hex absolute inset-0" style="background:{danger ? '#e8365d' : '#ffd84a'}"></span>
	<span class="hex absolute inset-[4px] bg-hive-950"></span>
	<span
		class="hex absolute inset-[4px]"
		style="background: linear-gradient(to top, {danger ? '#b3243f' : '#e8960c'} 0, {danger
			? '#e8365d'
			: '#ffc928'} {fill}%, transparent {fill}%)"
	></span>
	<span
		class="relative grid h-full place-items-center font-pixel text-xl text-cream tabular-nums [text-shadow:0_2px_0_#140c05]"
		aria-hidden="true"
	>
		{secs}
	</span>
</div>

<style>
	.timer {
		width: 56px;
		height: 64px;
	}
	.hex {
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	}
	.critical {
		animation: throb 0.5s steps(2) infinite;
	}
	@keyframes throb {
		50% {
			transform: scale(1.08);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.critical {
			animation: none;
		}
	}
</style>
