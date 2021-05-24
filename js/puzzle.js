'use strict';

//col,row => x,y
(() => {
    //--- パズルの基本描画クラス
    class PuzzleRenderer {
        constructor(puzzle, canvas) {    //パズルデータを管理するPuzzleインスタンスと描画領域の差し替えのためのcanvasを渡す
            this.puzzle = puzzle;
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d');
            this.TILE_SIZE = 70;
            this.img = document.createElement('img');
            // this.img.src = 'img/15puzzle.png';
            this.img.src = 'img/animal2.png';
            this.img.addEventListener('load', () => {
                this.render();
            });

            //canvasをクリックしたときの処理
            this.canvas.addEventListener('click', e => {
                //既にクリア状態なら処理をしない
                if (this.puzzle.getCompletedStatus()) {
                    return;
                };
                
                const rect = this.canvas.getBoundingClientRect();   //※1
                //クリックしたタイルを「col:x位置(0~3); row:y位置(0~3)」で取得
                //viewportに対しての座標(clientX)ではなくcanvas上での座標をとるため、その差分(rect.left)を計算
                const col = Math.floor((e.clientX - rect.left) / this.TILE_SIZE);
                const row = Math.floor((e.clientY - rect.top) / this.TILE_SIZE);
                this.puzzle.swapTiles(col, row);   //タイルの入れ替え
                this.render();              //タイルの再描画

                //isCompleteがtrueなら、renderGameClearを作動
                if (this.puzzle.isComplete()) {
                    this.puzzle.setCompletedStatus(true);
                    this.renderGameClear();
                }

            });
        }


        //クリア時の画面表示
        renderGameClear() {
            //薄いグレーで画面を覆う
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            //文字の表示
            this.ctx.font = '32px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('GAME CLEAR!!', 30, 150);
        }

        //タイルの描画
        render() {
            for (let row = 0; row < this.puzzle.getBoardSize(); row++) {
                for (let col = 0; col < this.puzzle.getBoardSize(); col++) {
                    // this.renderTile(this.tiles[row][col], col, row);
                    this.renderTile(this.puzzle.getTile(row, col), col, row);
                }
            }
        }


        //タイル描画の基本設定（png画像とcanvas座標の対応）=> renderメソッド内で使用
        renderTile(n, col, row) {
            //blankTile(n=15)の描画
            if (n === this.puzzle.getBlankIndex()) {
                this.ctx.fillStyle = '#eee';
                this.ctx.fillRect(
                    col * this.TILE_SIZE,
                    row * this.TILE_SIZE,
                    this.TILE_SIZE,
                    this.TILE_SIZE
                );
            }
            //blankTile以外(n=15)の描画 
            else {
                this.ctx.drawImage(       //ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
                    this.img,
                    // sx, sy, 70, 70,(pngファイルの座標とサイズ70px*70px)
                    // dx, dy, 70, 70,(描画先座標とサイズ70px*70px)
                    (n % this.puzzle.getBoardSize()) * this.TILE_SIZE,
                    Math.floor(n / this.puzzle.getBoardSize()) * this.TILE_SIZE,
                    this.TILE_SIZE,
                    this.TILE_SIZE,
                    col * this.TILE_SIZE,
                    row * this.TILE_SIZE,
                    this.TILE_SIZE,
                    this.TILE_SIZE
                )
            }
        }
    }




    //--- パズルのデータクラス
    class Puzzle {
        constructor(level) {
            this.canvas = canvas;
            this.level = level;
            this.tiles = [
                [0, 1, 2, 3],
                [4, 5, 6, 7],
                [8, 9, 10, 11],
                [12, 13, 14, 15],
            ];
            this.UDLR = [      //shuffle()内で、上下左右のdest値とblank値との差異をUDLR配列として保持
                [0, -1], //up
                [0, 1], //down
                [-1, 0], //left
                [1, 0], //up
            ];

            this.isCompleted = false;   //クリア状態であればtrue
            this.BOARD_SIZE = this.tiles.length;        //「tiles配列の要素数 = BOARDがtile何枚分かを示す数」になる
            this.BLANK_INDEX = this.BOARD_SIZE ** 2 - 1;    //BlankTileはtiles配列の最後となる


            //level数の回数、シャッフルする
            do {
                this.shuffle(this.level);
            } while (this.isComplete());   //シャッフルした時点でクリア状態となった場合はもう一度処理する

        }


        //--↓　setterやgetterの定義
        getBoardSize() {
            return this.BOARD_SIZE;
        }

        getBlankIndex() {
            return this.BLANK_INDEX;
        }

        getCompletedStatus() {
            return this.isCompleted;
        }

        setCompletedStatus(value) {
            this.isCompleted = value;
        }

        getTile(row, col) {
            return this.tiles[row][col];
        }
        //--↑　setterやgetterの定義


        //スタート時にtilesをシャッフルするメソッド(「空欄15を完成画面からn回移動させる」と考える)
        shuffle(n) {
            let blankCol = this.BOARD_SIZE - 1;   //初期の空欄タイル15の位置
            let blankRow = this.BOARD_SIZE - 1;

            for (let i = 0; i < n; i++) {     //n回実行
                let destCol;    //空欄タイルを動かす方向を表現
                let destRow;

                do {
                    //空欄タイルを動かす方向をランダムに指定
                    const dir = Math.floor(Math.random() * this.UDLR.length);

                    destCol = blankCol + this.UDLR[dir][0];
                    destRow = blankRow + this.UDLR[dir][1];

                    //下記のswitch文をL75からの2行で書き換えている
                    // switch (dir) {
                    //     case 0:             //up
                    //         destCol = blankCol + UDLR[0][0];
                    //         destRow = blankRow + UDLR[0][1];
                    //         break;
                    //     case 1:             //down
                    //         destCol = blankCol + UDLR[1][0];
                    //         destRow = blankRow + UDLR[1][1];
                    //         break;
                    //     case 2:             //left
                    //         destCol = blankCol + UDLR[2][0];
                    //         destRow = blankRow + UDLR[2][1];
                    //         break;
                    //     case 3:             //right
                    //         destCol = blankCol + UDLR[3][0];
                    //         destRow = blankRow + UDLR[3][1];
                    //         break;
                    // }

                } while (this.isOutside(destCol, destRow));    //destタイルがcanvasの範囲(0~3)を超える場合、やり直し

                //destタイルが定まったら、destタイルと空欄タイルを入れ替え
                [
                    [this.tiles[blankRow][blankCol]],
                    [this.tiles[destRow][destCol]],
                ] = [
                        [this.tiles[destRow][destCol]],
                        [this.tiles[blankRow][blankCol]],
                    ];

                //for文の次の試行に移行するため、blankColとblankRowを更新
                [blankCol, blankRow] = [destCol, destRow];

            }
        }


        //タイルの入れ替えを示すメソッド => Puzzleのコンストラクタのclickイベントで使用
        //引数は 「クリックしたタイルのx位置(0~3), y位置(0~3)」 を表す
        swapTiles(col, row) {
            //クリックしたタイルが空欄(15)の場合何もしない
            if (this.tiles[row][col] === this.BLANK_INDEX) {
                return;
            }

            //クリックしたタイルと隣接するタイル4枚を表現(destタイルとする)
            for (let i = 0; i < this.UDLR.length; i++) {
                const destCol = col + this.UDLR[i][0];
                const destRow = row + this.UDLR[i][1];

                //destタイルがcanvasの範囲(0~3)を超えたら、ループ処理をスキップ
                if (this.isOutside(destCol, destRow)) {
                    continue;
                };

                //dest値で指定されたタイル(destタイル)が空欄(15)なら、クリックしたタイルとdestタイルを入れ替える
                if (this.tiles[destRow][destCol] === this.BLANK_INDEX) {
                    [
                        this.tiles[row][col],
                        this.tiles[destRow][destCol],
                    ] = [
                            this.tiles[destRow][destCol],
                            this.tiles[row][col],
                        ];
                    break;  //入れ替えたら、for文は途中であろうとも終了
                }
            }
        };


        //destタイルがcanvasの範囲(0~3)を超えたらtrue, 
        isOutside(destCol, destRow) {
            return (
                0 > destCol || destCol > this.BOARD_SIZE - 1 ||
                0 > destRow || destRow > this.BOARD_SIZE - 1
            )
        }


        //クリア状態を判定する
        //パネルを一枚ずつ確認し、正しい位置にいない場合はfalseを返す
        isComplete() {
            let i = 0;
            for (let row = 0; row < this.BOARD_SIZE; row++) {
                for (let col = 0; col < this.BOARD_SIZE; col++) {
                    if (this.tiles[row][col] !== i++) {
                        return false;
                    }
                }
            }
            //全てfalseとならなかった場合は、trueを返す。
            return true;
        }
    }


    const canvas = document.querySelector('canvas');
    if (typeof canvas.getContext === 'undefined') {
        return;
    }


    new PuzzleRenderer(new Puzzle(50), canvas);
})();



//※１ elm.getBoundingClientRect()で得られるオブジェクト
// => elmの寸法とそのビューポートに対する位置
// DOMRect{
// width: 280
// height: 280
// left: 211
// right: 491
// top: 8
// bottom: 288
//}

