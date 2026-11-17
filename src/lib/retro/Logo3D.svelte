<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { chromeMatcap, goldMatcap } from './textures';

	/**
	 * Extruded, bevelled 3D logo with gold faces and chrome sides. Letters are
	 * hand-drawn outlines on a 6-unit-tall grid. Each glyph is a list of shapes,
	 * and each shape is [outline, ...holes].
	 */
	let { text = 'QUEEN BEE', label = 'The Queen Bee' }: { text?: string; label?: string } = $props();

	type Pt = [number, number];
	const O_OUTER: Pt[] = [[1, 0], [4, 0], [5, 1], [5, 5], [4, 6], [1, 6], [0, 5], [0, 1]];
	const O_HOLE: Pt[] = [[1.9, 1.5], [3.1, 1.5], [3.5, 1.9], [3.5, 4.1], [3.1, 4.5], [1.9, 4.5], [1.5, 4.1], [1.5, 1.9]];
	const GLYPHS: Record<string, { w: number; shapes: Pt[][][] }> = {
		Q: { w: 5, shapes: [[O_OUTER, O_HOLE], [[[2.6, 2.1], [3.9, 2.1], [5.6, -0.6], [4.3, -0.6]]]] },
		U: { w: 5, shapes: [[[[1, 0], [4, 0], [5, 1], [5, 6], [3.5, 6], [3.5, 1.9], [3.1, 1.5], [1.9, 1.5], [1.5, 1.9], [1.5, 6], [0, 6], [0, 1]]]] },
		E: { w: 4.5, shapes: [[[[0, 0], [4.5, 0], [4.5, 1.5], [1.5, 1.5], [1.5, 2.3], [4, 2.3], [4, 3.7], [1.5, 3.7], [1.5, 4.5], [4.5, 4.5], [4.5, 6], [0, 6]]]] },
		N: { w: 5, shapes: [[[[0, 0], [1.5, 0], [1.5, 3.3], [3.5, 0], [5, 0], [5, 6], [3.5, 6], [3.5, 2.7], [1.5, 6], [0, 6]]]] },
		B: {
			w: 5,
			shapes: [
				[
					[[0, 0], [4, 0], [5, 1], [5, 2.4], [4.4, 3], [5, 3.6], [5, 5], [4, 6], [0, 6]],
					[[1.5, 1.3], [3.2, 1.3], [3.5, 1.6], [3.5, 2.1], [3.2, 2.4], [1.5, 2.4]],
					[[1.5, 3.6], [3.2, 3.6], [3.5, 3.9], [3.5, 4.4], [3.2, 4.7], [1.5, 4.7]]
				]
			]
		},
		' ': { w: 2, shapes: [] }
	};

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
		renderer.setPixelRatio(1);
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

		const gold = new THREE.MeshMatcapMaterial({ matcap: goldMatcap() });
		const chrome = new THREE.MeshMatcapMaterial({ matcap: chromeMatcap() });
		const vec = (pts: Pt[]) => pts.map(([a, b]) => new THREE.Vector2(a, b));

		const logo = new THREE.Group();
		let x = 0;
		const gap = 0.9;
		for (const ch of text) {
			const glyph = GLYPHS[ch] ?? GLYPHS[' '];
			for (const [outer, ...holes] of glyph.shapes) {
				const shape = new THREE.Shape(vec(outer));
				for (const h of holes) shape.holes.push(new THREE.Path(vec(h)));
				const geo = new THREE.ExtrudeGeometry(shape, {
					depth: 1.6,
					bevelEnabled: true,
					bevelThickness: 0.35,
					bevelSize: 0.28,
					bevelSegments: 1 // one chamfer: properly low-poly
				});
				geo.computeVertexNormals();
				const mesh = new THREE.Mesh(geo, [gold, chrome]);
				mesh.position.x = x;
				logo.add(mesh);
			}
			x += glyph.w + gap;
		}
		const width = x - gap;
		logo.children.forEach((m) => (m.position.x -= width / 2));
		logo.position.y = -3;
		const pivot = new THREE.Group();
		pivot.add(logo);
		scene.add(pivot);

		function resize() {
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			renderer.setSize(Math.ceil(w / 2), Math.ceil(h / 2), false); // chunky but readable
			camera.aspect = w / h;
			const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
			const fitW = (width * 1.18 + 6) / 2 / half / camera.aspect;
			const fitH = 9 / 2 / half;
			camera.position.set(0, 0, Math.max(fitW, fitH));
			camera.updateProjectionMatrix();
		}
		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		resize();

		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const clock = new THREE.Clock();
		let raf = 0;
		let last = 0;
		function frame() {
			raf = requestAnimationFrame(frame);
			const t = clock.getElapsedTime();
			if (t - last < 1 / 30) return;
			last = t;
			pivot.rotation.y = Math.sin(t * 0.8) * 0.32;
			pivot.rotation.x = -0.12 + Math.sin(t * 0.6) * 0.05;
			pivot.position.y = Math.sin(t * 1.6) * 0.25;
			renderer.render(scene, camera);
		}
		if (still) {
			pivot.rotation.set(-0.12, -0.2, 0);
			renderer.render(scene, camera);
		} else frame();

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			logo.children.forEach((m) => (m as THREE.Mesh).geometry.dispose());
			renderer.dispose();
		};
	});
</script>

<h1 class="relative">
	<span class="sr-only">{label}</span>
	<canvas bind:this={canvas} class="block h-28 w-full sm:h-40" aria-hidden="true"></canvas>
</h1>
