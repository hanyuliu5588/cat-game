// ===== 壁虎 =====
import { playBounceSound } from '../audio.js';

export class Gecko {
  constructor(W, H, speedMult = 1) {
    this.W = W;
    this.H = H;
    this.speedMult = speedMult;

    // 尺寸（随机 ±30%）
    const sizeScale = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3
    this.sizeScale = sizeScale;
    this.bodyLen = 44 * sizeScale;
    this.bodyW = 16 * sizeScale;
    this.headR = 14 * sizeScale;
    this.tailLen = 52 * sizeScale;
    this.radius = this.headR + 4; // 碰撞半径

    // 颜色
    const colors = [
      { body: '#4a8c30', dark: '#2a5018', eye: '#ffdd00' },
      { body: '#8c6030', dark: '#503010', eye: '#ff8800' },
      { body: '#306080', dark: '#183040', eye: '#80ffff' },
    ];
    this.col = colors[Math.floor(Math.random() * colors.length)];

    // 位置（从边缘出现）
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { this.x = Math.random() * W; this.y = 60; }
    else if (side === 1) { this.x = W - 60; this.y = Math.random() * H; }
    else if (side === 2) { this.x = Math.random() * W; this.y = H - 60; }
    else { this.x = 60; this.y = Math.random() * H; }

    // 移动
    this.baseSpeed = (1.2 + Math.random() * 0.8) * speedMult;
    this.currentSpeed = this.baseSpeed;
    this.targetSpeed = this.baseSpeed;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.currentSpeed;
    this.vy = Math.sin(angle) * this.currentSpeed;
    this.facing = Math.atan2(this.vy, this.vx); // 朝向角度

    // 速度变化（不恒定）
    this.speedChangeTimer = 0;
    this.speedChangeInterval = 800 + Math.random() * 1500;

    // 停顿
    this.pauseTimer = 0;
    this.pauseInterval = 2000 + Math.random() * 3000;
    this.isPaused = false;
    this.pauseDuration = 0;

    // 腿部动画
    this.legPhase = 0;

    // 尾巴摆动
    this.tailPhase = 0;
    this.tailAmp = 0.3;

    // 命中状态
    this.hit = false;
    this.hitTimer = 0;

    // 头身逃跑
    this.escapeVx = 0;
    this.escapeVy = 0;
    this.escapeOpacity = 1;

    // 尾巴残留
    this.tailAlive = false;
    this.tailX = 0;
    this.tailY = 0;
    this.tailAngle = 0;
    this.tailWag = 0;
    this.tailWagSpeed = 0.18;
    this.tailOpacity = 1;

    this.alive = true;
    this.opacity = 0;
  }

  update(dt) {
    if (this.opacity < 1) this.opacity = Math.min(1, this.opacity + dt * 0.003);

    if (this.hit) {
      // 头身逃跑
      this.hitTimer += dt;
      const escSpeed = (8 + this.hitTimer * 0.02) * this.speedMult;
      this.x += this.escapeVx * escSpeed * dt * 0.06;
      this.y += this.escapeVy * escSpeed * dt * 0.06;
      this.escapeOpacity = Math.max(0, 1 - this.hitTimer / 600);
      if (this.escapeOpacity <= 0) this.alive = false;

      // 尾巴摆动
      if (this.tailAlive) {
        this.tailWag += this.tailWagSpeed;
        this.tailOpacity = Math.max(0, 1 - this.hitTimer / 1200);
        if (this.tailOpacity <= 0) this.tailAlive = false;
      }
      return;
    }

    // 停顿逻辑
    this.pauseTimer += dt;
    if (!this.isPaused && this.pauseTimer >= this.pauseInterval) {
      this.isPaused = true;
      this.pauseTimer = 0;
      this.pauseDuration = 400 + Math.random() * 600;
    }
    if (this.isPaused && this.pauseTimer >= this.pauseDuration) {
      this.isPaused = false;
      this.pauseTimer = 0;
      this.pauseInterval = 2000 + Math.random() * 3000;
      // 随机转向
      const newAngle = Math.atan2(this.vy, this.vx) + (Math.random() - 0.5) * Math.PI * 1.2;
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      this.vx = Math.cos(newAngle) * speed;
      this.vy = Math.sin(newAngle) * speed;
    }

    // 速度不恒定：随机加减速
    this.speedChangeTimer += dt;
    if (this.speedChangeTimer >= this.speedChangeInterval) {
      this.speedChangeTimer = 0;
      this.speedChangeInterval = 800 + Math.random() * 1500;
      // 目标速度在基础速度的 40%~180% 之间随机
      this.targetSpeed = this.baseSpeed * (0.4 + Math.random() * 1.4);
    }
    // 平滑过渡到目标速度
    this.currentSpeed += (this.targetSpeed - this.currentSpeed) * 0.04;

    if (!this.isPaused) {
      const dir = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
      this.vx = (this.vx / dir) * this.currentSpeed;
      this.vy = (this.vy / dir) * this.currentSpeed;
      this.x += this.vx;
      this.y += this.vy;
      this.facing = Math.atan2(this.vy, this.vx);
      this.legPhase += 0.1 + (this.currentSpeed / this.baseSpeed) * 0.15;
    }

    this.tailPhase += 0.08;

    // 边界反弹
    const m = 30;
    if (this.x < m) { this.x = m; this.vx = Math.abs(this.vx); this.facing = Math.atan2(this.vy, this.vx); }
    else if (this.x > this.W - m) { this.x = this.W - m; this.vx = -Math.abs(this.vx); this.facing = Math.atan2(this.vy, this.vx); }
    if (this.y < m) { this.y = m; this.vy = Math.abs(this.vy); this.facing = Math.atan2(this.vy, this.vx); }
    else if (this.y > this.H - m) { this.y = this.H - m; this.vy = -Math.abs(this.vy); this.facing = Math.atan2(this.vy, this.vx); }
  }

  triggerHit() {
    if (this.hit) return;
    this.hit = true;
    this.hitTimer = 0;

    // 记录尾巴位置
    this.tailAlive = true;
    this.tailX = this.x - Math.cos(this.facing) * (this.bodyLen + this.headR);
    this.tailY = this.y - Math.sin(this.facing) * (this.bodyLen + this.headR);
    this.tailAngle = this.facing;
    this.tailWag = 0;
    this.tailOpacity = 1;

    // 逃跑方向（沿当前朝向加速）
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
    this.escapeVx = this.vx / speed;
    this.escapeVy = this.vy / speed;
  }

  draw(ctx) {
    // 先画残留尾巴
    if (this.tailAlive) {
      ctx.save();
      ctx.globalAlpha = this.tailOpacity;
      ctx.translate(this.tailX, this.tailY);
      ctx.rotate(this.tailAngle + Math.PI + Math.sin(this.tailWag) * 0.5);
      this._drawTail(ctx, this.tailLen * 1.1);
      ctx.restore();
    }

    if (!this.alive && !this.tailAlive) return;
    if (this.alive || this.hit) {
      ctx.save();
      ctx.globalAlpha = this.hit ? this.escapeOpacity : this.opacity;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.facing);
      this._drawBody(ctx);
      ctx.restore();
    }
  }

  _drawBody(ctx) {
    const c = this.col;
    const bL = this.bodyLen;
    const bW = this.bodyW;
    const hR = this.headR;

    // 尾巴（连接在身体后方）
    ctx.save();
    ctx.translate(-bL - hR, 0);
    ctx.rotate(Math.sin(this.tailPhase) * this.tailAmp);
    this._drawTail(ctx, this.tailLen);
    ctx.restore();

    // 腿（4条）
    this._drawLegs(ctx, bL, bW);

    // 身体
    ctx.fillStyle = c.body;
    ctx.shadowColor = c.dark;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(-bL / 2, 0, bL / 2 + hR * 0.3, bW / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 身体纹路
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.globalAlpha *= 0.5;
    for (let i = 0; i < 4; i++) {
      const bx = -bL * 0.8 + i * (bL * 0.55);
      ctx.beginPath();
      ctx.ellipse(bx, 0, bW * 0.25, bW * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha /= 0.5;

    // 头部
    ctx.shadowBlur = 8;
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.ellipse(hR * 0.2, 0, hR * 1.1, hR * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(hR * 0.5, -hR * 0.35, hR * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hR * 0.5, hR * 0.35, hR * 0.28, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛高光
    ctx.fillStyle = c.eye;
    ctx.beginPath();
    ctx.arc(hR * 0.55, -hR * 0.38, hR * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hR * 0.55, hR * 0.32, hR * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTail(ctx, len) {
    const c = this.col;
    ctx.strokeStyle = c.body;
    ctx.lineWidth = this.bodyW * 0.55;
    ctx.lineCap = 'round';
    ctx.shadowColor = c.dark;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-len * 0.4, len * 0.25, -len, 0);
    ctx.stroke();
    // 尾尖细化
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-len * 0.6, len * 0.1);
    ctx.quadraticCurveTo(-len * 0.8, len * 0.05, -len, 0);
    ctx.stroke();
  }

  _drawLegs(ctx, bL, bW) {
    const c = this.col;
    ctx.strokeStyle = c.body;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 0;

    const legPositions = [
      { bx: -bL * 0.65, side: -1 }, { bx: -bL * 0.65, side: 1 },
      { bx: -bL * 0.25, side: -1 }, { bx: -bL * 0.25, side: 1 },
    ];

    legPositions.forEach((lp, i) => {
      const swing = Math.sin(this.legPhase + i * Math.PI * 0.5) * 8;
      const lx = lp.bx;
      const ly = lp.side * (bW * 0.5);
      const ex = lx - lp.side * 2 + swing * 0.3;
      const ey = lp.side * (bW * 1.4 + Math.abs(swing));
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.quadraticCurveTo(lx + swing * 0.2, (ly + ey) / 2, ex, ey);
      ctx.stroke();
    });
  }

  contains(px, py) {
    if (this.hit) return false;
    return Math.hypot(px - this.x, py - this.y) < (this.bodyLen + this.headR) * 0.7;
  }
}
