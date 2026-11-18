import * as THREE from 'three';
import { flat } from './models';
import { chromeMatcap, glowTexture, goldMatcap, honeyMatcap, stoneTexture, winterViewTexture } from './textures';

type Vec3 = [number, number, number];

function place<T extends THREE.Object3D>(parent: THREE.Object3D, object: T, [x, y, z]: Vec3) {
	object.position.set(x, y, z);
	parent.add(object);
	return object;
}

const box = (w: number, h: number, d: number, material: THREE.Material) =>
	new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);

/** Sideways log, with its length along x. */
function log(length: number, radius: number, material: THREE.Material) {
	const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 6), material);
	mesh.rotation.z = Math.PI / 2;
	return mesh;
}

// ───────────── Fireplace ─────────────

export interface Fireplace {
	group: THREE.Group;
	update: (t: number) => void;
}

export function makeFireplace(): Fireplace {
	const group = new THREE.Group();
	const stoneBase = stoneTexture();
	const stone = (x: number, y: number) => {
		const map = stoneBase.clone();
		map.repeat.set(x, y);
		map.needsUpdate = true;
		return new THREE.MeshLambertMaterial({ map });
	};

	place(group, box(10.6, 0.3, 3.1, stone(5, 1)), [0, 0.15, 1.45]); // hearth
	for (const side of [-1, 1]) place(group, box(1.6, 3.6, 1.6, stone(1, 2)), [side * 3.7, 2.1, 0.8]);
	place(group, box(5.8, 0.7, 1.6, stone(3, 0.5)), [0, 3.55, 0.8]);
	place(group, box(7.2, 4.95, 1.2, stone(3.5, 2.5)), [0, 6.72, 0.6]);

	const soot = new THREE.MeshBasicMaterial({ color: '#120705' });
	place(group, box(5.8, 2.9, 0.1, soot), [0, 1.75, 0.1]);

	const glow = new THREE.Sprite(
		new THREE.SpriteMaterial({
			map: glowTexture(),
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			fog: false
		})
	);
	glow.scale.set(6.4, 4.5, 1);
	place(group, glow, [0, 1.6, 0.35]);

	// Mantel and everything on it
	const wood = flat('#6b3518');
	place(group, box(10.4, 0.35, 2.1, wood), [0, 4.08, 0.95]);

	const garland = flat('#1f7a42');
	const berry = flat('#e8263f');
	for (let i = 0; i < 15; i++) {
		const x = -4.9 + i * 0.7;
		place(group, new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), garland), [x, 3.88, 2.02]);
		if (i % 2) place(group, new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), berry), [x, 3.78, 2.24]);
	}

	const honey = new THREE.MeshMatcapMaterial({ matcap: honeyMatcap() });
	const cloth = flat('#c9273c');
	for (const [x, s] of [[-3.9, 1], [-3.25, 0.75], [3.5, 0.9]] as const) {
		place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.26 * s, 0.68 * s, 7), honey), [x, 4.25 + 0.34 * s, 1.1]);
		place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.36 * s, 0.14 * s, 7), cloth), [x, 4.25 + 0.74 * s, 1.1]);
	}

	const wax = flat('#ffe9a8');
	const candleFlames: THREE.Mesh[] = [];
	const candleFire = new THREE.MeshBasicMaterial({ color: '#ffd24a', fog: false });
	for (const [x, h] of [[-1.7, 0.75], [1.7, 0.95], [2.25, 0.6]] as const) {
		place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, h, 6), wax), [x, 4.25 + h / 2, 1.2]);
		const flame = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 4), candleFire);
		place(group, flame, [x, 4.4 + h, 1.2]);
		candleFlames.push(flame);
	}

	// Wreath over the mantel
	const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.27, 5, 10), flat('#1c7040'));
	place(group, wreath, [0, 6.25, 1.32]);
	place(group, box(0.52, 0.28, 0.14, berry), [0, 5.42, 1.62]);
	const gold = new THREE.MeshMatcapMaterial({ matcap: goldMatcap() });
	for (let i = 0; i < 6; i++) {
		const a = (i / 6) * Math.PI * 2 + 0.25;
		place(group, new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), gold), [Math.cos(a) * 0.85, 6.25 + Math.sin(a) * 0.85, 1.6]);
	}

	// Stockings
	const trim = flat('#fff4e6');
	([[-2.25, '#c9273c'], [0, '#1f8a50'], [2.25, '#c9273c']] as const).forEach(([x, color]) => {
		const sock = flat(color);
		place(group, box(0.48, 0.2, 0.2, trim), [x, 3.82, 2.08]);
		place(group, box(0.38, 0.72, 0.18, sock), [x, 3.38, 2.08]);
		place(group, box(0.62, 0.26, 0.18, sock), [x + 0.12, 3.03, 2.08]);
	});

	// Logs and fire
	const bark = flat('#4a2513');
	const a = place(group, log(4.1, 0.27, bark), [0.1, 0.62, 0.85]);
	a.rotation.y = 0.12;
	const b = place(group, log(3.5, 0.24, bark), [-0.2, 0.92, 0.55]);
	b.rotation.y = -0.2;

	const unitFlame = new THREE.ConeGeometry(1, 1, 5).translate(0, 0.5, 0);
	const layers = [
		{ color: '#ff3d12', count: 7, spread: 2.05, r: 0.55, h: 1.95, z: 0.55 },
		{ color: '#ff8a16', count: 6, spread: 1.65, r: 0.42, h: 1.55, z: 0.82 },
		{ color: '#ffd84a', count: 5, spread: 1.15, r: 0.26, h: 1.05, z: 1.08 }
	];
	const flames = layers.flatMap((layer, l) =>
		Array.from({ length: layer.count }, (_, i) => {
			const mesh = new THREE.Mesh(unitFlame, new THREE.MeshBasicMaterial({ color: layer.color, fog: false }));
			const x = layer.count === 1 ? 0 : -layer.spread + (i / (layer.count - 1)) * layer.spread * 2;
			const edge = 1 - Math.abs(x / (layer.spread + 0.5)) * 0.55;
			place(group, mesh, [x, 0.72, layer.z]);
			mesh.userData = { x, r: layer.r, h: layer.h * edge, phase: i * 1.73 + l * 2.1, speed: 5.2 + (i % 3) * 1.1 };
			return mesh;
		})
	);

	const emberCount = 26;
	const emberPositions = new Float32Array(emberCount * 3);
	const embers = new THREE.Points(
		new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(emberPositions, 3)),
		new THREE.PointsMaterial({ color: '#ffb13c', size: 0.09, fog: false })
	);
	group.add(embers);

	return {
		group,
		update(t) {
			for (const flame of flames) {
				const u = flame.userData;
				const lick = 1 + Math.sin(t * u.speed + u.phase) * 0.2 + Math.sin(t * u.speed * 2.3 + u.phase) * 0.1;
				flame.scale.set(u.r * (1.08 - lick * 0.08), u.h * lick, u.r);
				flame.position.x = u.x + Math.sin(t * 2.2 + u.phase) * 0.07;
				flame.rotation.y = t * 1.4 + u.phase;
				flame.rotation.z = Math.sin(t * 3.1 + u.phase) * 0.1;
			}
			for (let i = 0; i < emberCount; i++) {
				const life = (t * (0.18 + (i % 5) * 0.025) + i * 0.137) % 1;
				emberPositions[i * 3] = Math.sin(i * 7.31) * 2.1 + Math.sin(t * 1.5 + i) * 0.16 * life;
				emberPositions[i * 3 + 1] = 0.75 + life * 2.35;
				emberPositions[i * 3 + 2] = 0.8 + Math.cos(i * 2.17) * 0.45;
			}
			embers.geometry.attributes.position.needsUpdate = true;
			candleFlames.forEach((flame, i) => flame.scale.setScalar(0.9 + Math.sin(t * 9 + i * 2) * 0.16));
			glow.material.opacity = 0.72 + Math.sin(t * 8.1) * 0.08 + Math.sin(t * 13.7) * 0.05;
		}
	};
}

// ───────────── Window ─────────────

export interface WinterWindow {
	group: THREE.Group;
	update: (t: number) => void;
}

export function makeWindow(): WinterWindow {
	const group = new THREE.Group();
	const W = 4.4;
	const H = 4.6;

	const view = new THREE.Mesh(
		new THREE.PlaneGeometry(W, H),
		new THREE.MeshBasicMaterial({ map: winterViewTexture(), fog: false })
	);
	place(group, view, [0, 0, 0.08]);

	const count = 90;
	const seeds = Array.from({ length: count }, (_, i) => ({
		x: (((i * 37) % 89) / 89 - 0.5) * W,
		y: ((i * 53) % 97) / 97,
		speed: 0.075 + ((i * 17) % 11) * 0.009,
		sway: i * 1.91
	}));
	const positions = new Float32Array(count * 3);
	const snow = new THREE.Points(
		new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)),
		new THREE.PointsMaterial({ color: '#ffffff', size: 0.085, fog: false })
	);
	group.add(snow);

	place(
		group,
		new THREE.Mesh(
			new THREE.PlaneGeometry(W, H),
			new THREE.MeshBasicMaterial({ color: '#b8dcff', transparent: true, opacity: 0.09, fog: false, depthWrite: false })
		),
		[0, 0, 0.32]
	);

	const drift = flat('#f4f9ff');
	for (const [x, s] of [[-1.45, 0.72], [-0.35, 0.55], [0.82, 0.68], [1.75, 0.46]] as const) {
		const lump = place(group, new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), drift), [x, -2.25, 0.25]);
		lump.scale.set(1.35, 0.42, 0.25);
	}

	const frame = flat('#5c2d15');
	place(group, box(4.95, 0.28, 0.72, frame), [0, 2.42, 0.36]);
	place(group, box(5.2, 0.32, 1.05, frame), [0, -2.42, 0.48]);
	for (const side of [-1, 1]) place(group, box(0.28, 5, 0.72, frame), [side * 2.34, 0, 0.36]);
	place(group, box(0.13, 4.65, 0.14, frame), [0, 0, 0.45]);
	place(group, box(4.5, 0.13, 0.14, frame), [0, 0.15, 0.45]);

	const curtain = flat('#a91f33');
	for (const side of [-1, 1]) {
		for (let i = 0; i < 3; i++) place(group, box(0.26, 5.45 - i * 0.2, 0.2 + (i % 2) * 0.12, curtain), [side * (2.68 + i * 0.22), 0.05 + i * 0.1, 0.75]);
	}
	place(group, log(6.6, 0.07, flat('#2d170d')), [0, 2.82, 0.85]);

	return {
		group,
		update(t) {
			seeds.forEach((flake, i) => {
				const y = (flake.y - t * flake.speed) % 1;
				const wrapped = y < 0 ? y + 1 : y;
				positions[i * 3] = THREE.MathUtils.clamp(flake.x + Math.sin(t * 0.8 + flake.sway) * 0.16, -W / 2 + 0.05, W / 2 - 0.05);
				positions[i * 3 + 1] = -H / 2 + 0.15 + wrapped * (H - 0.2);
				positions[i * 3 + 2] = 0.14 + (i % 4) * 0.035;
			});
			snow.geometry.attributes.position.needsUpdate = true;
		}
	};
}

// ───────────── Christmas tree ─────────────

export interface ChristmasTree {
	group: THREE.Group;
	update: (t: number) => void;
}

export function makeTree(): ChristmasTree {
	const group = new THREE.Group();
	place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1, 6), flat('#5a2d15')), [0, 0.5, 0]);
	place(group, new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.56, 0.62, 7), flat('#a91f33')), [0, 0.32, 0]);

	const tiers = [
		{ y: 1.1, r: 2.55, h: 2.7 },
		{ y: 2.75, r: 2.05, h: 2.35 },
		{ y: 4.2, r: 1.55, h: 2.05 },
		{ y: 5.5, r: 1.02, h: 1.75 }
	];
	tiers.forEach((tier, i) => {
		const cone = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 8), flat(i % 2 ? '#1f8050' : '#176a42'));
		cone.rotation.y = i * 0.35;
		place(group, cone, [0, tier.y + tier.h / 2, 0]);
	});

	const red = flat('#e8263f');
	const chrome = new THREE.MeshMatcapMaterial({ matcap: chromeMatcap() });
	const gold = new THREE.MeshMatcapMaterial({ matcap: goldMatcap() });
	const ornaments = [red, gold, chrome];
	const bulbs = ['#ffe36a', '#ff5a6e', '#69d7ff'].map((color) => new THREE.MeshBasicMaterial({ color, fog: false }));
	const bulbBase = bulbs.map((m) => m.color.clone());
	const bulbGeo = new THREE.OctahedronGeometry(0.075, 0);

	let n = 0;
	for (const tier of tiers) {
		for (let row = 0; row < 2; row++) {
			const p = 0.2 + row * 0.42;
			const y = tier.y + tier.h * p;
			const radius = tier.r * (1 - p) + 0.06;
			const count = Math.max(5, Math.round(radius * 4));
			for (let i = 0; i < count; i++) {
				const a = (i / count) * Math.PI * 2 + row * 0.42 + tier.y;
				const pos: Vec3 = [Math.sin(a) * radius, y, Math.cos(a) * radius];
				if (n % 3 === 0) {
					place(group, new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), ornaments[n % ornaments.length]), pos);
				} else {
					place(group, new THREE.Mesh(bulbGeo, bulbs[n % bulbs.length]), pos);
				}
				n++;
			}
		}
	}

	const star = new THREE.Group();
	for (let i = 0; i < 2; i++) {
		const point = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), gold);
		point.scale.set(i ? 1 : 0.28, i ? 0.28 : 1, 0.22);
		star.add(point);
	}
	place(group, star, [0, 7.35, 0]);

	const gifts = [
		{ p: [-1.95, 0.36, 1.05], s: [1.05, 0.72, 0.9], c: '#e8263f', r: '#ffd23e' },
		{ p: [0.15, 0.3, 2.05], s: [0.82, 0.6, 0.82], c: '#2f6bff', r: '#fff4e6' },
		{ p: [1.75, 0.46, 1.25], s: [1.05, 0.92, 1], c: '#ffb21e', r: '#c9273c' }
	];
	for (const gift of gifts) {
		const [w, h, d] = gift.s;
		const present = place(group, box(w, h, d, flat(gift.c)), gift.p as Vec3);
		const ribbon = flat(gift.r);
		present.add(box(w + 0.03, h + 0.03, 0.14, ribbon), box(0.14, h + 0.03, d + 0.03, ribbon));
	}

	return {
		group,
		update(t) {
			star.rotation.y = t * 0.8;
			bulbs.forEach((material, i) => {
				const lit = 0.45 + 0.55 * Math.max(0, Math.sin(t * 2.2 + i * 2.1));
				material.color.copy(bulbBase[i]).multiplyScalar(lit);
			});
		}
	};
}
