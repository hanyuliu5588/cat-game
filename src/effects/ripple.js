// ===== 涟漪效果 =====
export class Ripple {
  constructor(x, y, hit) {
    this.x = x;
    this.y = y;
    this.r = 8;
    this.maxR = hit ? 90 : 45;
    this.life = 1.0;
    this.color = hit ? '#ffdd00' : 'rgba(255,255,255,0.5)';
    this.lineWidth = hit ? 4 : 2;
  }

  update() {
    this.r += (this.maxR - this.r) * 0.14;
    this.life -= 0.045;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life) * 0.75;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.stroke();
    // 第二圈（命中时）
    if (this.life > 0.5) {
      ctx.globalAlpha = Math.max(0, this.life - 0.5) * 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  get dead() { return this.life <= 0; }
}
