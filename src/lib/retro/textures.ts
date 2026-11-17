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

/** Golden-hour sky: deep indigo overhead melting into a honey horizon. */
export function skyTexture() {
	return canvasTexture(4, 256, (g, w, h) => {
		const grad = g.createLinearGradient(0, 0, 0, h);
		grad.addColorStop(0, '#0a0838');
		grad.addColorStop(0.32, '#2c2190');
		grad.addColorStop(0.55, '#9a3aa8');
		grad.addColorStop(0.7, '#ff7a6a');
		grad.addColorStop(0.8, '#ffc65a');
		grad.addColorStop(1, '#ffd98a');
		g.fillStyle = grad;
		g.fillRect(0, 0, w, h);
	});
}

/**
 * A tiling honeycomb floor: dark wax cells with glowing honey seams. Left
 * bilinear-filtered on purpose — that soft, smeary upscale is the N64 look.
 */
export function honeycombTexture() {
	const s = 10; // hex radius in texels
	const W = Math.round(Math.sqrt(3) * s * 2); // two hexes across
	const H = s * 6; // two rows stacked twice
	const t = canvasTexture(W, H, (g) => {
		g.fillStyle = '#3a1a3a';
		g.fillRect(0, 0, W, H);
		const hex = (cx: number, cy: number, fill: string) => {
			g.beginPath();
			for (let i = 0; i < 6; i++) {
				const a = Math.PI / 6 + (i * Math.PI) / 3;
				g.lineTo(cx + s * Math.cos(a), cy + s * Math.sin(a));
			}
			g.closePath();
			g.fillStyle = fill;
			g.fill();
			g.lineWidth = 2;
			g.strokeStyle = '#ffb21e';
			g.stroke();
		};
		const dx = Math.sqrt(3) * s;
		for (let row = -1; row <= 4; row++) {
			for (let col = -1; col <= 3; col++) {
				const cx = col * dx + (row % 2 ? dx / 2 : 0);
				const cy = row * s * 1.5;
				// Pattern repeats every 2 columns × 4 rows so the tile wraps seamlessly.
				const filled = ((row % 4) + 4) % 4 === 0 && ((col % 2) + 2) % 2 === 0;
				hex(cx, cy, filled ? '#8a4a1a' : '#4a2040');
			}
		}
	});
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(70, 70);
	t.magFilter = THREE.LinearFilter;
	t.anisotropy = 1;
	return t;
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

/** Fake chrome reflecting sky, a dark horizon band and warm ground. */
export const chromeMatcap = () =>
	matcap([
		[0, '#ffffff'],
		[0.3, '#a8d4ff'],
		[0.48, '#3a4a8a'],
		[0.52, '#0c0c22'],
		[0.62, '#7a4a2a'],
		[1, '#f2c79a']
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

/** Soft round glow for the setting sun. */
export function glowTexture() {
	return canvasTexture(64, 64, (g, w, h) => {
		const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
		r.addColorStop(0, 'rgba(255,245,200,1)');
		r.addColorStop(0.35, 'rgba(255,200,110,0.9)');
		r.addColorStop(0.6, 'rgba(255,120,120,0.35)');
		r.addColorStop(1, 'rgba(255,120,120,0)');
		g.fillStyle = r;
		g.fillRect(0, 0, w, h);
	});
}
