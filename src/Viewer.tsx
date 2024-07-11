import { Viewport } from 'pixi-viewport';
import {
	Application,
	Assets,
	Sprite,
	Text,
	TextStyle,
	TextureStyle,
} from 'pixi.js';
import React, { useEffect, useRef, useState } from 'react';
import { useRoute } from 'wouter';

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

	const [, params] = useRoute('/:page');

	const page = params?.page ?? 'home';

	const [app, setApp] = useState<Application>();
	const [viewport, setViewport] = useState<Viewport>();

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

			setApp(app);
			setViewport(viewport);
		}

		setupApplication();
	}, []);

	// add game objects
	useEffect(() => {
		if (!app) return;
		if (!viewport) return;

		let x = 0;
		let y = 0;
		let depth = 0;
		let pendingY = 0;

		const depthSize = 40;

		function drawHeader() {
			y += 40;
			const t = viewport!.addChild(
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

			t.y = y;

			y += t.height;
			y += 80;

			return t;
		}

		const iconPadX = 2;

		const sprites: Sprite[] = [];
		const texts: Text[] = [];

		function drawText(text: string, style?: TextStyle) {
			const t = viewport!.addChild(
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

			texts.push(t);

			return t;
		}

		function drawImage(image: string) {
			const sprite = Sprite.from(image);

			sprite.x = x + depth * depthSize;
			sprite.y = y;

			viewport!.addChild(sprite);

			x += sprite.width;
			x += iconPadX;
			// y += sprite.height;
			pendingY = Math.max(pendingY, sprite.height);

			sprites.push(sprite);

			return sprite;
		}

		function drawFolder(folder: Record<string, any>) {
			x = 0;
			depth++;
			let drawn = false;

			const imageEntries = Object.entries(folder).filter(
				([, v]) => typeof v === 'string'
			);
			const subfolderEntries = Object.entries(folder).filter(
				([, v]) => typeof v === 'object'
			);

			for (const [, value] of imageEntries) {
				drawImage(value);
				drawn = true;
			}

			y += pendingY;
			pendingY = 0;

			for (const [key, value] of subfolderEntries) {
				// @ts-ignore
				drawText(titles[key as any] ?? key);
				drawFolder(value);
			}

			depth--;

			if (drawn) y += 40;
		}

		function destroyObjects() {
			texts.forEach((t) =>
				t.destroy({
					texture: false,
					textureSource: false,
				})
			);
			texts.length = 0;
			sprites.forEach((s) =>
				s.destroy({
					texture: false,
					textureSource: false,
					children: false,
					style: false,
					context: false,
				})
			);
			sprites.length = 0;
		}

		function drawNormalView(folder: Record<string, any>) {
			drawHeader();
			drawFolder(folder);
		}

		function drawHeightSorted(folder: Record<string, any>) {
			drawFolder(folder);

			texts.forEach((t) => t.destroy());

			x = 0;
			y = 0;
			drawHeader();

			drawText('Sorted by height');

			y += 50;

			sprites.sort((a, b) => a.height - b.height);

			let lastHeight = 0;

			for (const sprite of sprites) {
				sprite.x = x;
				sprite.y = y;

				if (sprite.height > lastHeight) {
					lastHeight = sprite.height;

					const t = viewport!.addChild(
						new Text({
							text: lastHeight,
							style: {
								fontFamily: 'Arial',
								fontSize: 24,
								fill: 0xffffff,
							},
						})
					);

					texts.push(t);

					t.anchor.set(0, 1);

					const ratio = t.width / t.height;
					t.width = sprite.width;
					t.height = t.width / ratio;
					t.x = x;
					t.y = y - iconPadX;
				}

				x += sprite.width;
				x += iconPadX;
			}
		}

		const viewToSetup = {
			home: () => drawNormalView(folders),
			byHeight: () => drawHeightSorted(folders),
		};

		// @ts-ignore
		viewToSetup[page]();

		return () => {
			destroyObjects();
		};
	}, [app, viewport, page]);

	// cleanup
	useEffect(() => {
		if (!app) return;
		if (!viewport) return;

		return () => {
			app.destroy();
		};
	}, [app, viewport]);

	return <canvas ref={ref} className='w-full h-full'></canvas>;
}

export default Viewer;
