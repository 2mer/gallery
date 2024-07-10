import { Viewport } from 'pixi-viewport';
import {
	Application,
	Assets,
	Sprite,
	Text,
	TextStyle,
	TextureStyle,
} from 'pixi.js';
import React, { useRef } from 'react';

TextureStyle.defaultOptions.scaleMode = 'nearest';

const allImages = import.meta.glob('./assets/textures/**/*.(png|svg)', {
	eager: true,
	import: 'default',
});
const eoteImageUrls = Object.values(allImages);

type FlattenedObject = {
	[key: string]: string;
};

type NestedObject = {
	[key: string]: string | NestedObject;
};

function createNestedObject(
	flattened: FlattenedObject,
	omit = './assets/textures/'
): NestedObject {
	const nested: NestedObject = {};

	Object.keys(flattened).forEach((path) => {
		const parts = path.replace(omit, '').split('/');
		let current = nested;

		parts.forEach((part, index) => {
			if (index === parts.length - 1) {
				current[part] = flattened[path];
			} else {
				if (!current[part]) {
					current[part] = {};
				}
				current = current[part] as NestedObject;
			}
		});
	});

	return nested;
}

const assetLoad = Promise.all(
	eoteImageUrls.map((url: any) => Assets.load(url))
);

const folders = createNestedObject(allImages as any);

const titles = {
	eote: 'Echoes of the Elders (EOTE) textures',
	pitbound: 'Pitbound',
};

function Viewer() {
	const ref = useRef<HTMLCanvasElement>(null);

	React.useEffect(() => {
		async function setupApplication() {
			const app = new Application();

			await app.init({
				canvas: ref.current!,
				resizeTo: ref.current!,
			});

			const viewport = new Viewport({
				screenWidth: window.innerWidth,
				screenHeight: window.innerHeight,
				worldWidth: 1000,
				worldHeight: 1000,

				events: app.renderer.events,
			});

			viewport.drag().pinch().wheel().decelerate();

			app.stage.addChild(viewport);

			await assetLoad;

			let x = 0;
			let y = 0;
			let depth = 0;
			let pendingY = 0;

			const depthSize = 40;

			const t = viewport.addChild(
				new Text({
					text: "Welcome to Tomer Atar's asset gallery!\nAll rights reserved",
					style: {
						fontFamily: 'Arial',
						// fontSize: 24,
						fontSize: 50,
						fill: 0xffffff,
					},
				})
			);

			y += t.height;
			y += 80;

			const iconPadX = 2;
			// addTextureRow(
			// 	'Echoes of the Elders (EOTE) textures',
			// 	eoteImageUrls
			// );

			function drawText(text: string, style?: TextStyle) {
				const t = viewport.addChild(
					new Text({
						text,
						style: {
							fontFamily: 'Arial',
							fontSize: 40,
							fill: 0xffffff,
							...style,
						},
					})
				);

				t.y = y;
				t.x = depth * depthSize;

				y += t.height;
			}

			function drawImage(image: string) {
				const sprite = Sprite.from(image);

				sprite.x = x + depth * depthSize;
				sprite.y = y;

				viewport.addChild(sprite);

				x += sprite.width;
				x += iconPadX;
				// y += sprite.height;
				pendingY = Math.max(pendingY, sprite.height);
			}

			function drawFolder(folder: Record<string, any>) {
				x = 0;
				depth++;
				let drawn = false;
				for (const [key, value] of Object.entries(folder)) {
					if (typeof value === 'object') {
						// @ts-ignore
						drawText(titles[key as any] ?? key);
						drawFolder(value);
					} else {
						drawImage(value);
						drawn = true;
					}
				}
				depth--;
				y += pendingY;
				pendingY = 0;

				if (drawn) y += 40;
			}

			drawFolder(folders);
		}

		setupApplication();
	}, []);

	return <canvas ref={ref} className='w-full h-full'></canvas>;
}

export default Viewer;
