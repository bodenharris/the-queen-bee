<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { animateElf, makeElf } from './models';

	/**
	 * The Elf Queen as a low-poly 3D model. Rendered at half resolution so the
	 * polygons stay chunky. Moods: idle (bob and wave), happy (twirl and cheer),
	 * sad (droop and slump).
	 */
	let {
		size = 120,
		mood = 'idle',
		label = 'The Elf Queen, an elf wearing a royal crown'
	}: { size?: number; mood?: 'idle' | 'happy' | 'sad'; label?: string } = $props();

	let canvas: HTMLCanvasElement;
	// Read by the render loop; restarts the reaction when the mood changes.
	let current: { mood: 'idle' | 'happy' | 'sad'; since: number } = { mood: 'idle', since: 0 };
	let clockRef: THREE.Clock | null = null;

	$effect(() => {
		current = { mood, since: clockRef?.getElapsedTime() ?? 0 };
	});

	onMount(() => {
		const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
		renderer.setPixelRatio(1);
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
		camera.position.set(0, 0.2, 10.2);
		camera.lookAt(0, 0.12, 0);

		scene.add(new THREE.HemisphereLight('#fff2d0', '#5a2a18', 1.8));
		const key = new THREE.DirectionalLight('#ffffff', 2.2);
		key.position.set(-3, 4, 6);
		scene.add(key);

		const elf = makeElf({ queen: true });
		scene.add(elf.group);

		const px = Math.max(56, Math.round(size / 1.6));
		renderer.setSize(px, Math.round(px * 1.15), false);
		camera.aspect = 1 / 1.15;
		camera.updateProjectionMatrix();

		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const clock = new THREE.Clock();
		clockRef = clock;
		let raf = 0;
		let last = 0;

		function draw(t: number) {
			const g = elf.group;
			const since = t - current.since;
			g.rotation.set(0, Math.sin(t * 0.9) * 0.45, 0);
			g.position.set(0, Math.sin(t * 2.2) * 0.12, 0);

			if (current.mood === 'happy' && since < 1.2) {
				// Twirl once and hop
				const p = since / 1.2;
				g.rotation.y = p * Math.PI * 2;
				g.position.y = Math.sin(p * Math.PI) * 0.35;
			} else if (current.mood === 'sad') {
				g.rotation.x = 0.28;
				g.rotation.z = 0.12;
				g.rotation.y = Math.sin(t * 0.5) * 0.15;
				g.position.y = -0.2 + Math.sin(t * 1.2) * 0.05;
			}
			animateElf(elf, t, current.mood);
			renderer.render(scene, camera);
		}

		function frame() {
			raf = requestAnimationFrame(frame);
			const t = clock.getElapsedTime();
			if (t - last < 1 / 30) return;
			last = t;
			draw(t);
		}
		if (still) draw(0);
		else frame();

		return () => {
			cancelAnimationFrame(raf);
			scene.traverse((o) => {
				if (o instanceof THREE.Mesh) o.geometry.dispose();
			});
			renderer.dispose();
		};
	});
</script>

<div role="img" aria-label={label} class="inline-block">
	<canvas
		bind:this={canvas}
		aria-hidden="true"
		class="block"
		style="width:{size}px; height:{Math.round(size * 1.15)}px"
	></canvas>
</div>
