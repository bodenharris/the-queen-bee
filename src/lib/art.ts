// Pixel art for the Queen Bee mascot. Each sprite is drawn from the LEFT half
// of each row (center column included) and mirrored, so it is always symmetric.

export const PALETTE: Record<string, string> = {
	K: '#2b1a0c', // outline / stripes
	Y: '#ffc928', // body yellow
	O: '#e8960c', // body shade
	W: '#cdeeff', // wing
	w: '#ffffff', // wing / eye highlight
	G: '#ffd84a', // crown gold
	g: '#c98a00', // crown shadow
	R: '#e8365d', // ruby
	b: '#3fc6ff', // sapphire
	P: '#ff8fa3' // cheek
};

const HALF = [
	'......G...G',
	'....K.GG.GG',
	'.....KGGGGR',
	'......GbGGG',
	'.....Kggggg',
	'....KYYYYYY',
	'...KYYYYYYY',
	'...KYKwYYYY',
	'...KYKKYYYY',
	'...KPYYYKYY',
	'.ww.KYYYYKK',
	'WWWW.KKKKKK',
	'WWWWKOYYYYY',
	'WWWKOYYYYYY',
	'.WWKKKKKKKK',
	'..WKKKKKKKK',
	'...KOYYYYYY',
	'...KOYYYYYY',
	'...KKKKKKKK',
	'....KKKKKKK',
	'.....KOYYYY',
	'......KKYYY',
	'........KKK',
	'..........K'
];

const mirror = (row: string) => row + [...row.slice(0, -1)].reverse().join('');
export const BEE: string[] = HALF.map(mirror);
export const BEE_W = BEE[0].length;
export const BEE_H = BEE.length;

/** Which characters belong to the wings (animated separately). */
export const WING_CHARS = new Set(['W', 'w']);

export interface Pixel {
	x: number;
	y: number;
	c: string;
	wing: boolean;
}

export function pixels(sprite: string[]): Pixel[] {
	const out: Pixel[] = [];
	sprite.forEach((row, y) =>
		[...row].forEach((ch, x) => {
			if (ch === '.') return;
			// eye highlight 'w' sits on the head (row 7); everything else 'w' is wing
			const wing = WING_CHARS.has(ch) && y >= 10;
			out.push({ x, y, c: PALETTE[ch], wing });
		})
	);
	return out;
}

/** Static SVG string — used for the favicon. */
export function beeSvg(): string {
	const rects = pixels(BEE)
		.map((p) => `<rect x="${p.x}" y="${p.y}" width="1.02" height="1.02" fill="${p.c}"/>`)
		.join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${BEE_W + 2} ${BEE_H + 2}" shape-rendering="crispEdges">${rects}</svg>`;
}

export const beeFavicon = () => `data:image/svg+xml,${encodeURIComponent(beeSvg())}`;

// Category icons — 12×12 sprites. '.' is transparent.
const OUT = '#2b1a0c';
export const ICONS: Record<string, { map: string[]; colors: Record<string, string> }> = {
	// Globe
	Geography: {
		map: [
			'....KKKK....',
			'..KKBBGGKK..',
			'.KwBBGGGGBK.',
			'.KBGGGGGBBK.',
			'KBBBGGGBBBBK',
			'KBBBBGBBBGGK',
			'KBBBBBBBGGGK',
			'KGGBBBBBGGGK',
			'.KGGGBBBBGK.',
			'.KBGGBBBBBK.',
			'..KKBBBBKK..',
			'....KKKK....'
		],
		colors: { K: OUT, B: '#3fc6ff', G: '#57b84a', w: '#ffffff' }
	},
	// Basketball
	Sports: {
		map: [
			'....KKKK....',
			'..KKOKOOKK..',
			'.KoKOKOOKOK.',
			'.KoKOKOOKOK.',
			'KOKOOKOOOKOK',
			'KKKKKKKKKKKK',
			'KOKOOKOOOKOK',
			'.KOKOKOOKOK.',
			'.KOKOKOOKOK.',
			'..KOOKOOOK..',
			'..KKOKOOKK..',
			'....KKKK....'
		],
		colors: { K: OUT, O: '#ff8a3d', o: '#ffc08a' }
	},
	// Clapperboard
	'Movies/TV': {
		map: [
			'KKKKKKKKKKK.',
			'KWWKKWWKKWWK',
			'KKKKKKKKKKKK',
			'KWWKKWWKKWWK',
			'KKKKKKKKKKKK',
			'KPPPPPPPPPPK',
			'KPwwwwPPPPPK',
			'KPPPPPPPPPPK',
			'KPwwwPwwwPPK',
			'KPPPPPPPPPPK',
			'KPPPPPPPPPPK',
			'KKKKKKKKKKKK'
		],
		colors: { K: OUT, W: '#ffffff', P: '#c77dff', w: '#f3e3ff' }
	},
	// Scroll
	History: {
		map: [
			'KKKKKKKKKKKK',
			'KttttttttttK',
			'KKKKKKKKKKKK',
			'.KPPPPPPPPK.',
			'.KPbbbbbPPK.',
			'.KPPPPPPPPK.',
			'.KPbbbbbbPK.',
			'.KPPPPPPPPK.',
			'.KPbbbbPPPK.',
			'KKKKKKKKKKKK',
			'KttttttttttK',
			'KKKKKKKKKKKK'
		],
		colors: { K: OUT, t: '#c9944a', P: '#f3dfae', b: '#8a5a2b' }
	},
	// Cupcake
	Food: {
		map: [
			'.....KK.....',
			'....KRRK....',
			'...KKRRKK...',
			'..KWWKKWWK..',
			'.KWWWWWWWWK.',
			'KWWSWWWWSWWK',
			'KKKKKKKKKKKK',
			'.KCcCcCcCcK.',
			'.KCcCcCcCcK.',
			'..KCcCcCcK..',
			'..KCcCcCcK..',
			'...KKKKKK...'
		],
		colors: { K: OUT, R: '#e8365d', W: '#ffd1dc', S: '#3fc6ff', C: '#ff6b8b', c: '#d94f6f' }
	},
	// Flask
	Science: {
		map: [
			'....KKKK....',
			'....KwwK....',
			'....KwwK....',
			'....KwwK....',
			'...KwwwwK...',
			'..KwwwwwwK..',
			'.KLLLLLLLLK.',
			'.KLlLLLlLLK.',
			'KLLLLLlLLLLK',
			'KLlLLLLLLlLK',
			'KLLLLLLLLLLK',
			'.KKKKKKKKKK.'
		],
		colors: { K: OUT, w: '#e6f7ff', L: '#6fd35f', l: '#c4f5b8' }
	}
};

// Small scenery sprites
export const FLOWER = ['.R.R.', 'RRYRR', '.RRR.', '..G..', '.GG..', '..G..'];
export const FLOWER_PALETTE = (petal: string): Record<string, string> => ({
	R: petal,
	Y: '#ffd84a',
	G: '#3f9a3a'
});
