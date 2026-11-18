import * as THREE from 'three';
import { goldMatcap } from './textures';

/** Flat-shaded Lambert, the default look of every era-appropriate polygon. */
export const flat = (color: THREE.ColorRepresentation) =>
	new THREE.MeshLambertMaterial({ color, flatShading: true });

const SKIN = '#ffd2ad';
const TRIM = '#fff4e6';

export interface Elf {
	group: THREE.Group;
	arms: THREE.Object3D[];
}

/** Distance from an elf's origin down to the soles of its shoes. */
export const ELF_FEET = 2.05;

/** The Elf Queen (hair and crown) or a helper elf (pointed hat), facing +z. */
export function makeElf({ queen = false, tunic = '#1f8a50', hat = '#c9273c' } = {}): Elf {
	const group = new THREE.Group();
	const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(x, y, z);
		group.add(mesh);
		return mesh;
	};
	const outfit = flat(queen ? '#d3263f' : tunic);
	const skin = flat(SKIN);
	const trim = flat(TRIM);
	const dark = flat('#1c1424');
	const gold = new THREE.MeshMatcapMaterial({ matcap: goldMatcap(), side: THREE.DoubleSide });

	for (const side of [-1, 1]) {
		for (let i = 0; i < 3; i++) {
			add(new THREE.CylinderGeometry(0.13, 0.13, 0.24, 5), i % 2 ? trim : flat(queen ? '#1f8a50' : hat), side * 0.25, -1.68 + i * 0.24, 0);
		}
		add(new THREE.BoxGeometry(0.3, 0.2, 0.46), outfit, side * 0.25, -1.94, 0.08);
		add(new THREE.ConeGeometry(0.12, 0.38, 4), outfit, side * 0.25, -1.86, 0.42).rotation.x = 1.2;
		add(new THREE.IcosahedronGeometry(0.07, 0), gold, side * 0.25, -1.76, 0.6);

		const pivot = new THREE.Group();
		pivot.position.set(side * 0.38, 0.2, 0);
		pivot.userData.side = side;
		const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.72, 5), outfit);
		sleeve.position.y = -0.36;
		const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 5, 4), skin);
		hand.position.y = -0.78;
		pivot.add(sleeve, hand);
		group.add(pivot);
	}

	add(new THREE.CylinderGeometry(0.36, 1, 1.55, 8), outfit, 0, -0.5, 0);
	add(new THREE.TorusGeometry(1, 0.1, 4, 8), trim, 0, -1.27, 0).rotation.x = Math.PI / 2;
	add(new THREE.CylinderGeometry(0.4, 0.43, 0.16, 8), queen ? gold : dark, 0, 0.02, 0);
	add(new THREE.ConeGeometry(0.62, 0.3, 8), queen ? trim : flat(hat), 0, 0.42, 0);

	add(new THREE.SphereGeometry(0.64, 9, 7), skin, 0, 1.05, 0);
	add(new THREE.SphereGeometry(0.07, 4, 3), flat('#ffb48f'), 0, 1, 0.65);
	for (const side of [-1, 1]) {
		const ear = add(new THREE.ConeGeometry(0.15, 0.62, 4), skin, side * 0.82, 1.18, 0);
		ear.rotation.z = -side * (Math.PI / 2 - 0.35);
		const eye = add(new THREE.SphereGeometry(0.13, 6, 4), dark, side * 0.24, 1.12, 0.54);
		eye.scale.set(0.9, 1.2, 0.6);
		add(new THREE.SphereGeometry(0.04, 4, 3), new THREE.MeshBasicMaterial({ color: '#ffffff' }), side * 0.24 - 0.04, 1.17, 0.63);
		const cheek = add(new THREE.SphereGeometry(0.12, 6, 4), flat('#ff8f9f'), side * 0.4, 0.92, 0.48);
		cheek.scale.set(1, 0.6, 0.4);
	}
	const smile = add(new THREE.TorusGeometry(0.14, 0.035, 3, 8, Math.PI), dark, 0, 0.9, 0.61);
	smile.rotation.z = Math.PI;

	if (queen) {
		const hair = flat('#a8481e');
		add(new THREE.SphereGeometry(0.69, 8, 6), hair, 0, 1.12, -0.2);
		for (const side of [-1, 1]) add(new THREE.BoxGeometry(0.22, 1.1, 0.2), hair, side * 0.58, 0.55, -0.15);
		add(new THREE.CylinderGeometry(0.42, 0.38, 0.3, 6, 1, true), gold, 0, 1.72, 0);
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
			add(new THREE.ConeGeometry(0.11, 0.32, 4), gold, Math.sin(a) * 0.4, 2.02, Math.cos(a) * 0.4);
			add(new THREE.SphereGeometry(0.05, 4, 3), gold, Math.sin(a) * 0.4, 2.2, Math.cos(a) * 0.4);
		}
		add(new THREE.OctahedronGeometry(0.1, 0), flat('#ff2a5a'), 0, 1.74, 0.43);
		for (const side of [-1, 1]) add(new THREE.OctahedronGeometry(0.07, 0), flat('#3fc6ff'), side * 0.27, 1.74, 0.33);
	} else {
		add(new THREE.ConeGeometry(0.58, 1.15, 7), flat(hat), -0.08, 2, 0).rotation.z = 0.18;
		add(new THREE.TorusGeometry(0.56, 0.09, 4, 8), trim, 0, 1.52, 0).rotation.x = Math.PI / 2;
		add(new THREE.IcosahedronGeometry(0.14, 0), trim, -0.2, 2.6, 0);
	}

	const arms = group.children.filter((child) => child.userData.side);
	return { group, arms };
}

/** Pose the arms each frame: relaxed with an occasional wave, cheering, or hanging low. */
export function animateElf(elf: Elf, t: number, mood: 'idle' | 'happy' | 'sad' = 'idle') {
	elf.arms.forEach((arm, i) => {
		const side = arm.userData.side;
		let angle = 0.42 + Math.sin(t * 2 + i * Math.PI) * 0.08;
		if (mood === 'happy') angle = 2.45 + Math.sin(t * 12 + i * Math.PI) * 0.22;
		else if (mood === 'sad') angle = 0.08 + Math.sin(t * 1.2) * 0.03;
		else if (side > 0 && t % 6 < 1.6) angle = 2.25 + Math.sin(t * 9) * 0.28;
		arm.rotation.z = side * angle;
	});
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
