import * as THREE from 'three';
import { CATEGORIES, type Category } from '../types';
import { categoryModel } from './models';

/**
 * Category icons are little 3D models rendered once, at low resolution, into
 * image sprites — the same trick late-90s games used for menu icons. One
 * renderer makes all six, then it's thrown away.
 */
let cache: Record<Category, string> | null = null;

export function categoryIcons(): Record<Category, string> {
	if (cache) return cache;
	const SIZE = 64;
	const canvas = document.createElement('canvas');
	const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
	renderer.setPixelRatio(1);
	renderer.setSize(SIZE, SIZE, false);

	const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
	camera.position.set(0, 0.4, 5.4);
	camera.lookAt(0, 0, 0);

	const out = {} as Record<Category, string>;
	for (const cat of CATEGORIES) {
		const scene = new THREE.Scene();
		scene.add(new THREE.HemisphereLight('#fff2d0', '#3a2060', 1.6));
		const key = new THREE.DirectionalLight('#ffffff', 2.4);
		key.position.set(-3, 4, 5);
		scene.add(key);
		const model = categoryModel(cat);
		model.rotation.set(0.15, -0.45, 0);
		scene.add(model);
		renderer.clear();
		renderer.render(scene, camera);
		out[cat] = canvas.toDataURL('image/png');
		scene.traverse((o) => {
			if (o instanceof THREE.Mesh) o.geometry.dispose();
		});
	}
	renderer.dispose();
	renderer.forceContextLoss();
	cache = out;
	return out;
}
