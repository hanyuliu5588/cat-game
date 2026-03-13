// ===== 球体（橡皮球 / 毛线球）=====
import { playBounceSound } from '../audio.js';

// 橡皮球颜色池（对猫视觉敏感的高饱和色，同屏区分）
export const RUBBER_BALL_COLORS = [
  { fill: '#2080ff', shadow: '#0040c0' }, // 蓝
  { fill: '#20c040', shadow: '#008020' }, // 绿
  { fill: '#f0d020', shadow: '#a08000' }, // 黄
  { fill: '#f07020', shadow: '#a03000' }, // 橙
  { fill: '#20d0d0', shadow: '#008080' }, // 青
  { fill: '#a040e0', shadow: '#600090' }, // 紫
];

export class Ball {
  constructor(W, H, type = 'rubber', speedMult = 1, colorIndex = -1) {
    this.W = W;
    this.H = H;
    this.type = type;

    // 毛线球：随机大小；橡皮球：放大1.3~1.5倍随机
    if (type === 'yarn') {
      this.radius = 20 + Math.random() * 32; // 20~52，大小不恒定
    } else {
      const base = 28 + Math.random() * 10; // 原始 28~38
      const scale = 1.3 + Math.random() * 0.2; // 1.3~1.5
      this.radius = base * scale; // 约 36~57
    }

    // 橡皮球颜色（由外部传入 colorIndex 保证同屏不重复）
    if (type === 'rubber') {
      const idx = colorIndex >= 0 ? colorIndex % RUBBER_BALL_COLORS.length
        : Math.floor(Math.random() * RUBBER_BALL_COLORS.length);
      this.rubberColor = RUBBER_BALL_COLORS[idx];
    }

    // 毛线球颜色
    const yarnColors = ['#e84040', '#e87820', '#4080e8', '#40b840', '#9040e8', '#e840a0'];
    this.yarnColor = yarnColors[Math.floor(Math.random() * yarnColors.length)];
    this.yarnColorDark = this._darken(this.yarnColor, 0.6);

    // 物理 — 无重力，弹射运动
    const baseSpeed = (3.5 + Math.random() * 2) * speedMult;
    const angle = Math.random() * Math.PI * 2;
    this.x = W * 0.2 + Math.random() * W * 0.6;
    this.y = H * 0.2 + Math.random() * H * 0.4;
    this.vx = Math.cos(angle) * baseSpeed;
    this.vy = Math.sin(angle) * baseSpeed;
    this.gravity = 0;
    this.restitution = 1.0;

    // 旋转
    this.angle = 0;
    this.angularVel = (Math.random() - 0.5) * 0.12 * (type === 'yarn' ? 2.5 : 1);

    // 压扁
    this.scaleX = 1;
    this.scaleY = 1;

    // 橡皮球残影
    this.trail = [];
    this.trailMax = 5;
    this.trailTimer = 0;

    // 毛线绳 — 初始就较长，越弹越长
    this.ropePoints = [];
    this.ropeMaxLen = type === 'yarn' ? 60 : 0;
    this.bounceCount = 0;

    // 命中状态
    this.hit = false;       // 已被击中，不可再次击中
    this.hitAnim = 0;
    this.alive = true;
    this.opacity = 0;

    // 毛线球被击中后：继续运动滚出屏幕
    this.rollingOut = false;

    // ===== 走走停停（伏击模式）=====
    this.pauseTimer = 0;
    this.pauseInterval = 1500 + Math.random() * 2500; // 1.5~4秒后停顿
    this.isPaused = false;
    this.pauseDuration = 0;
    this.savedVx = this.vx;
    this.savedVy = this.vy;
  }

  _darken(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
  }

  update(dt) {
    // 走走停停逻辑（橡皮球和毛线球）
    if (!this.hit && !this.rollingOut && this.hitAnim <= 0) {
      this.pauseTimer += dt;
      if (!this.isPaused && this.pauseTimer >= this.pauseInterval) {
        // 进入停顿
        this.isPaused = true;
        this.pauseTimer = 0;
        this.pauseDuration = 500 + Math.random() * 1500; // 停0.5~2秒
        this.savedVx = this.vx;
        this.savedVy = this.vy;
        this.vx = 0;
        this.vy = 0;
      } else if (this.isPaused && this.pauseTimer >= this.pauseDuration) {
        // 结束停顿，突然冲刺（速度1.5~2.5倍）
        this.isPaused = false;
        this.pauseTimer = 0;
        this.pauseInterval = 1500 + Math.random() * 2500;
        const burstScale = 1.5 + Math.random() * 1.0;
        // 随机偏转方向
        const oldAngle = Math.atan2(this.savedVy, this.savedVx);
        const newAngle = oldAngle + (Math.random() - 0.5) * Math.PI * 0.6;
        const speed = Math.sqrt(this.savedVx ** 2 + this.savedVy ** 2) * burstScale;
        this.vx = Math.cos(newAngle) * speed;
        this.vy = Math.sin(newAngle) * speed;
        this.savedVx = this.vx;
        this.savedVy = this.vy;
      }
    }

    // 毛线球被击中后：继续运动直到滚出屏幕
    if (this.rollingOut) {
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.angularVel + this.vx * 0.012;
      this.ropePoints.push({ x: this.x, y: this.y });
      if (this.ropePoints.length > this.ropeMaxLen) this.ropePoints.shift();
      const m = this.radius + 20;
      if (this.x < -m || this.x > this.W + m || this.y < -m || this.y > this.H + m) {
        this.alive = false;
      }
      return;
    }

    // 橡皮球命中动画
    if (this.hitAnim > 0) {
      this.hitAnim -= dt * 0.004;
      if (this.hitAnim <= 0) this.alive = false;
      return;
    }

    if (this.opacity < 1) this.opacity = Math.min(1, this.opacity + dt * 0.004);

    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.angularVel + this.vx * 0.012;

    // 恢复压扁
    this.scaleX += (1 - this.scaleX) * 0.18;
    this.scaleY += (1 - this.scaleY) * 0.18;

    const r = this.radius;
    let bounced = false;

    if (this.x - r < 0) {
      this.x = r; this.vx = Math.abs(this.vx);
      this.angularVel *= -0.8; this._squishH(); bounced = true;
    } else if (this.x + r > this.W) {
      this.x = this.W - r; this.vx = -Math.abs(this.vx);
      this.angularVel *= -0.8; this._squishH(); bounced = true;
    }
    if (this.y - r < 0) {
      this.y = r; this.vy = Math.abs(this.vy);
      this._squishV(); bounced = true;
    } else if (this.y + r > this.H) {
      this.y = this.H - r; this.vy = -Math.abs(this.vy);
      this._squishV(); bounced = true;
    }

    if (bounced) {
      playBounceSound();
      this.bounceCount++;
      if (this.type === 'yarn') {
        this.ropeMaxLen = Math.min(200, 60 + this.bounceCount * 12);
      }
    }

    // 橡皮球：记录残影
    if (this.type === 'rubber') {
      this.trailTimer += dt;
      if (this.trailTimer > 30) {
        this.trailTimer = 0;
        this.trail.push({ x: this.x, y: this.y, angle: this.angle, scaleX: this.scaleX, scaleY: this.scaleY });
        if (this.trail.length > this.trailMax) this.trail.shift();
      }
    }

    // 毛线球：记录绳子轨迹
    if (this.type === 'yarn') {
      this.ropePoints.push({ x: this.x, y: this.y });
      if (this.ropePoints.length > this.ropeMaxLen) this.ropePoints.shift();
    }
  }

  _squishV() { this.scaleX = 1.35; this.scaleY = 0.65; }
  _squishH() { this.scaleX = 0.65; this.scaleY = 1.35; }

  triggerHit() {
    if (this.hit) return;
    this.hit = true;
    if (this.type === 'yarn') {
      // 毛线球：继续滚动直到出屏幕
      this.rollingOut = true;
    } else {
      // 橡皮球：播放消失动画
      this.hitAnim = 1.0;
    }
  }

  draw(ctx) {
    // 橡皮球命中动画
    if (this.hitAnim > 0) {
      const progress = 1 - this.hitAnim;
      const scale = 1 + progress * 1.4;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.hitAnim);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle + progress * Math.PI);
      ctx.scale(scale, scale);
      this._drawTennisBall(ctx, this.radius);
      ctx.restore();
      return;
    }

    if (this.type === 'rubber') {
      this._drawRubberBall(ctx);
    } else {
      this._drawYarnBall(ctx);
    }
  }

  _drawRubberBall(ctx) {
    // 残影
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const alpha = (i / this.trail.length) * 0.35 * this.opacity;
      const scale = 0.5 + (i / this.trail.length) * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(t.x, t.y);
      ctx.rotate(t.angle);
      ctx.scale(t.scaleX * scale, t.scaleY * scale);
      this._drawTennisBall(ctx, this.radius);
      ctx.restore();
    }

    // 本体
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scaleX, this.scaleY);
    this._drawTennisBall(ctx, this.radius);
    ctx.restore();
  }

  _drawTennisBall(ctx, r) {
    const c = this.rubberColor || { fill: '#d4f040', shadow: 'rgba(160,200,30,0.4)' };
    // 高光色（fill 加亮）
    const lighterFill = this._lighten(c.fill, 1.5);
    const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    grad.addColorStop(0, lighterFill);
    grad.addColorStop(0.6, c.fill);
    grad.addColorStop(1, c.shadow);
    ctx.fillStyle = grad;
    ctx.shadowColor = c.fill + '88';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = r * 0.12;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, -0.4, 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, Math.PI - 0.4, Math.PI + 0.4);
    ctx.stroke();
  }

  _drawYarnBall(ctx) {
    // 毛线绳
    if (this.ropePoints.length > 2) {
      ctx.save();
      ctx.globalAlpha = (this.rollingOut ? 0.9 : this.opacity * 0.85);
      ctx.strokeStyle = this.yarnColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = this.yarnColor;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(this.ropePoints[0].x, this.ropePoints[0].y);
      for (let i = 1; i < this.ropePoints.length - 1; i++) {
        const mx = (this.ropePoints[i].x + this.ropePoints[i + 1].x) / 2;
        const my = (this.ropePoints[i].y + this.ropePoints[i + 1].y) / 2;
        ctx.quadraticCurveTo(this.ropePoints[i].x, this.ropePoints[i].y, mx, my);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 本体
    ctx.save();
    ctx.globalAlpha = this.rollingOut ? 0.9 : this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scaleX, this.scaleY);
    this._drawYarnSphere(ctx, this.radius);
    ctx.restore();
  }

  _drawYarnSphere(ctx, r) {
    const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.05, 0, 0, r);
    grad.addColorStop(0, this._lighten(this.yarnColor, 1.4));
    grad.addColorStop(0.5, this.yarnColor);
    grad.addColorStop(1, this.yarnColorDark);
    ctx.fillStyle = grad;
    ctx.shadowColor = this.yarnColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = this._lighten(this.yarnColor, 1.3);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha *= 0.6;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, a, a + Math.PI * 0.6);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.globalAlpha *= 0.8;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rx = Math.cos(a) * r;
      const ry = Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(rx * 0.85, ry * 0.85);
      ctx.lineTo(rx * 1.08 + (Math.random() - 0.5) * 4, ry * 1.08 + (Math.random() - 0.5) * 4);
      ctx.stroke();
    }
  }

  _lighten(hex, factor) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) * factor);
    return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
  }

  contains(px, py) {
    if (this.hit) return false; // 已被击中，不可再次击中
    return Math.hypot(px - this.x, py - this.y) < this.radius * 1.15;
  }
}
