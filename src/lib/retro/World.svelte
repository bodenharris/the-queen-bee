<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { chromeMatcap, glowTexture, goldMatcap, honeyMatcap, honeycombTexture, skyTexture } from './textures';
	import { flap, flat, honeyDropGeometry, makeBee, makeFlower } from './models';

	/**
	 * Full-screen low-poly meadow at golden hour: a glowing honeycomb floor,
	 * faceted hills, flowers, spinning honeycomb cells and honey drops, and a
	 * few worker bees doing laps. Rendered at ~480px wide, stretched with
	 * bilinear filtering, at 30fps — like a console of the era.
	 */
	let canvas: HTMLCanvasElement;

	onMount(() => {
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
		renderer.setPixelRatio(1);

		const scene = new THREE.Scene();
		scene.background = skyTexture();
		scene.fog = new THREE.Fog('#d0688a', 18, 95);

		const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);
		camera.position.set(0, 3.2, 10);

		scene.add(new THREE.HemisphereLight('#ffe6b0', '#4a2060', 1.7));
		const sun = new THREE.DirectionalLight('#ffd2a0', 2.4);
		sun.position.set(-6, 10, 4);
		scene.add(sun);

		// Honeycomb floor
		const floorTex = honeycombTexture();
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshLambertMaterial({ map: floorTex }));
		floor.rotation.x = -Math.PI / 2;
		scene.add(floor);

		// Setting sun behind the fog
		const sunSprite = new THREE.Sprite(
			new THREE.SpriteMaterial({ map: glowTexture(), fog: false, depthWrite: false, transparent: true })
		);
		sunSprite.position.set(0, 10, -150);
		sunSprite.scale.set(75, 75, 1);
		scene.add(sunSprite);

		// Ring of faceted hills
		const rng = mulberry(7);
		const hillMat = flat('#7a2f8a');
		const capMat = flat('#ffd98a');
		for (let i = 0; i < 26; i++) {
			const a = (i / 26) * Math.PI * 2 + rng() * 0.15;
			const r = 80 + rng() * 25;
			const hgt = 12 + rng() * 22;
			const segs = 4 + Math.floor(rng() * 3);
			const m = new THREE.Mesh(new THREE.ConeGeometry(10 + rng() * 8, hgt, segs), hillMat);
			m.position.set(Math.cos(a) * r, hgt / 2 - 0.5, Math.sin(a) * r - 20);
			m.rotation.y = rng() * Math.PI;
			scene.add(m);
			if (hgt > 26) {
				// Honey-glazed peaks instead of snow
				const cap = new THREE.Mesh(new THREE.ConeGeometry(3.2, hgt * 0.22, segs), capMat);
				cap.position.set(m.position.x, hgt - hgt * 0.11 - 0.5, m.position.z);
				cap.rotation.y = m.rotation.y;
				scene.add(cap);
			}
		}

		// Flowers along both sides of the path
		const petals = ['#ff6aa0', '#ffffff', '#b892ff', '#ff8a3d', '#3fc6ff'];
		for (let i = 0; i < 14; i++) {
			const side = i % 2 ? 1 : -1;
			const f = makeFlower(petals[i % petals.length]);
			const s = 0.8 + rng() * 0.8;
			f.scale.setScalar(s);
			f.position.set(side * (6 + rng() * 10), 0, -2 - i * 4 - rng() * 3);
			f.rotation.y = rng() * Math.PI;
			scene.add(f);
		}

		// Floating shapes, kept to the sides so they frame the UI
		const chrome = new THREE.MeshMatcapMaterial({ matcap: chromeMatcap() });
		const gold = new THREE.MeshMatcapMaterial({ matcap: goldMatcap() });
		const honey = new THREE.MeshMatcapMaterial({ matcap: honeyMatcap() });
		const cell = new THREE.CylinderGeometry(1.1, 1.1, 0.55, 6);
		const drop = honeyDropGeometry();
		const shapes = [
			{ g: cell, m: gold, p: [-7, 4.5, -4] },
			{ g: drop, m: honey, p: [7.5, 5, -6] },
			{ g: new THREE.OctahedronGeometry(1.2, 0), m: flat('#ff4a8d'), p: [-9, 2.4, -12] },
			{ g: cell, m: chrome, p: [9.5, 2.6, -14] },
			{ g: drop, m: honey, p: [-5.5, 7.5, -16] },
			{ g: new THREE.IcosahedronGeometry(1, 0), m: flat('#3ef0c8'), p: [5, 8, -18] },
			{ g: cell, m: honey, p: [-12, 5.5, -22] },
			{ g: new THREE.IcosahedronGeometry(1.5, 0), m: chrome, p: [13, 6, -26] }
		].map(({ g, m, p }, i) => {
			const mesh = new THREE.Mesh(g, m);
			mesh.position.set(p[0], p[1], p[2]);
			mesh.userData = { y: p[1], phase: i * 1.3, spin: 0.4 + (i % 3) * 0.25 };
			scene.add(mesh);
			const shadow = blobShadow(1.2);
			shadow.position.set(p[0], 0.02, p[2]);
			scene.add(shadow);
			mesh.userData.shadow = shadow;
			return mesh;
		});

		// Worker bees doing slow laps in the distance
		const workers = Array.from({ length: 4 }, (_, i) => {
			const b = makeBee({ crown: false });
			b.group.scale.setScalar(0.45);
			b.group.userData = { r: 9 + i * 3, h: 4 + (i % 2) * 2.5, speed: 0.35 + i * 0.08, phase: i * 1.7, z: -14 - i * 5 };
			scene.add(b.group);
			return b;
		});

		function blobShadow(r: number) {
			const m = new THREE.Mesh(
				new THREE.CircleGeometry(r, 8),
				new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false })
			);
			m.rotation.x = -Math.PI / 2;
			return m;
		}

		function resize() {
			const w = window.innerWidth;
			const h = window.innerHeight;
			const scale = Math.max(2, Math.round(w / 480));
			renderer.setSize(Math.ceil(w / scale), Math.ceil(h / scale), false);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
		}
		resize();
		window.addEventListener('resize', resize);

		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const clock = new THREE.Clock();
		let last = 0;
		let raf = 0;

		function draw(t: number) {
			floorTex.offset.y = (t * 0.2) % 1;
			for (const s of shapes) {
				const u = s.userData;
				s.rotation.x = t * u.spin * 0.7;
				s.rotation.y = t * u.spin;
				s.position.y = u.y + Math.sin(t * 1.2 + u.phase) * 0.5;
				u.shadow.scale.setScalar(1 - (s.position.y - u.y + 0.5) * 0.25);
			}
			for (const b of workers) {
				const u = b.group.userData;
				const a = t * u.speed + u.phase;
				b.group.position.set(Math.cos(a) * u.r, u.h + Math.sin(t * 2 + u.phase) * 0.4, u.z + Math.sin(a) * 4);
				b.group.rotation.y = -a + Math.PI; // face along the lap
				flap(b, t);
			}
			camera.position.x = Math.sin(t * 0.15) * 0.8;
			camera.lookAt(0, 2.2, -20);
			renderer.render(scene, camera);
		}

		function frame() {
			raf = requestAnimationFrame(frame);
			const t = clock.getElapsedTime();
			if (t - last < 1 / 30) return; // 30fps, period-correct
			last = t;
			draw(t);
		}

		if (still) draw(0);
		else frame();

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			scene.traverse((o) => {
				if (o instanceof THREE.Mesh) o.geometry.dispose();
			});
			renderer.dispose();
		};
	});

	/** Seeded random so the hills and flowers land in the same place every visit. */
	function mulberry(seed: number) {
		return () => {
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}
</script>

<canvas bind:this={canvas} class="world fixed inset-0 -z-10 size-full" aria-hidden="true"></canvas>
