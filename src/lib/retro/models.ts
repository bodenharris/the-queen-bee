import * as THREE from 'three';
import { goldMatcap } from './textures';

/** Flat-shaded Lambert, the default look of every era-appropriate polygon. */
export const flat = (color: THREE.ColorRepresentation) =>
	new THREE.MeshLambertMaterial({ color, flatShading: true });

const BLACK = '#1c1424';
const YELLOW = '#ffc81e';

/** A low-poly sphere whose triangles are coloured in horizontal bands (bee stripes). */
function stripedSphere(radius: number, bands: [number, string][]) {
	const geo = new THREE.SphereGeometry(radius, 10, 8).toNonIndexed();
	const pos = geo.getAttribute('position');
	const colors = new Float32Array(pos.count * 3);
	const c = new THREE.Color();
	for (let i = 0; i < pos.count; i += 3) {
		const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3 / radius; // -1..1
		const band = bands.find(([top]) => y >= top) ?? bands[bands.length - 1];
		c.set(band[1]).convertSRGBToLinear();
		for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (i + k) * 3);
	}
	geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
	geo.computeVertexNormals();
	return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
}

export interface Bee {
	group: THREE.Group;
	wings: THREE.Object3D[];
}

/** The queen (with crown) or a plain worker bee, facing +z, about 4 units tall. */
export function makeBee({ crown = true } = {}): Bee {
	const group = new THREE.Group();

	// Striped abdomen
	// Band edges sit exactly on the sphere's latitude lines (8 rows: cos(k·π/8)),
	// so every stripe is a clean ring of polygons rather than a zig-zag.
	const abdomen = stripedSphere(1, [
		[0.7, YELLOW],
		[0.37, BLACK],
		[-0.01, YELLOW],
		[-0.39, BLACK],
		[-0.72, YELLOW],
		[-2, BLACK]
	]);
	abdomen.scale.set(1, 1.2, 0.95);
	abdomen.position.y = -0.55;
	group.add(abdomen);

	const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 5), flat(BLACK));
	stinger.rotation.x = Math.PI;
	stinger.position.y = -1.85;
	group.add(stinger);

	// Head and face
	const head = new THREE.Mesh(new THREE.SphereGeometry(0.78, 9, 7), flat(YELLOW));
	head.position.y = 1.15;
	group.add(head);

	for (const side of [-1, 1]) {
		const eye = new THREE.Mesh(new THREE.SphereGeometry(0.19, 6, 4), flat(BLACK));
		eye.position.set(side * 0.3, 1.27, 0.66);
		eye.scale.set(1, 1.2, 0.6);
		group.add(eye);
		const glint = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
		glint.position.set(side * 0.3 - 0.06, 1.35, 0.78);
		group.add(glint);
		const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), flat('#ff7f9a'));
		cheek.position.set(side * 0.5, 1.0, 0.56);
		cheek.scale.set(1, 0.6, 0.4);
		group.add(cheek);

		// Antennae poke out either side of the crown
		const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 4), flat(BLACK));
		stalk.position.set(side * 0.42, 2.05, 0.1);
		stalk.rotation.z = -side * 0.55;
		group.add(stalk);
		const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 4), flat(BLACK));
		tip.position.set(side * 0.66, 2.38, 0.1);
		group.add(tip);
	}

	const smile = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 3, 8, Math.PI), flat(BLACK));
	smile.rotation.z = Math.PI;
	smile.position.set(0, 1.02, 0.74);
	group.add(smile);

	// Royal crown: an open gold band, six spikes and a ruby
	if (crown) {
		const gold = new THREE.MeshMatcapMaterial({ matcap: goldMatcap(), side: THREE.DoubleSide });
		const band = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.46, 0.34, 6, 1, true), gold);
		band.position.y = 1.86;
		group.add(band);
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
			const spike = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.36, 4), gold);
			spike.position.set(Math.sin(a) * 0.5, 2.2, Math.cos(a) * 0.5);
			group.add(spike);
			const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 4, 3), gold);
			pearl.position.set(Math.sin(a) * 0.5, 2.4, Math.cos(a) * 0.5);
			group.add(pearl);
		}
		const ruby = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), flat('#ff2a5a'));
		ruby.position.set(0, 1.88, 0.52);
		group.add(ruby);
		for (const side of [-1, 1]) {
			const sapphire = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), flat('#3fc6ff'));
			sapphire.position.set(side * 0.34, 1.88, 0.4);
			group.add(sapphire);
		}
	}

	// Translucent wings on pivots so they can flap
	const wingMat = new THREE.MeshLambertMaterial({
		color: '#d8f2ff',
		transparent: true,
		opacity: 0.7,
		side: THREE.DoubleSide,
		flatShading: true
	});
	const wings: THREE.Object3D[] = [];
	for (const side of [-1, 1]) {
		const pivot = new THREE.Group();
		pivot.position.set(side * 0.55, 0.45, -0.35);
		const wing = new THREE.Mesh(new THREE.CircleGeometry(0.85, 6), wingMat);
		wing.scale.set(1, 0.62, 1);
		wing.position.set(side * 0.75, 0.35, 0);
		wing.rotation.z = side * 0.5;
		pivot.add(wing);
		pivot.userData.side = side;
		group.add(pivot);
		wings.push(pivot);
	}

	return { group, wings };
}

/** Flap wings: call every frame with elapsed seconds. */
export function flap(bee: Bee, t: number, speed = 28) {
	const a = Math.sin(t * speed) * 0.55;
	for (const w of bee.wings) w.rotation.y = w.userData.side * (0.35 + a);
}

// ───────────── Category models (rendered once into icon sprites) ─────────────

export function categoryModel(category: string): THREE.Object3D {
	const g = new THREE.Group();
	const add = (m: THREE.Mesh, ...p: [number, number, number]) => {
		m.position.set(...p);
		g.add(m);
		return m;
	};

	switch (category) {
		case 'Geography': {
			add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), flat('#2f8bff')), 0, 0, 0);
			const land = flat('#3fcf5a');
			const c1 = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), land), -0.35, 0.35, 0.62);
			c1.scale.set(1, 0.8, 0.5);
			const c2 = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), land), 0.45, -0.35, 0.68);
			c2.scale.set(0.9, 1.1, 0.4);
			const c3 = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), land), 0.5, 0.55, 0.55);
			c3.scale.set(1, 0.7, 0.5);
			break;
		}
		case 'Sports': {
			add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), flat('#ff7a1a')), 0, 0, 0);
			const seam = flat('#1c1424');
			const a = add(new THREE.Mesh(new THREE.TorusGeometry(1.01, 0.05, 3, 16), seam), 0, 0, 0);
			a.rotation.y = Math.PI / 2;
			add(new THREE.Mesh(new THREE.TorusGeometry(1.01, 0.05, 3, 16), seam), 0, 0, 0);
			const c = add(new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 3, 14), seam), 0.62, 0, 0);
			c.rotation.y = Math.PI / 2;
			break;
		}
		case 'Movies/TV': {
			add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.2, 0.3), flat('#a64dff')), 0, -0.3, 0);
			const arm = new THREE.Group();
			for (let i = 0; i < 5; i++) {
				const s = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.32), flat(i % 2 ? '#1c1424' : '#ffffff'));
				s.position.x = -0.76 + i * 0.38;
				arm.add(s);
			}
			arm.position.set(0, 0.55, 0);
			arm.rotation.z = 0.28;
			g.add(arm);
			for (let i = 0; i < 2; i++)
				add(new THREE.Mesh(new THREE.BoxGeometry(1.4 - i * 0.4, 0.1, 0.32), flat('#f0d8ff')), -0.1, -0.15 - i * 0.35, 0.02);
			break;
		}
		case 'History': {
			const paper = add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 0.08), flat('#f3dfae')), 0, 0, 0);
			paper.rotation.y = 0.15;
			for (const y of [0.95, -0.95]) {
				const roll = add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.8, 6), flat('#d9a55a')), 0, y, 0);
				roll.rotation.z = Math.PI / 2;
			}
			for (let i = 0; i < 3; i++)
				add(new THREE.Mesh(new THREE.BoxGeometry(1 - (i % 2) * 0.3, 0.1, 0.1), flat('#8a5a2b')), -0.05, 0.35 - i * 0.35, 0.06);
			break;
		}
		case 'Food': {
			add(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.6, 0.9, 8), flat('#ff5a8a')), 0, -0.55, 0);
			add(new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.1, 8), flat('#fff0f5')), 0, 0.35, 0);
			add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 0), flat('#ff2a4a')), 0, 1.0, 0);
			for (let i = 0; i < 5; i++) {
				const a = (i / 5) * Math.PI * 2;
				add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.06), flat(['#3fc6ff', '#ffd23e', '#6fd35f'][i % 3])), Math.cos(a) * 0.55, 0.15, Math.sin(a) * 0.55 + 0.1);
			}
			break;
		}
		case 'Science': {
			add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.95, 1.1, 8), flat('#56e06a')), 0, -0.45, 0);
			const glass = new THREE.MeshLambertMaterial({ color: '#cfefff', transparent: true, opacity: 0.75, flatShading: true });
			add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.8, 8), glass), 0, 0.5, 0);
			add(new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.07, 4, 8), glass), 0, 0.92, 0).rotation.x = Math.PI / 2;
			for (const [x, y] of [[-0.25, -0.4], [0.2, -0.6], [0.05, -0.2]] as const)
				add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), flat('#d8ffd0')), x, y, 0.6);
			break;
		}
	}
	return g;
}
