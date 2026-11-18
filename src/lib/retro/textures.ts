import * as THREE from 'three';

/** Draws on a small canvas and wraps it as a texture. */
function canvasTexture(
	w: number,
	h: number,
	draw: (g: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	draw(c.getContext('2d')!, w, h);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

/** Small repeatable random, so textures look the same on every visit. */
function seeded(seed: number) {
	return () => {
		seed = (seed * 16807) % 2147483647;
		return seed / 2147483647;
	};
}

function repeating(t: THREE.CanvasTexture, x: number, y: number) {
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(x, y);
	t.anisotropy = 1;
	return t;
}

/** Worn wooden planks. Left bilinear-filtered: the soft smear is the N64 look. */
export function plankTexture(x: number, y: number) {
	const rand = seeded(11);
	const t = canvasTexture(64, 64, (g, w, h) => {
		const rows = 4;
		const ph = h / rows;
		for (let r = 0; r < rows; r++) {
			const shade = 62 + Math.floor(rand() * 22);
			g.fillStyle = `rgb(${shade + 44} ${shade} ${Math.floor(shade * 0.55)})`;
			g.fillRect(0, r * ph, w, ph);
			g.fillStyle = 'rgb(35 17 10)';
			g.fillRect(0, r * ph, w, 1);
			g.fillRect(Math.floor(rand() * w), r * ph, 1, ph);
		}
	});
	return repeating(t, x, y);
}

/** Rough fieldstone with dark mortar, for the fireplace. */
export function stoneTexture() {
	const rand = seeded(29);
	const t = canvasTexture(64, 64, (g, w, h) => {
		g.fillStyle = '#2b2424';
		g.fillRect(0, 0, w, h);
		const rows = 4;
		const sh = h / rows;
		for (let r = 0; r < rows; r++) {
			const offset = r % 2 ? -8 : 0;
			for (let c = 0; c < 4; c++) {
				const v = 104 + Math.floor(rand() * 48);
				g.fillStyle = `rgb(${v + 10} ${v} ${v - 12})`;
				g.fillRect(offset + c * 16 + 1, r * sh + 1, 14, sh - 2);
				g.fillStyle = 'rgb(255 245 225 / 0.18)';
				g.fillRect(offset + c * 16 + 1, r * sh + 1, 14, 2);
			}
		}
	});
	return repeating(t, 1, 1);
}

/** The view outside: moonlit snowy hills and a line of pines. */
export function winterViewTexture() {
	return canvasTexture(128, 128, (g, w, h) => {
		const sky = g.createLinearGradient(0, 0, 0, h * 0.72);
		sky.addColorStop(0, '#0a1740');
		sky.addColorStop(0.65, '#27477f');
		sky.addColorStop(1, '#7c9fca');
		g.fillStyle = sky;
		g.fillRect(0, 0, w, h);

		g.fillStyle = '#fff6d8';
		g.beginPath();
		g.arc(92, 28, 11, 0, Math.PI * 2);
		g.fill();

		const poly = (fill: string, pts: number[][]) => {
			g.fillStyle = fill;
			g.beginPath();
			pts.forEach(([x, y]) => g.lineTo(x, y));
			g.closePath();
			g.fill();
		};
		poly('#b8cde6', [[0, 86], [28, 62], [55, 80], [86, 56], [128, 84], [128, 128], [0, 128]]);
		poly('#eaf3ff', [[0, 100], [38, 86], [78, 98], [128, 88], [128, 128], [0, 128]]);

		for (const [x, base, s] of [[14, 101, 1.1], [39, 94, 0.8], [62, 100, 1], [102, 96, 1.25], [122, 101, 0.8]]) {
			for (let i = 0; i < 3; i++) {
				const top = base - s * (34 - i * 9);
				const bottom = base - s * (16 - i * 8);
				const half = s * (8 + i * 3);
				poly('#123d3d', [[x, top], [x + half, bottom], [x - half, bottom]]);
				poly('#f2f8ff', [[x, top], [x + half * 0.42, top + s * 7], [x - half * 0.42, top + s * 7]]);
			}
		}
	});
}

/** Matcap helper: a lit sphere drawn from a vertical colour ramp plus a glint. */
function matcap(stops: [number, string][], glint = 0.9) {
	return canvasTexture(128, 128, (g, w, h) => {
		const grad = g.createLinearGradient(0, 0, 0, h);
		for (const [o, c] of stops) grad.addColorStop(o, c);
		g.fillStyle = grad;
		g.beginPath();
		g.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
		g.fill();
		const spec = g.createRadialGradient(w * 0.35, h * 0.28, 0, w * 0.35, h * 0.28, w * 0.22);
		spec.addColorStop(0, `rgba(255,255,255,${glint})`);
		spec.addColorStop(1, 'rgba(255,255,255,0)');
		g.fillStyle = spec;
		g.fillRect(0, 0, w, h);
	});
}

/** Fake chrome, tinted by a warm room. */
export const chromeMatcap = () =>
	matcap([
		[0, '#ffffff'],
		[0.3, '#ffe2c0'],
		[0.48, '#7a4a3a'],
		[0.52, '#1c0e0a'],
		[0.62, '#8a4a2a'],
		[1, '#ffd2a0']
	]);

/** Polished royal gold. */
export const goldMatcap = () =>
	matcap([
		[0, '#fffbe0'],
		[0.25, '#ffe066'],
		[0.55, '#e08a00'],
		[0.7, '#7a3a00'],
		[1, '#ffcf4a']
	]);

/** Glassy amber honey. */
export const honeyMatcap = () =>
	matcap(
		[
			[0, '#fff4c0'],
			[0.3, '#ffbf2a'],
			[0.6, '#d86a00'],
			[0.8, '#7a2a00'],
			[1, '#ffb030']
		],
		1
	);

/** Soft round glow for the fire. */
export function glowTexture() {
	return canvasTexture(64, 64, (g, w, h) => {
		const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
		r.addColorStop(0, 'rgba(255,235,170,1)');
		r.addColorStop(0.35, 'rgba(255,150,50,0.8)');
		r.addColorStop(0.65, 'rgba(255,70,20,0.25)');
		r.addColorStop(1, 'rgba(255,70,20,0)');
		g.fillStyle = r;
		g.fillRect(0, 0, w, h);
	});
}
