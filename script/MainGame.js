"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//メインのゲーム画面
var MainGame = /** @class */ (function (_super) {
    __extends(MainGame, _super);
    function MainGame(scene) {
        var _this = this;
        var tl = require("@akashic-extension/akashic-timeline");
        var timeline = new tl.Timeline(scene);
        var sizeW = 500;
        var sizeH = 360;
        _this = _super.call(this, { scene: scene, x: 0, y: 0, width: sizeW, height: sizeH, touchable: true }) || this;
        var waku = new g.Sprite({
            scene: scene,
            x: 10, y: 0,
            src: scene.assets["waku"]
        });
        _this.append(waku);
        var base = new g.E({
            scene: scene,
            x: 10 + 15, y: 0 + 15
        });
        _this.append(base);
        var maps = [];
        var mapSize = 110;
        var effects = [];
        //エフェクト用
        for (var y = 0; y < 3; y++) {
            effects[y] = [];
            for (var x = 0; x < 3; x++) {
                var effect = new g.FilledRect({
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
        var _loop_1 = function (y) {
            maps[y] = [];
            var _loop_2 = function (x) {
                var map = new Map(scene, x * mapSize, y * mapSize);
                map.touchable = true;
                maps[y].push(map);
                base.append(map);
                map.pointDown.add(function (e) {
                    if (!scene.isStart || isStop)
                        return;
                    var effect = effects[y][x];
                    effect.show();
                    if (joinRings(map)) {
                        isStop = true;
                        timeline.create().wait(300).call(function () {
                            if (clearLine()) {
                                timeline.create().wait(600).call(function () {
                                    isStop = false;
                                });
                            }
                            else {
                                scene.playSound("se_move");
                                isStop = false;
                            }
                            if (!chkMate()) {
                                setNextRing();
                            }
                            else {
                                _this.reset();
                            }
                        });
                        effect.cssColor = "gray";
                        effect.opacity = 0.1;
                        effect.modified();
                    }
                    else {
                        scene.playSound("se_miss");
                        effect.cssColor = "red";
                        effect.opacity = 0.5;
                        effect.modified();
                        comboCnt = 0;
                        scene.setCombo(comboCnt);
                        scene.addScore(-200);
                        isStop = false;
                    }
                    timeline.create().wait(100).call(function () {
                        effect.opacity = 0.1;
                        effect.hide();
                    });
                });
            };
            for (var x = 0; x < 3; x++) {
                _loop_2(x);
            }
        };
        //リング設置用パネル
        for (var y = 0; y < 3; y++) {
            _loop_1(y);
        }
        var wakus = [];
        //置くリングの枠
        var pWakuBase = new g.E({
            scene: scene,
            x: 380,
            y: 100
        });
        var pWaku = new g.Sprite({
            scene: scene,
            src: scene.assets["waku_p"],
            x: -15,
            y: -15,
            width: 140,
            height: 140
        });
        base.append(pWakuBase);
        pWakuBase.append(pWaku);
        wakus.push(pWakuBase);
        //次のリングの枠
        for (var i = 0; i < 5; i++) {
            var wakuBase = new g.E({
                scene: scene,
                x: 430 + i * 80,
                y: 240
            });
            var w = new g.Sprite({
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
        var setMap = function (map) {
            //フィールド上のリングを確認して置けるリングのサイズを取得
            var list = [];
            for (var y = 0; y < 3; y++) {
                for (var x = 0; x < 3; x++) {
                    var m = maps[y][x];
                    for (var i = 0; i < m.children.length; i++) {
                        if (m.children[i].tag === -1) {
                            list.push(i);
                        }
                    }
                }
            }
            var srcRings = map.children;
            var size = list[scene.random.get(0, list.length - 1)];
            for (var i = 0; i < srcRings.length; i++) {
                var ring = srcRings[i];
                if (i === size) {
                    var num = scene.random.get(0, 3);
                    ring.tag = num;
                    ring.frameNumber = i * 5 + num;
                    ring.modified();
                    ring.show();
                }
                else {
                    ring.tag = -1;
                    ring.hide();
                }
            }
        };
        //置くリング
        var PMap;
        //次のリング生成
        var nextRings = [];
        for (var i = 0; i < 5; i++) {
            var map = new Map(scene, 430 + i * 80, 240);
            map.scale(0.5);
            nextRings.push(map);
            base.append(map);
            setMap(map);
        }
        //消えるエフェクト用
        var effectLines = [];
        //横のライン
        var yokoLineBase = new g.E({ scene: scene, x: 10 + 15, y: 15, width: mapSize * 3, height: mapSize * 3 });
        _this.append(yokoLineBase);
        for (var y = 0; y < 3; y++) {
            var line = new g.FilledRect({
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
        var tateLineBase = new g.E({ scene: scene, x: 10 + 15, y: 15, width: mapSize * 3, height: mapSize * 3, angle: -90 });
        _this.append(tateLineBase);
        for (var y = 0; y < 3; y++) {
            var line = new g.FilledRect({
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
        for (var i = 0; i < 2; i++) {
            var w = (mapSize * 3) * Math.sqrt(2);
            var line = new g.FilledRect({
                scene: scene,
                x: 10 + 15 - ((w - (mapSize * 3)) / 2),
                y: mapSize + 15,
                width: w,
                height: mapSize,
                cssColor: "red",
                angle: 45 + (90 * i)
            });
            _this.append(line);
            effectLines.push(line);
        }
        //ゴミ箱ボタン作成
        var trushCnt = 2;
        var sprTrush = new g.FrameSprite({
            scene: scene,
            src: scene.assets["trush"],
            width: 90,
            height: 90,
            x: 545,
            y: 130,
            frames: [0, 1],
            touchable: true
        });
        _this.append(sprTrush);
        var labelTrush = new g.Label({
            scene: scene,
            font: scene.numFont,
            fontSize: 32,
            text: "*2",
            x: 30,
            y: 55
        });
        sprTrush.append(labelTrush);
        sprTrush.pointDown.add(function () {
            if (trushCnt === 0)
                return;
            trushCnt--;
            sprTrush.frameNumber = 1;
            sprTrush.modified();
            scene.playSound("se_trush");
            timeline.create(PMap).moveTo(sprTrush.x, sprTrush.y, 200).call(function () {
                if (trushCnt === 0) {
                    sprTrush.hide();
                }
                else {
                    sprTrush.frameNumber = 0;
                    sprTrush.modified();
                    labelTrush.text = "*" + trushCnt;
                    labelTrush.invalidate();
                }
                setNextRing();
            });
        });
        var glyph = JSON.parse(scene.assets["glyph72"].data);
        var numFontB = new g.BitmapFont({
            src: scene.assets["number_b"],
            map: glyph.map,
            defaultGlyphWidth: 72,
            defaultGlyphHeight: 80
        });
        var numFontP = new g.BitmapFont({
            src: scene.assets["number_p"],
            map: glyph.map,
            defaultGlyphWidth: 72,
            defaultGlyphHeight: 80
        });
        //同時消しリングの数表示用
        var labelMultiBase = new g.E({ scene: scene, x: 70, y: 100 });
        _this.append(labelMultiBase);
        var sprMulti = new g.Sprite({
            scene: scene,
            src: scene.assets["combo"],
            height: 40,
            x: 90,
            y: 10
        });
        labelMultiBase.append(sprMulti);
        var labelMulti = new g.Label({
            scene: scene,
            font: numFontB,
            text: "0",
            fontSize: 50,
            width: 90,
            textAlign: g.TextAlign.Right, widthAutoAdjust: false
        });
        labelMultiBase.append(labelMulti);
        //コンボ数表示用
        var labelComboBase = new g.E({ scene: scene, x: 70, y: 220 });
        _this.append(labelComboBase);
        var sprCombo = new g.Sprite({
            scene: scene,
            src: scene.assets["combo"],
            height: 40,
            x: 90,
            y: 10,
            srcY: 40
        });
        labelComboBase.append(sprCombo);
        var labelCombo = new g.Label({
            scene: scene,
            font: numFontP,
            text: "0",
            fontSize: 50,
            width: 90,
            textAlign: g.TextAlign.Right, widthAutoAdjust: false
        });
        labelComboBase.append(labelCombo);
        var comboCnt = 0;
        //リングの設置
        var joinRings = function (map) {
            var dstRings = map.children;
            var srcRings = PMap.children;
            //置けるかどうかチェック
            for (var i = 0; i < srcRings.length; i++) {
                if (dstRings[i].tag !== -1 && srcRings[i].tag !== -1) {
                    return false;
                }
            }
            //置く
            timeline.create(PMap).moveTo(map.x, map.y, 150).call(function () {
                for (var i = 0; i < srcRings.length; i++) {
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
        var chkMate = function () {
            for (var y = 0; y < 3; y++) {
                for (var x = 0; x < 3; x++) {
                    for (var i = 0; i < maps[y][x].children.length; i++) {
                        if (maps[y][x].children[i].tag === -1)
                            return false;
                    }
                }
            }
            return true;
        };
        //次に置くリングのリストの更新
        var nowRingNum = 0;
        var setNextRing = function () {
            setMap(PMap);
            for (var i = 0; i < nextRings.length; i++) {
                var srcNum = (nowRingNum + 1 + i) % nextRings.length;
                var srcRing = nextRings[srcNum];
                var w = wakus[i];
                if (i === nextRings.length - 1) {
                    srcRing.hide();
                }
                else {
                    srcRing.show();
                }
                if (i === 0) {
                    timeline.create(srcRing).scaleTo(1.0, 1.0, 200);
                }
                else {
                    srcRing.scale(0.5);
                }
                timeline.create(srcRing).moveTo(w.x, w.y, 200);
            }
            nowRingNum = (nowRingNum + 1) % nextRings.length;
            PMap = nextRings[nowRingNum];
            //置ける場所があるかチェックして、もし置けない場合はもう一度処理する
            var flg = false;
            for (var y = 0; y < 3; y++) {
                for (var x = 0; x < 3; x++) {
                    var map = maps[y][x];
                    for (var i = 0; i < map.children.length; i++) {
                        if (map.children[i].tag === -1 && PMap.children[i].tag !== -1) {
                            flg = true;
                            break;
                        }
                    }
                }
                if (flg)
                    break;
            }
            if (!flg) {
                timeline.create().wait(500).call(function () {
                    setNextRing();
                });
            }
        };
        //一列揃ったかどうかチェック用配列
        var chkList = [];
        for (var y = 0; y < 3; y++) {
            chkList.push({ x: 0, y: y, mx: 1, my: 0 }); //横
        }
        for (var x = 0; x < 3; x++) {
            chkList.push({ x: x, y: 0, mx: 0, my: 1 }); //縦
        }
        chkList.push({ x: 0, y: 0, mx: 1, my: 1 }); //斜め
        chkList.push({ x: 0, y: 2, mx: 1, my: -1 });
        var colors = ["magenta", "cyan", "yellow", "#00ff00"];
        //消す処理
        var clearLine = function () {
            var clearList = [];
            var effectList = [];
            for (var j = 0; j < chkList.length; j++) {
                var e = chkList[j];
                var _loop_3 = function (cNum) {
                    var list = [];
                    var list2 = [];
                    var flg = true;
                    for (var i = 0; i < 3; i++) {
                        var y = e.y + (e.my * i);
                        var x = e.x + (e.mx * i);
                        var rs = maps[y][x];
                        var flgR = false;
                        //リングのサイズ分ループ
                        for (var sNum = 0; sNum < 3; sNum++) {
                            var r = rs.children[sNum];
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
                        clearList = clearList.concat(list); //追加
                        effectList = effectList.concat(list2);
                        //エフェクト表示
                        var effect_1 = effectLines[j];
                        effect_1.scaleX = 0;
                        effect_1.scaleY = 0.1;
                        effect_1.cssColor = colors[cNum];
                        effect_1.show();
                        timeline.create(effect_1).scaleTo(1.2, 0.1, 100).wait(300).call(function () {
                            effect_1.hide();
                        });
                    }
                };
                //色数分ループ
                for (var cNum = 0; cNum < 4; cNum++) {
                    _loop_3(cNum);
                }
            }
            //同色のリングを全て取得
            var getColorRing = function (num) {
                var flg = false;
                for (var y = 0; y < maps.length; y++) {
                    var _loop_4 = function (x) {
                        var map = maps[y][x];
                        var list = map.children.filter(function (e) { return e.tag === num; });
                        clearList = clearList.concat(list); //追加
                        //エフェクト表示
                        if (list.length !== 0) {
                            var effect_2 = effects[y][x];
                            effect_2.show();
                            effect_2.cssColor = colors[num];
                            timeline.create(effect_2).rotateTo(360, 500).call(function () {
                                effect_2.angle = 0;
                                effect_2.hide();
                            });
                            flg = true;
                        }
                    };
                    for (var x = 0; x < maps[y].length; x++) {
                        _loop_4(x);
                    }
                }
                if (flg)
                    scene.playSound("clear2");
            };
            //同じマス目に３つ同じ色が揃っている場合
            for (var y = 0; y < maps.length; y++) {
                var _loop_5 = function (x) {
                    var map = maps[y][x];
                    var num = map.children[0].tag;
                    if (map.children[0].tag !== -1) {
                        if (map.children.every(function (e) { return e.tag === num; })) {
                            getColorRing(num);
                            return "break";
                        }
                    }
                };
                for (var x = 0; x < maps[y].length; x++) {
                    var state_1 = _loop_5(x);
                    if (state_1 === "break")
                        break;
                }
            }
            //重複を削除する （いらないかも）
            clearList = clearList.filter(function (x, i, self) { return self.indexOf(x) === i; });
            effectList = effectList.filter(function (x, i, self) { return self.indexOf(x) === i; });
            effectList.forEach(function (effect) {
                effect.show();
                effect.cssColor = "white";
                effect.angle = 30;
                effect.scale(0.0);
                effect.modified();
                timeline.create(effect).scaleTo(1.2, 1.2, 500).call(function () {
                    effect.angle = 0;
                    effect.scale(1.0);
                    effect.hide();
                });
            });
            if (effectList.length !== 0)
                scene.playSound("clear1");
            //リングを消す
            clearList.forEach(function (ring) {
                ring.tag = -1;
                timeline.create().every(function (a, b) {
                    ring.opacity = 1 - ((b * 2) % 1);
                    ring.modified();
                }, 300).wait(300).call(function () {
                    ring.opacity = 1.0;
                    ring.hide();
                });
            });
            if (clearList.length !== 0) {
                //消した数表示
                labelMultiBase.show();
                labelMulti.text = "" + clearList.length;
                labelMulti.invalidate();
                timeline.create().wait(1000).call(function () {
                    labelMultiBase.hide();
                });
                comboCnt++;
                if (comboCnt > 1) {
                    labelComboBase.show();
                    labelCombo.text = "" + comboCnt;
                    labelCombo.invalidate();
                    timeline.create().wait(1000).call(function () {
                        labelComboBase.hide();
                    });
                }
                scene.setCombo(comboCnt);
                //スコアを追加
                var comboBonus = (comboCnt === 1) ? 1 : ((comboCnt - 1) * 2);
                scene.addScore(((Math.pow(clearList.length - 1, 2) * 60) + 60) * comboBonus);
                return true;
            }
            else {
                comboCnt = 0;
                scene.setCombo(comboCnt);
                return false;
            }
        };
        var isStop = false;
        //リセット
        _this.reset = function () {
            PMap = nextRings[nowRingNum];
            effectLines.forEach(function (e) { return e.hide(); });
            effects.forEach(function (e) { return e.forEach(function (effect) { return effect.hide(); }); });
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
            for (var y = 0; y < maps.length; y++) {
                for (var x = 0; x < maps[y].length; x++) {
                    maps[y][x].children.forEach(function (e) {
                        e.tag = -1;
                        e.hide();
                    });
                }
            }
            setNextRing();
            isStop = false;
        };
        return _this;
    }
    return MainGame;
}(g.E));
exports.MainGame = MainGame;
var Map = /** @class */ (function (_super) {
    __extends(Map, _super);
    function Map(scene, x, y) {
        var _this = _super.call(this, {
            scene: scene,
            x: x,
            y: y,
            width: 110,
            height: 110,
            anchorX: 0.0,
            anchorY: 0.0
        }) || this;
        for (var i = 0; i < 3; i++) {
            var list = [];
            for (var j = 0; j < 15; j++)
                list.push(j);
            var ring = new g.FrameSprite({
                scene: scene,
                src: scene.assets["ring"],
                width: 110,
                height: 110,
                frames: list
            });
            _this.append(ring);
            ring.tag = -1;
            ring.hide();
        }
        return _this;
    }
    return Map;
}(g.E));
