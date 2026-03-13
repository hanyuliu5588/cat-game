// ===== 粒子爆炸效果 =====
export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 7;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 3;
    this.gravity = 0.18;
    this.life = 1.0;
    this.decay = 0.018 + Math.random() * 0.02;
    this.size = 5 + Math.random() * 9;
    this.color = color;
    this.useEmoji = Math.random() < 0.25;
    this.emoji = ['⭐', '✨', '💫', '🌟'][Math.floor(Math.random() * 4)];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.97;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    if (this.useEmoji) {
      ctx.font = `${this.size * 2}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, this.x, this.y);
    } else {
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  get dead() { return this.life <= 0; }
}

export function spawnExplosion(particles, x, y, colors) {
  const palette = colors || ['#ff4444', '#ff8800', '#ffdd00', '#44ff88', '#44aaff', '#ff44ff'];
  for (let i = 0; i < 32; i++) {
    particles.push(new Particle(x, y, palette[Math.floor(Math.random() * palette.length)]));
  }
}
