// ===== 浮动文字 =====
export class FloatingText {
  /**
   * @param {number} x
   * @param {number} y
   * @param {string} text
   * @param {number} [scale=1]   字体缩放倍数
   * @param {number} [duration=800] 持续时间(ms)，用于控制消退速度
   * @param {string} [style='hit'] 'hit' | 'miss'
   */
  constructor(x, y, text, scale = 1, duration = 800, style = 'hit') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.scale = scale;
    this.style = style;
    this.life = 1.0;
    this.decay = 1.0 / (duration / 16); // 每帧衰减量（约60fps）
    this.vy = style === 'miss' ? -1.2 : -2.5;
    this.rotation = style === 'miss' ? (Math.random() - 0.5) * 0.6 : 0;
  }

  update() {
    this.y += this.vy;
    this.vy *= 0.94;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.translate(this.x, this.y);
    if (this.rotation) ctx.rotate(this.rotation);

    const fontSize = Math.round(36 * this.scale);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.style === 'miss') {
      // 猫爪样式：白色描边，半透明
      ctx.shadowColor = 'rgba(255,200,100,0.6)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 4;
      ctx.strokeText(this.text, 0, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(this.text, 0, 0);
    } else {
      // 命中样式：金色
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 14;
      ctx.strokeText(this.text, 0, 0);
      ctx.fillStyle = '#ffdd00';
      ctx.fillText(this.text, 0, 0);
    }
    ctx.restore();
  }

  get dead() { return this.life <= 0; }
}
