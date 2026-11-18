<script lang="ts">
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { makeFireplace, makeTree, makeWindow } from './cabin';
	import { ELF_FEET, animateElf, flat, makeElf } from './models';
	import { plankTexture } from './textures';

	/**
	 * A cozy log hut on a winter night: a crackling fireplace straight ahead,
	 * snow drifting past the window and a twinkling Christmas tree to the side.
	 * Rendered at ~480px wide, stretched with bilinear filtering, at 30fps —
	 * like a console of the era.
	 */
	let canvas: HTMLCanvasElement;

	const lerp = THREE.MathUtils.lerp;

	onMount(() => {
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
		renderer.setPixelRatio(1);

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#160905');
		scene.fog = new THREE.Fog('#241008', 18, 42);

		const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
		camera.position.set(0, 3.6, 8);

		scene.add(new THREE.HemisphereLight('#ffc48e', '#46200f', 1.05));
		const moon = new THREE.PointLight('#8db8ff', 18, 13, 1.6);
		moon.position.set(-9, 4.5, -5.5);
		scene.add(moon);
		const firelight = new THREE.PointLight('#ff8a35', 70, 30, 1.45);
		firelight.position.set(0, 1.7, -4.9);
		scene.add(firelight);

		// Room shell: plank floor and ceiling, log walls, heavy beams
		const floor = new THREE.Mesh(
			new THREE.PlaneGeometry(26, 20),
			new THREE.MeshLambertMaterial({ map: plankTexture(5, 8) })
		);
		floor.rotation.x = -Math.PI / 2;
		floor.position.set(0, 0, 2);
		scene.add(floor);

		const ceiling = new THREE.Mesh(
			new THREE.PlaneGeometry(26, 20),
			new THREE.MeshLambertMaterial({ map: plankTexture(4, 7), color: '#7a5240' })
		);
		ceiling.rotation.x = Math.PI / 2;
		ceiling.position.set(0, 9.2, 2);
		scene.add(ceiling);

		const logA = flat('#744020');
		const logB = flat('#633416');
		const longLog = new THREE.CylinderGeometry(0.52, 0.52, 26, 6);
		const sideLog = new THREE.CylinderGeometry(0.52, 0.52, 20, 6);
		for (let row = 0; row < 11; row++) {
			const y = 0.42 + row * 0.86;
			const material = row % 2 ? logA : logB;
			const back = new THREE.Mesh(longLog, material);
			back.rotation.z = Math.PI / 2;
			back.position.set(0, y, -8);
			scene.add(back);
			for (const side of [-1, 1]) {
				const wall = new THREE.Mesh(sideLog, material);
				wall.rotation.x = Math.PI / 2;
				wall.position.set(side * 12.8, y, 2);
				scene.add(wall);
			}
		}
		const beamMat = flat('#3e2010');
		for (const z of [-5.5, -1.5, 2.5, 6.5]) {
			const beam = new THREE.Mesh(new THREE.BoxGeometry(26, 0.55, 0.65), beamMat);
			beam.position.set(0, 8.85, z);
			scene.add(beam);
		}

		// Round braided rug in front of the hearth
		[
			[6.1, '#5e1722'],
			[5.2, '#b72c36'],
			[4.25, '#e4b65c'],
			[3.45, '#1e6a45'],
			[2.45, '#b72c36']
		].forEach(([radius, color], i) => {
			const ring = new THREE.Mesh(new THREE.CircleGeometry(radius as number, 12), flat(color as string));
			ring.rotation.x = -Math.PI / 2;
			ring.scale.y = 0.62;
			ring.position.set(0, 0.03 + i * 0.012, 0.3);
			scene.add(ring);
		});

		const fireplace = makeFireplace();
		fireplace.group.position.set(0, 0, -7.9);
		scene.add(fireplace.group);

		const winterWindow = makeWindow();
		winterWindow.group.position.set(-9, 4.4, -7.42);
		scene.add(winterWindow.group);

		const tree = makeTree();
		tree.group.position.set(9, 0, -5.4);
		scene.add(tree.group);

		// Helper elves: two by the tree and one sitting up on the mantel
		const helpers = [
			{ parent: tree.group, x: -3.35, y: 0, z: 0.7, size: 0.62, turn: 0.9, tunic: '#1f8a50', hat: '#c9273c', hop: 0.14 },
			{ parent: tree.group, x: -2.65, y: 0, z: 3, size: 0.52, turn: 0.45, tunic: '#c9273c', hat: '#1f8a50', hop: 0.1 },
			{ parent: fireplace.group, x: -2.5, y: 4.25, z: 1.15, size: 0.27, turn: 0.1, tunic: '#2f6bff', hat: '#ffb21e', hop: 0 }
		].map((h) => {
			const elf = makeElf({ tunic: h.tunic, hat: h.hat });
			elf.group.scale.setScalar(h.size);
			elf.group.position.set(h.x, h.y + ELF_FEET * h.size, h.z);
			elf.group.rotation.y = h.turn;
			h.parent.add(elf.group);
			return { elf, base: elf.group.position.y, hop: h.hop };
		});

		function resize() {
			const w = window.innerWidth;
			const h = window.innerHeight;
			const scale = Math.max(2, Math.round(w / 480));
			renderer.setSize(Math.ceil(w / scale), Math.ceil(h / scale), false);
			camera.aspect = w / h;

			// Narrow screens pull the props together so all three stay in view.
			const k = THREE.MathUtils.clamp((camera.aspect - 0.6) / 0.9, 0, 1);
			camera.fov = lerp(68, 52, k);
			fireplace.group.scale.setScalar(lerp(0.56, 1, k));
			winterWindow.group.scale.setScalar(lerp(0.42, 1, k));
			winterWindow.group.position.x = lerp(-3.45, -9, k);
			tree.group.scale.setScalar(lerp(0.62, 1, k));
			tree.group.position.x = lerp(3.3, 9, k);
			camera.updateProjectionMatrix();
		}
		resize();
		window.addEventListener('resize', resize);

		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const clock = new THREE.Clock();
		let last = 0;
		let raf = 0;

		function draw(t: number) {
			fireplace.update(t);
			winterWindow.update(t);
			tree.update(t);
			firelight.intensity = 70 + Math.sin(t * 8.3) * 11 + Math.sin(t * 13.1) * 7 + Math.sin(t * 21) * 4;

			helpers.forEach(({ elf, base, hop }, i) => {
				elf.group.position.y = base + Math.abs(Math.sin(t * 2.4 + i * 1.4)) * hop;
				animateElf(elf, t + i * 2);
			});

			camera.position.x = Math.sin(t * 0.13) * 0.28;
			camera.lookAt(0, 3.9, -8);
			renderer.render(scene, camera);
		}

		function frame() {
			raf = requestAnimationFrame(frame);
			const t = clock.getElapsedTime();
			if (t - last < 1 / 30) return; // 30fps, period-correct
			last = t;
			draw(t);
		}

		if (still) draw(1);
		else frame();

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			scene.traverse((o) => {
				if (o instanceof THREE.Mesh || o instanceof THREE.Points) o.geometry.dispose();
			});
			renderer.dispose();
		};
	});
</script>

<canvas bind:this={canvas} class="world fixed inset-0 -z-10 size-full" aria-hidden="true"></canvas>
