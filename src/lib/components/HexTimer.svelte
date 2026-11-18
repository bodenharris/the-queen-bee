<script lang="ts">
	let { remaining, total }: { remaining: number; total: number } = $props();

	const secs = $derived(Math.max(0, Math.ceil(remaining)));
	const fill = $derived(Math.max(0, Math.min(100, (remaining / total) * 100)));
	const danger = $derived(secs <= 10);
	const critical = $derived(secs <= 5);
</script>

<div
	class="timer relative shrink-0"
	class:danger
	class:critical
	role="timer"
	aria-label="{secs} seconds left"
	title="{secs} seconds left"
>
	<span class="hex absolute inset-0 bg-ink"></span>
	<span class="hex chrome absolute inset-[3px]"></span>
	<span class="hex glass absolute inset-[7px]"></span>
	<span class="hex liquid absolute inset-[7px]" style="--fill:{fill}%"></span>
	<span class="hex gloss absolute inset-[7px]"></span>
	<span class="hud-num relative grid h-full place-items-center text-2xl tabular-nums" aria-hidden="true">{secs}</span>
</div>

<style>
	.timer {
		width: 60px;
		height: 69px;
		filter: drop-shadow(0 4px 0 rgb(26 13 8 / 0.7));
	}
	.hex {
		clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
	}
	.chrome {
		background: linear-gradient(160deg, #ffffff 0%, #ffe39a 20%, #7a3418 45%, #fff2c8 60%, #a8481e 80%, #ffffff 100%);
	}
	.glass {
		background: radial-gradient(ellipse at 50% 30%, #1f6a50 0%, #10392c 60%, #081f19 100%);
	}
	.liquid {
		--top: #fff0a0;
		--mid: #ffb21e;
		--low: #c25a00;
		background: linear-gradient(to top, var(--low) 0%, var(--mid) calc(var(--fill) - 6%), var(--top) calc(var(--fill) - 1%), transparent var(--fill));
	}
	.danger .liquid {
		--top: #ffc0cc;
		--mid: #ff3d6a;
		--low: #8a0a2a;
	}
	.danger .chrome {
		background: linear-gradient(160deg, #ffffff 0%, #ffb0c0 20%, #8a1a3a 45%, #ffd0da 60%, #c02a4a 80%, #ffffff 100%);
	}
	.gloss {
		background: linear-gradient(180deg, rgb(255 255 255 / 0.35) 0%, rgb(255 255 255 / 0.05) 45%, transparent 50%);
	}
	.critical {
		animation: throb 0.5s ease-in-out infinite;
	}
	@keyframes throb {
		50% {
			transform: scale(1.1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.critical {
			animation: none;
		}
	}
</style>
