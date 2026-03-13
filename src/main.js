// ===== 猫咪游戏 - 主入口 =====
import './style.css';
import { MenuScene } from './scenes/menuScene.js';
import { GameScene } from './scenes/gameScene.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let W = 0, H = 0;
let currentScene = null; // GameScene | null
let animId = null;
let lastTime = 0;

// ===== 尺寸调整 =====
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  if (currentScene) currentScene.resize(W, H);
}
window.addEventListener('resize', resize);
resize();

// ===== 场景切换 =====
function showMenu() {
  // 隐藏得分
  document.getElementById('score-display').style.display = 'none';
  currentScene = null;
  new MenuScene((config) => {
    startGame(config);
  });
}

function startGame(config) {
  // 显示得分
  const scoreDisplay = document.getElementById('score-display');
  scoreDisplay.style.display = 'block';
  document.getElementById('score').textContent = '0';

  currentScene = new GameScene(canvas, ctx, config, () => {
    currentScene = null;
    showMenu();
  });
}

// ===== 主循环 =====
function loop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 50); // 限制最大 dt 防止跳帧
  lastTime = timestamp;

  if (currentScene) {
    currentScene.update(dt);
    currentScene.draw(timestamp);
  } else {
    // 菜单背景：简单深色
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);
  }

  animId = requestAnimationFrame(loop);
}

// ===== 启动 =====
requestAnimationFrame((t) => {
  lastTime = t;
  loop(t);
});

showMenu();
