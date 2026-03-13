// ===== 游戏场景 =====
import { Ball, RUBBER_BALL_COLORS } from '../objects/Ball.js';
import { Ribbon } from '../objects/Ribbon.js';
import { Gecko } from '../objects/Gecko.js';
import { spawnExplosion } from '../effects/particles.js';
import { Ripple } from '../effects/ripple.js';
import { FloatingText } from '../effects/floatingText.js';
import { playHitSound, playMissSound, resumeAudio } from '../audio.js';

const SPAWN_INTERVAL = 2200;

function makeStars(W, H) {
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.5 + 0.2,
      speed: Math.random() * 0.005 + 0.002,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return stars;
}

export class GameScene {
  constructor(canvas, ctx, config, onBack) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.config = config;
    this.onBack = onBack;

    this.W = canvas.width;
    this.H = canvas.height;

    this.targets = [];
    this.particles = [];
    this.ripples = [];
    this.floatingTexts = [];
    this.hitCount = 0;   // 触及次数
    this.spawnTimer = 0;
    this.stars = makeStars(this.W, this.H);
    // 橡皮球颜色轮转索引（保证同屏颜色不重复）
    this._rubberColorIdx = 0;

    this._onPointer = this._onPointer.bind(this);
    canvas.addEventListener('pointerdown', this._onPointer);

    for (let i = 0; i < 2; i++) {
      setTimeout(() => this._spawnTarget(), i * 600);
    }
  }

  resize(W, H) {
    this.W = W; this.H = H;
    this.stars = makeStars(W, H);
    for (const t of this.targets) { t.W = W; t.H = H; }
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this._onPointer);
  }

  _spawnTarget() {
    const maxT = this.config.maxTargets || 2;
    const alive = this.targets.filter(t => t.alive && !t.hit).length;
    if (alive >= maxT) return;
    const types = this.config.types;
    const type = types[Math.floor(Math.random() * types.length)];
    const s = this.config.speedMult;
    let obj;
    if (type === 'rubber') {
      // 分配下一个颜色，跳过已在场的橡皮球颜色
      const usedColors = new Set(
        this.targets
          .filter(t => t instanceof Ball && t.type === 'rubber' && t.alive && !t.hit)
          .map(t => RUBBER_BALL_COLORS.indexOf(t.rubberColor))
      );
      let colorIdx = this._rubberColorIdx;
      for (let i = 0; i < RUBBER_BALL_COLORS.length; i++) {
        const candidate = (this._rubberColorIdx + i) % RUBBER_BALL_COLORS.length;
        if (!usedColors.has(candidate)) { colorIdx = candidate; break; }
      }
      this._rubberColorIdx = (colorIdx + 1) % RUBBER_BALL_COLORS.length;
      obj = new Ball(this.W, this.H, 'rubber', s, colorIdx);
    }
    else if (type === 'yarn') obj = new Ball(this.W, this.H, 'yarn', s);
    else if (type === 'ribbon') obj = new Ribbon(this.W, this.H, s);
    else obj = new Gecko(this.W, this.H, s);
    this.targets.push(obj);
  }

  _onPointer(e) {
    e.preventDefault();
    resumeAudio();
    const px = e.clientX, py = e.clientY;

    // 返回按钮区域
    if (px < 80 && py < 80) {
      this.destroy();
      this.onBack();
      return;
    }

    let hit = false;
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (t.hit || !t.alive) continue;
      if (t.contains(px, py)) {
        this.hitCount++;
        this._updateHitDisplay();
        t.triggerHit();
        spawnExplosion(this.particles, t.x, t.y);
        this.ripples.push(new Ripple(px, py, true));
        this.floatingTexts.push(new FloatingText(t.x, t.y - (t.radius || 30), '🐾'));
        playHitSound();
        hit = true;
        break;
      }
    }

    if (!hit) {
      // 未击中：显示猫爪（miss样式）
      this.floatingTexts.push(new FloatingText(px, py, '🐾', 1.8, 600, 'miss'));
      playMissSound();
    }
  }

  _updateHitDisplay() {
    const el = document.getElementById('score');
    if (el) el.textContent = this.hitCount;
  }

  update(dt) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this._spawnTarget();
    }

    // 清理完全死亡的目标（壁虎需等尾巴也消失）
    const prevAlive = this.targets.filter(t => !t.hit && t.alive).length;
    this.targets = this.targets.filter(t => {
      if (t instanceof Gecko) return t.alive || t.tailAlive;
      return t.alive || t.hitAnim > 0;
    });
    const nowAlive = this.targets.filter(t => !t.hit && t.alive).length;
    if (prevAlive > nowAlive && nowAlive < (this.config.maxTargets || 2)) {
      setTimeout(() => this._spawnTarget(), 900);
    }

    for (const t of this.targets) t.update(dt);
    this.particles = this.particles.filter(p => !p.dead);
    for (const p of this.particles) p.update();
    this.ripples = this.ripples.filter(r => !r.dead);
    for (const r of this.ripples) r.update();
    this.floatingTexts = this.floatingTexts.filter(f => !f.dead);
    for (const f of this.floatingTexts) f.update();
  }

  draw(t) {
    const ctx = this.ctx;
    const W = this.W, H = this.H;

    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d0d1a');
    grad.addColorStop(1, '#1a0d2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 星星
    for (const s of this.stars) {
      const alpha = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed + s.phase));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const obj of this.targets) obj.draw(ctx);
    for (const p of this.particles) p.draw(ctx);
    for (const r of this.ripples) r.draw(ctx);
    for (const f of this.floatingTexts) f.draw(ctx);

    // 返回按钮
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(12, 12, 60, 52, 14);
    ctx.fill();
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('🏠', 42, 38);
    ctx.restore();
  }
}
