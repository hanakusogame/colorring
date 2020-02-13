import { MainScene } from "./MainScene";
declare function require(x: string): any;

//メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);
		const sizeW = 500;
		const sizeH = 360;
		super({ scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true });

		const waku = new g.Sprite({
			scene: scene,
			x: 10, y: 0,
			src: scene.assets["waku"]
		});
		this.append(waku);

		const base = new g.E({
			scene: scene,
			x: 10 + 15, y: 0 + 15
		});
		this.append(base);

		const maps: Map[][] = [];
		const mapSize = 110;
		const effects: g.FilledRect[][] = [];

		//エフェクト用
		for (let y = 0; y < 3; y++) {
			effects[y] = [];
			for (let x = 0; x < 3; x++) {
				const effect = new g.FilledRect({
					scene: scene,
					x: x * mapSize,
					y: y * mapSize,
					width: mapSize,
					height: mapSize,
					cssColor: "black",
					opacity: 0.1
				});
				effects[y][x] = effect;
				base.append(effect);
			}
		}

		//リング設置用パネル
		for (let y = 0; y < 3; y++) {
			maps[y] = [];
			for (let x = 0; x < 3; x++) {
				const map = new Map(scene, x * mapSize, y * mapSize);
				map.touchable = true;
				maps[y].push(map);
				base.append(map);
				map.pointDown.add((e) => {
					if (!scene.isStart || isStop) return;

					const effect = effects[y][x];
					effect.show();

					if (joinRings(map)) {
						isStop = true;
						timeline.create().wait(300).call(() => {
							if (clearLine()) {
								timeline.create().wait(600).call(() => {
									isStop = false;
								});
							} else {
								scene.playSound("se_move");
								isStop = false;
							}
							if (!chkMate()) {
								setNextRing();
							} else {
								this.reset();
							}
						});

						effect.cssColor = "gray";
						effect.opacity = 0.1;
						effect.modified();
					} else {
						scene.playSound("se_miss");

						effect.cssColor = "red";
						effect.opacity = 0.5;
						effect.modified();
						comboCnt = 0;
						scene.setCombo(comboCnt);
						scene.addScore(-200);

						isStop = false;
					}
					timeline.create().wait(100).call(() => {
						effect.opacity = 0.1;
						effect.hide();
					});
				});
			}
		}

		const wakus: g.E[] = [];
		//置くリングの枠
		const pWakuBase = new g.E({
			scene: scene,
			x: 380,
			y: 100
		});
		const pWaku = new g.Sprite({
			scene: scene,
			src: scene.assets["waku_p"],
			x: - 15,
			y: - 15,
			width: 140,
			height: 140
		});
		base.append(pWakuBase);
		pWakuBase.append(pWaku);
		wakus.push(pWakuBase);

		//次のリングの枠
		for (let i = 0; i < 5; i++) {
			const wakuBase = new g.E({
				scene: scene,
				x: 430 + i * 80,
				y: 240
			});

			const w = new g.Sprite({
				scene: scene,
				src: scene.assets["waku_p"],
				x: -15 / 2,
				y: -15 / 2,
				width: 70,
				height: 70,
				srcX: 140
			});
			wakuBase.append(w);
			wakus.push(wakuBase);
			base.append(wakuBase);
		}

		//置くリングの作成
		const setMap = (map: Map) => {
			//フィールド上のリングを確認して置けるリングのサイズを取得
			const list = [];
			for (let y = 0; y < 3; y++) {
				for (let x = 0; x < 3; x++) {
					const m = maps[y][x];
					for (let i = 0; i < m.children.length; i++) {
						if (m.children[i].tag === -1) {
							list.push(i);
						}
					}
				}
			}

			const srcRings = map.children as g.FrameSprite[];
			const size = list[scene.random.get(0, list.length - 1)];
			for (let i = 0; i < srcRings.length; i++) {
				const ring = srcRings[i];
				if (i === size) {
					const num = scene.random.get(0, 3);
					ring.tag = num;
					ring.frameNumber = i * 5 + num;
					ring.modified();
					ring.show();
				} else {
					ring.tag = -1;
					ring.hide();
				}
			}
		};

		//置くリング
		let PMap: Map;

		//次のリング生成
		const nextRings: Map[] = [];
		for (let i = 0; i < 5; i++) {
			const map = new Map(scene, 430 + i * 80, 240);
			map.scale(0.5);
			nextRings.push(map);
			base.append(map);
			setMap(map);
		}

		//消えるエフェクト用
		const effectLines: g.FilledRect[] = [];
		//横のライン
		const yokoLineBase = new g.E({ scene: scene, x: 10 + 15, y: 15, width: mapSize * 3, height: mapSize * 3 });
		this.append(yokoLineBase);
		for (let y = 0; y < 3; y++) {
			const line = new g.FilledRect({
				scene: scene,
				x: 0,
				y: y * mapSize,
				width: mapSize * 3,
				height: mapSize,
				cssColor: "pink"
			});
			yokoLineBase.append(line);
			effectLines.push(line);
		}

		//縦のライン
		const tateLineBase = new g.E({ scene: scene, x: 10 + 15, y: 15, width: mapSize * 3, height: mapSize * 3, angle: -90 });
		this.append(tateLineBase);
		for (let y = 0; y < 3; y++) {
			const line = new g.FilledRect({
				scene: scene,
				x: 0,
				y: y * mapSize,
				width: mapSize * 3,
				height: mapSize,
				cssColor: "green"
			});
			tateLineBase.append(line);
			effectLines.push(line);
		}

		//斜めのライン
		for (let i = 0; i < 2; i++) {
			const w = (mapSize * 3) * Math.sqrt(2);
			const line = new g.FilledRect({
				scene: scene,
				x: 10 + 15 - ((w - (mapSize * 3)) / 2),
				y: mapSize + 15,
				width: w,
				height: mapSize,
				cssColor: "red",
				angle: 45 + (90 * i)
			});
			this.append(line);
			effectLines.push(line);
		}

		//ゴミ箱ボタン作成
		let trushCnt = 2;
		const sprTrush = new g.FrameSprite({
			scene: scene,
			src: scene.assets["trush"] as g.ImageAsset,
			width: 90,
			height: 90,
			x: 545,
			y: 130,
			frames: [0, 1],
			touchable: true
		});
		this.append(sprTrush);

		const labelTrush = new g.Label({
			scene: scene,
			font: scene.numFont,
			fontSize: 32,
			text: "*2",
			x: 30,
			y: 55
		});
		sprTrush.append(labelTrush);

		sprTrush.pointDown.add(() => {
			if (trushCnt === 0) return;
			trushCnt--;
			sprTrush.frameNumber = 1;
			sprTrush.modified();

			scene.playSound("se_trush");

			timeline.create(PMap).moveTo(sprTrush.x, sprTrush.y, 200).call(() => {
				if (trushCnt === 0) {
					sprTrush.hide();
				} else {
					sprTrush.frameNumber = 0;
					sprTrush.modified();
					labelTrush.text = "*" + trushCnt;
					labelTrush.invalidate();
				}
				setNextRing();
			});
		});

		const glyph = JSON.parse((scene.assets["glyph72"] as g.TextAsset).data);
		const numFontB = new g.BitmapFont({
			src: scene.assets["number_b"],
			map: glyph.map,
			defaultGlyphWidth: 72,
			defaultGlyphHeight: 80
		});

		const numFontP = new g.BitmapFont({
			src: scene.assets["number_p"],
			map: glyph.map,
			defaultGlyphWidth: 72,
			defaultGlyphHeight: 80
		});

		//同時消しリングの数表示用
		const labelMultiBase = new g.E({ scene: scene, x: 70, y: 100 });
		this.append(labelMultiBase);

		const sprMulti = new g.Sprite({
			scene: scene,
			src: scene.assets["combo"],
			height: 40,
			x: 90,
			y: 10
		});
		labelMultiBase.append(sprMulti);

		const labelMulti = new g.Label({
			scene: scene,
			font: numFontB,
			text: "0",
			fontSize: 50,
			width: 90,
			textAlign: g.TextAlign.Right, widthAutoAdjust: false
		});
		labelMultiBase.append(labelMulti);

		//コンボ数表示用
		const labelComboBase = new g.E({ scene: scene, x: 70, y: 220 });
		this.append(labelComboBase);

		const sprCombo = new g.Sprite({
			scene: scene,
			src: scene.assets["combo"],
			height: 40,
			x: 90,
			y: 10,
			srcY: 40
		});
		labelComboBase.append(sprCombo);

		const labelCombo = new g.Label({
			scene: scene,
			font: numFontP,
			text: "0",
			fontSize: 50,
			width: 90,
			textAlign: g.TextAlign.Right, widthAutoAdjust: false
		});
		labelComboBase.append(labelCombo);

		let comboCnt = 0;

		//リングの設置
		const joinRings = (map: Map): boolean => {
			const dstRings = map.children as g.FrameSprite[];
			const srcRings = PMap.children as g.FrameSprite[];

			//置けるかどうかチェック
			for (let i = 0; i < srcRings.length; i++) {
				if (dstRings[i].tag !== -1 && srcRings[i].tag !== -1) {
					return false;
				}
			}

			//置く
			timeline.create(PMap).moveTo(map.x, map.y, 150).call(() => {
				for (let i = 0; i < srcRings.length; i++) {
					if (srcRings[i].tag !== -1) {
						dstRings[i].tag = srcRings[i].tag;
						dstRings[i].frameNumber = srcRings[i].frameNumber;
						dstRings[i].modified();
						dstRings[i].show();
					}
				}
				PMap.hide();
			});
			return true;
		};

		//詰み判定
		const chkMate = (): boolean => {
			for (let y = 0; y < 3; y++) {
				for (let x = 0; x < 3; x++) {
					for (let i = 0; i < maps[y][x].children.length; i++) {
						if (maps[y][x].children[i].tag === -1) return false;
					}
				}
			}
			return true;
		};

		//次に置くリングのリストの更新
		let nowRingNum = 0;
		const setNextRing = () => {
			setMap(PMap);

			for (let i = 0; i < nextRings.length; i++) {
				const srcNum = (nowRingNum + 1 + i) % nextRings.length;
				const srcRing = nextRings[srcNum];
				const w = wakus[i];
				if (i === nextRings.length - 1) {
					srcRing.hide();
				} else {
					srcRing.show();
				}
				if (i === 0) {
					timeline.create(srcRing).scaleTo(1.0, 1.0, 200);
				} else {
					srcRing.scale(0.5);
				}
				timeline.create(srcRing).moveTo(w.x, w.y, 200);
			}

			nowRingNum = (nowRingNum + 1) % nextRings.length;
			PMap = nextRings[nowRingNum];

			//置ける場所があるかチェックして、もし置けない場合はもう一度処理する
			let flg = false;
			for (let y = 0; y < 3; y++) {
				for (let x = 0; x < 3; x++) {
					const map = maps[y][x];
					for (let i = 0; i < map.children.length; i++) {
						if (map.children[i].tag === -1 && PMap.children[i].tag !== -1) {
							flg = true;
							break;
						}
					}
				}
				if (flg) break;
			}

			if (!flg) {
				timeline.create().wait(500).call(() => {
					setNextRing();
				});
			}
		};

		//一列揃ったかどうかチェック用配列
		const chkList: Array<{ x: number, y: number, mx: number, my: number }> = [];
		for (let y = 0; y < 3; y++) {
			chkList.push({ x: 0, y: y, mx: 1, my: 0 });//横
		}

		for (let x = 0; x < 3; x++) {
			chkList.push({ x: x, y: 0, mx: 0, my: 1 });//縦
		}

		chkList.push({ x: 0, y: 0, mx: 1, my: 1 });//斜め
		chkList.push({ x: 0, y: 2, mx: 1, my: -1 });

		const colors = ["magenta", "cyan", "yellow", "#00ff00"];

		//消す処理
		const clearLine = (): boolean => {
			let clearList: g.FrameSprite[] = [];
			let effectList: g.FilledRect[] = [];

			for (let j = 0; j < chkList.length; j++) {
				const e = chkList[j];
				//色数分ループ
				for (let cNum = 0; cNum < 4; cNum++) {
					const list: g.FrameSprite[] = [];
					const list2: g.FilledRect[] = [];
					let flg = true;
					for (let i = 0; i < 3; i++) {
						const y = e.y + (e.my * i);
						const x = e.x + (e.mx * i);
						const rs = maps[y][x];
						let flgR = false;
						//リングのサイズ分ループ
						for (let sNum = 0; sNum < 3; sNum++) {
							const r = rs.children[sNum] as g.FrameSprite;
							if (r.tag === cNum) {
								list.push(r);
								list2.push(effects[y][x]);
								flgR = true;
							}
						}
						if (!flgR) {
							flg = false;
							break;
						}
					}
					if (flg) {
						clearList = clearList.concat(list);//追加
						effectList = effectList.concat(list2);

						//エフェクト表示
						const effect = effectLines[j];
						effect.scaleX = 0;
						effect.scaleY = 0.1;
						effect.cssColor = colors[cNum];
						effect.show();
						timeline.create(effect).scaleTo(1.2, 0.1, 100).wait(300).call(() => {
							effect.hide();
						});
					}
				}
			}

			//同色のリングを全て取得
			const getColorRing = (num: number) => {
				let flg = false;
				for (let y = 0; y < maps.length; y++) {
					for (let x = 0; x < maps[y].length; x++) {
						const map = maps[y][x];
						const list = map.children.filter(e => e.tag === num) as g.FrameSprite[];
						clearList = clearList.concat(list);//追加

						//エフェクト表示
						if (list.length !== 0) {
							const effect = effects[y][x];
							effect.show();
							effect.cssColor = colors[num];
							timeline.create(effect).rotateTo(360, 500).call(() => {
								effect.angle = 0;
								effect.hide();
							});
							flg = true;
						}
					}
				}
				if (flg) scene.playSound("clear2");
			};

			//同じマス目に３つ同じ色が揃っている場合
			for (let y = 0; y < maps.length; y++) {
				for (let x = 0; x < maps[y].length; x++) {
					const map = maps[y][x];
					const num: number = map.children[0].tag;
					if (map.children[0].tag !== -1) {
						if (map.children.every(e => e.tag === num)) {
							getColorRing(num);
							break;
						}
					}
				}
			}

			//重複を削除する （いらないかも）
			clearList = clearList.filter((x, i, self) => self.indexOf(x) === i);

			effectList = effectList.filter((x, i, self) => self.indexOf(x) === i);

			effectList.forEach(effect => {
				effect.show();
				effect.cssColor = "white";
				effect.angle = 30;
				effect.scale(0.0);
				effect.modified();
				timeline.create(effect).scaleTo(1.2, 1.2, 500).call(() => {
					effect.angle = 0;
					effect.scale(1.0);
					effect.hide();
				});
			});

			if (effectList.length !== 0) scene.playSound("clear1");

			//リングを消す
			clearList.forEach(ring => {
				ring.tag = -1;
				timeline.create().every((a: number, b: number) => {
					ring.opacity = 1 - ((b * 2) % 1);
					ring.modified();
				}, 300).wait(300).call(() => {
					ring.opacity = 1.0;
					ring.hide();
				});
			});

			if (clearList.length !== 0) {
				//消した数表示
				labelMultiBase.show();
				labelMulti.text = "" + clearList.length;
				labelMulti.invalidate();
				timeline.create().wait(1000).call(() => {
					labelMultiBase.hide();
				});

				comboCnt++;
				if (comboCnt > 1) {
					labelComboBase.show();
					labelCombo.text = "" + comboCnt;
					labelCombo.invalidate();
					timeline.create().wait(1000).call(() => {
						labelComboBase.hide();
					});
				}
				scene.setCombo(comboCnt);

				//スコアを追加
				const comboBonus = (comboCnt === 1) ? 1 : ((comboCnt - 1) * 2);
				scene.addScore(((Math.pow(clearList.length - 1, 2) * 60) + 60) * comboBonus);

				return true;
			} else {
				comboCnt = 0;
				scene.setCombo(comboCnt);
				return false;
			}

		};

		let isStop = false;

		//リセット
		this.reset = () => {
			PMap = nextRings[nowRingNum];
			effectLines.forEach(e => e.hide());
			effects.forEach(e => e.forEach(effect => effect.hide()));
			labelMultiBase.hide();
			labelComboBase.hide();
			comboCnt = 0;

			trushCnt = 2;
			sprTrush.frameNumber = 0;
			sprTrush.modified();
			sprTrush.show();
			labelTrush.text = "*" + trushCnt;
			labelTrush.invalidate();

			scene.setCombo(comboCnt);

			for (let y = 0; y < maps.length; y++) {
				for (let x = 0; x < maps[y].length; x++) {
					maps[y][x].children.forEach(e => {
						e.tag = -1;
						e.hide();
					});
				}
			}
			setNextRing();
			isStop = false;
		};

	}
}

class Map extends g.E {
	constructor(scene: g.Scene, x: number, y: number) {
		super({
			scene: scene,
			x: x,
			y: y,
			width: 110,
			height: 110,
			anchorX: 0.0,
			anchorY: 0.0
		});
		for (let i = 0; i < 3; i++) {
			const list: number[] = [];
			for (let j = 0; j < 15; j++) list.push(j);
			const ring = new g.FrameSprite({
				scene: scene,
				src: scene.assets["ring"] as g.ImageAsset,
				width: 110,
				height: 110,
				frames: list
			});
			this.append(ring);
			ring.tag = -1;
			ring.hide();
		}
	}
}
