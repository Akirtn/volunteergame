// phina.js をグローバル領域に展開
phina.globalize();
 
// ファイル読み込み
var ASSETS = {
  //画像
  image: {
    bg: 'img/bg.png',
    bg2: 'img/bg.png',
    egg: 'img/egg.png',
    tomapiko: 'https://rawgit.com/phi-jp/phina.js/develop/assets/images/tomapiko_ss.png'
  },
  //フレームアニメーション情報
  spritesheet: {
    'tomapiko_ss': 'https://rawgit.com/phi-jp/phina.js/develop/assets/tmss/tomapiko.tmss',
  },
};
// 定数
var SCREEN_WIDTH = 465;  // スクリーン幅
var SCREEN_HEIGHT = 465;  // スクリーン高さ
var JUMP_POWOR = 10; // ジャンプ力
var GRAVITY = 0.5; // 重力
var JUMP_FLG = false; // ジャンプ中かどうか
var EGG_ATACK = 5; //卵の移動速度
var EGG_DIE = false; //卵が割れてるかどうか
var HIT_RADIUS     = 16;  // 当たり判定用の半径
var SCORE = 0; // スコア
bindPage();

async function bindPage() {
     // posenetの呼び出し
    const net = await posenet.load();
    let video;
    try {
         // video属性をロード
        video = await loadVideo();
    } catch(e) {
        console.error(e);
        return;
    }
    detectPoseInRealTime(video, net);
}

async function loadVideo() {
  // カメラのセットアップ
  const video = await setupCamera();
  video.play();
  return video;
}
// カメラのセットアップ
// video属性からストリームを取得する
async function setupCamera() {
  const video = document.getElementById('video');
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
          'audio': false,
          'video': true});
      video.srcObject = stream;

      return new Promise(resolve => {
          video.onloadedmetadata = () => {
              resolve(video);
          };
      });
  } else {
      const errorMessage = "This browser does not support video capture, or this device does not have a camera";
      alert(errorMessage);
      return Promise.reject(errorMessage);
  }
}


// 取得したストリームをestimateSinglePose()に渡して姿勢予測を実行
// requestAnimationFrameによってフレームを再描画し続ける
function detectPoseInRealTime(video, net) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const flipHorizontal = true; // since images are being fed from a webcam

  async function poseDetectionFrame() {
      stats.begin();
      let poses = [];
      const pose = await net.estimateSinglePose(video, imageScaleFactor, flipHorizontal, outputStride);
      poses.push(pose);

      ctx.clearRect(0, 0, SCREEN_WIDTH,SCREEN_HEIGHT);

      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-SCREEN_WIDTH, 0);
      ctx.drawImage(video, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.restore();

if (timeLimit % 10 == 0) {
    printLimit = timeLimit / 10;
}
ctx.font = fontLayout;
ctx.fillStyle = "blue";
ctx.fillText(printLimit, 670, 70);
ctx.fill();

if (timeLimit == 0) {
    ctx.font = fontLayout;
    ctx.fillStyle = "red";
    ctx.fillText("TIME UP", 300, 300);
    ctx.fill();
} else {
        poses.forEach(({ s, keypoints }) => {
  drawNaviko(keypoints[0],keypoints[1],ctx);
  // keypoints[9]には左手、keypoints[10]には右手の予測結果が格納されている 
  //if you want to know detail about  keipoints nubmer pleasesee https://github.com/tensorflow/tfjs-models/tree/master/posenet 
  drawWristPoint(keypoints[9],ctx);
  drawWristPoint(keypoints[10],ctx);
  ballsDecision(ctx,[keypoints[9],keypoints[10]]);
          });
}

ctx.font = fontLayout;
ctx.fillStyle = "red";
ctx.fillText(score, 70, 70);
ctx.fill();
timeLimit -= 1;
if(timeLimit <= 0){
    timeLimit = 0;
}

      stats.end();

      requestAnimationFrame(poseDetectionFrame);
  }
  poseDetectionFrame();
}

// 与えられたKeypointをcanvasに描画する
function drawWristPoint(wrist,ctx){
  ctx.beginPath();
  ctx.arc(wrist.position.x , wrist.position.y, 3, 0, 2 * Math.PI);
  ctx.fillStyle = "pink";
  ctx.fill();
}
/*
 * Gameメインシーン
 */
phina.define("MainScene", {
  // 継承
  superClass: 'DisplayScene',
 
  // 初期化
  init: function(options) {
    // super init
    this.superInit(options);
 
    //1回目の初期化
    SCORE = 0;
    EGG_ATACK = 5;
    EGG_DIE = false;
    JUMP_FLG = false;
 
    // 背景
    this.bg = Sprite("bg").addChildTo(this);
    this.bg.origin.set(0, 0); // 左上基準に変更
    // ループ用の背景
    this.bg2 = Sprite("bg2").addChildTo(this);
    this.bg2.origin.set(0, 0); // 左上基準に変更
    this.bg2.setPosition(SCREEN_WIDTH, 0);
 
    //スコア表示
    this.scoreLabel = Label('SCORE:'+SCORE).addChildTo(this);
    this.scoreLabel.x = this.gridX.center();
    this.scoreLabel.y = this.gridY.span(4);
    this.scoreLabel.fill = 'gray';
 
    // 障害物（卵）
    this.egg = Sprite('egg', 48, 48).addChildTo(this);
    this.egg.setPosition(SCREEN_WIDTH, 310);
    this.egg.frameIndex = 0;
 
    // プレイヤー
    var player = Player('tomapiko').addChildTo(this);
    player.setPosition(100, 300);
    this.player = player;
 
    // 画面タッチ時処理
    // this.onpointend = function() {
      if(){
      if(JUMP_FLG == false) {
        JUMP_FLG = true;
        player.anim.gotoAndPlay('fly');
        player.scaleX *= -1;
        player.physical.velocity.y = -JUMP_POWOR;
        player.physical.gravity.y = GRAVITY;
      }
    }
  },
 
  // 更新
  update: function(app) {
 
    //背景画像の移動
    this.bg.x -= 1;
    this.bg2.x -= 1;
    if(this.bg.x <= -SCREEN_WIDTH) {
      this.bg.x = 0;
      this.bg2.x = SCREEN_WIDTH;
    }
 
    //プレイヤーのアニメーション
    var player = this.player;
    if(player.y > 310) {  //地面に着地時
      player.y = 300;
      JUMP_FLG = false;
      player.anim.gotoAndPlay('right');
      player.scaleX *= -1;
      player.physical.velocity.y = 0;
      player.physical.gravity.y = 0;
    }
 
    //卵のアニメ
    var egg = this.egg;
    if(EGG_DIE == false){
      egg.rotation -= EGG_ATACK;
      if(egg.x < 0){
        egg.x = SCREEN_WIDTH+100;
        SCORE += 100;
        EGG_ATACK += 2;
        this.scoreLabel.text = 'SCORE:'+SCORE;
      }
    } else {
      egg.rotation = 0;
      if(egg.x < 0){
        this.exit({
          score: SCORE,
        });
      }
    }
    egg.x -= EGG_ATACK;
    // 卵とプレイヤーの辺り判定
    this.hitTestEnemyPlayer();
  },
  hitTestEnemyPlayer: function() {
    var player = this.player;
    var egg = this.egg;
 
    // 判定用の円
    var c1 = Circle(player.x, player.y, HIT_RADIUS);
    var c2 = Circle(egg.x, egg.y, HIT_RADIUS);
    // 円判定
    if (Collision.testCircleCircle(c1, c2)) {
      EGG_DIE = true;
      egg.frameIndex = 1;
      egg.scaleY = egg.scaleX = 1.1;
      player.x = egg.x-30;
      player.anim.gotoAndPlay('damage');
    }
  }
});
 
/*
 * プレイヤークラス
 */
phina.define('Player', {
  superClass: 'Sprite',
  // コンストラクタ
  init: function(image) {
    // 親クラス初期化
    this.superInit(image);
    // フレームアニメーションをアタッチ
    this.anim = FrameAnimation('tomapiko_ss').attachTo(this);
    // 初期アニメーション指定
    this.anim.gotoAndPlay('right');
  },
  // 毎フレーム処理
  update: function() {
  },
});
 
/*
 * メイン処理
 */
phina.main(function() {
  // アプリケーションを生成
  var app = GameApp({
    title: 'START',
    startLabel: 'title',   // TitleScene から開始
    width: SCREEN_WIDTH,  // 画面幅
    height: SCREEN_HEIGHT,// 画面高さ
    assets: ASSETS,       // アセット読み込み
  });
 
  // 実行
  app.run();
});