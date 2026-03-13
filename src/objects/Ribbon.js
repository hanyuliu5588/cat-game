// ===== 彩带（丝绸飘带）=====
export class Ribbon {
  constructor(W, H, speedMult = 1) {
    this.W = W;
    this.H = H;

    // 丝绸颜色方案
    const schemes = [
      { main: '#e82020', light: '#ff6060', dark: '#800000' },
      { main: '#e8a000', light: '#ffd060', dark: '#805000' },
      { main: '#c020e8', light: '#e880ff', dark: '#600080' },
      { main: '#2060e8', light: '#60a0ff', dark: '#003080' },
      { main: '#e82080', light: '#ff70b0', dark: '#800040' },
    ];
    this.color = schemes[Math.floor(Math.random() * schemes.length)];

    this.radius = 40; // 碰撞半径（头部）
    this.width = 18;  // 飘带宽度

    // 从边缘出现
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { this.x = Math.random() * W; this.y = -60; }
    else if (side === 1) { this.x = W + 60; this.y = Math.random() * H; }
    else if (side === 2) { this.x = Math.random() * W; this.y = H + 60; }
    else { this.x = -60; this.y = Math.random() * H; }

    // 朝向屏幕中心
    const cx = W * 0.25 + Math.random() * W * 0.5;
    const cy = H * 0.25 + Math.random() * H * 0.5;
    const dx = cx - this.x, dy = cy - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const baseSpeed = (2.0 + Math.random() * 1.5) * speedMult;
    this.vx = (dx / dist) * baseSpeed;
    this.vy = (dy / dist) * baseSpeed;

    // 弹簧链节点（飘带身体）
    this.segCount = 10;
    this.segments = [];
    for (let i = 0; i < this.segCount; i++) {
      this.segments.push({ x: this.x, y: this.y });
    }
    this.segLen = 22; // 每节长度

    // 方向随机变化
    this.dirTimer = 0;
    this.dirInterval = 2500 + Math.random() * 2000;
    this.targetVx = this.vx;
    this.targetVy = this.vy;

    // 波动相位（让飘带有飘动感）
    this.wavePhase = 0;
    this.waveFreq = 0.06 + Math.random() * 0.04;

    // 命中
    this.hit = false;  // 已被击中，不可再次击中
    this.hitAnim = 0;
    this.alive = true;
    this.opacity = 0;
  }

  update(dt) {
    if (this.hitAnim > 0) {
      this.hitAnim -= dt * 0.004;
      if (this.hitAnim <= 0) this.alive = false;
      return;
    }

    if (this.opacity < 1) this.opacity = Math.min(1, this.opacity + dt * 0.003);

    this.wavePhase += this.waveFreq;

    // 方向变化
    this.dirTimer += dt;
    if (this.dirTimer >= this.dirInterval) {
      this.dirTimer = 0;
      this.dirInterval = 2500 + Math.random() * 2000;
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      const newAngle = Math.atan2(this.vy, this.vx) + (Math.random() - 0.5) * Math.PI * 0.9;
      this.targetVx = Math.cos(newAngle) * speed;
      this.targetVy = Math.sin(newAngle) * speed;
    }
    this.vx += (this.targetVx - this.vx) * 0.025;
    this.vy += (this.targetVy - this.vy) * 0.025;

    // 移动头部
    this.x += this.vx;
    this.y += this.vy;

    // 弹簧链：每节跟随前一节
    let prevX = this.x, prevY = this.y;
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      const dx = seg.x - prevX;
      const dy = seg.y - prevY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // 波动偏移（垂直于运动方向）
      const perpX = -this.vy / (Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1);
      const perpY = this.vx / (Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1);
      const wave = Math.sin(this.wavePhase - i * 0.5) * (i * 1.8);
      const targetX = prevX + (dx / dist) * this.segLen + perpX * wave;
      const targetY = prevY + (dy / dist) * this.segLen + perpY * wave;
      seg.x += (targetX - seg.x) * 0.35;
      seg.y += (targetY - seg.y) * 0.35;
      prevX = seg.x;
      prevY = seg.y;
    }

    // 超出屏幕消失
    const m = 120;
    if (this.x < -m || this.x > this.W + m || this.y < -m || this.y > this.H + m) {
      this.alive = false;
    }
  }

  triggerHit() {
    if (this.hit) return;
    this.hit = true;
    this.hitAnim = 1.0;
  }

  draw(ctx) {
    if (this.hitAnim > 0) {
      const progress = 1 - this.hitAnim;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.hitAnim);
      // 飘带散开消失
      const allPts = [{ x: this.x, y: this.y }, ...this.segments];
      this._drawRibbonPath(ctx, allPts, this.width * (1 + progress * 0.5));
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalAlpha = this.opacity;
    const allPts = [{ x: this.x, y: this.y }, ...this.segments];
    this._drawRibbonPath(ctx, allPts, this.width);
    // 头部高光点
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width * 0.6, 0, Math.PI * 2);
    const hg = ctx.createRadialGradient(this.x - 4, this.y - 4, 1, this.x, this.y, this.width * 0.6);
    hg.addColorStop(0, 'rgba(255,255,255,0.8)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.restore();
  }

  _drawRibbonPath(ctx, pts, w) {
    if (pts.length < 3) return;
    const c = this.color;

    // 阴影层
    ctx.save();
    ctx.globalAlpha *= 0.4;
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = w + 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x + 3, pts[0].y + 3);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2 + 3;
      const my = (pts[i].y + pts[i + 1].y) / 2 + 3;
      ctx.quadraticCurveTo(pts[i].x + 3, pts[i].y + 3, mx, my);
    }
    ctx.stroke();
    ctx.restore();

    // 主体
    ctx.strokeStyle = c.main;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = c.main;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 高光层（丝绸光泽）
    ctx.strokeStyle = c.light;
    ctx.lineWidth = w * 0.3;
    ctx.globalAlpha *= 0.55;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.stroke();
  }

  contains(px, py) {
    if (this.hit) return false; // 已被击中，不可再次击中
    if (Math.hypot(px - this.x, py - this.y) < this.radius) return true;
    for (let i = 0; i < Math.min(3, this.segments.length); i++) {
      if (Math.hypot(px - this.segments[i].x, py - this.segments[i].y) < this.width * 1.2) return true;
    }
    return false;
  }
}
