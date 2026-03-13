// ===== 主菜单场景 =====
export class MenuScene {
  constructor(onStart) {
    this.onStart = onStart;
    this._el = null;
    this._build();
  }

  _build() {
    const old = document.getElementById('menu-overlay');
    if (old) old.remove();

    const el = document.createElement('div');
    el.id = 'menu-overlay';
    el.innerHTML = `
      <div class="menu-card">
        <div class="menu-title">🐱 猫咪游戏</div>
        <div class="menu-subtitle">选择目标物（可多选）</div>

        <div class="target-options">
          <label class="target-option" data-type="rubber">
            <input type="checkbox" value="rubber" checked />
            <span class="target-icon">🎾</span>
            <span class="target-label">橡皮球</span>
          </label>
          <label class="target-option" data-type="ribbon">
            <input type="checkbox" value="ribbon" />
            <span class="target-icon">🪱</span>
            <span class="target-label">蠕虫</span>
          </label>
          <label class="target-option" data-type="gecko">
            <input type="checkbox" value="gecko" />
            <span class="target-icon">🦎</span>
            <span class="target-label">壁虎</span>
          </label>
        </div>

        <div class="speed-section">
          <div class="speed-label">
            <span>速度</span>
            <span id="speed-value">普通</span>
          </div>
          <input type="range" id="speed-slider" min="1" max="5" value="3" step="1" />
          <div class="speed-ticks">
            <span>慢</span><span>较慢</span><span>普通</span><span>较快</span><span>快</span>
          </div>
        </div>

        <div class="speed-section">
          <div class="speed-label">
            <span>同屏数量</span>
            <span id="count-value">2 个</span>
          </div>
          <input type="range" id="count-slider" min="1" max="6" value="2" step="1" />
          <div class="speed-ticks">
            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
          </div>
        </div>

        <button id="start-btn">开始游戏 🐾</button>
        <div id="menu-error" class="menu-error"></div>
      </div>
    `;
    document.body.appendChild(el);
    this._el = el;

    const slider = el.querySelector('#speed-slider');
    const speedLabels = ['慢', '较慢', '普通', '较快', '快'];
    slider.addEventListener('input', () => {
      el.querySelector('#speed-value').textContent = speedLabels[slider.value - 1];
    });

    const countSlider = el.querySelector('#count-slider');
    countSlider.addEventListener('input', () => {
      el.querySelector('#count-value').textContent = countSlider.value + ' 个';
    });

    el.querySelectorAll('.target-option').forEach(opt => {
      const cb = opt.querySelector('input[type=checkbox]');
      const update = () => opt.classList.toggle('selected', cb.checked);
      cb.addEventListener('change', update);
      update();
    });

    el.querySelector('#start-btn').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const types = [];
      el.querySelectorAll('.target-option input:checked').forEach(cb => types.push(cb.value));
      if (types.length === 0) {
        el.querySelector('#menu-error').textContent = '请至少选择一种目标物！';
        return;
      }
      el.querySelector('#menu-error').textContent = '';
      const speedMult = [0.5, 0.75, 1.0, 1.4, 2.0][slider.value - 1];
      const maxTargets = parseInt(countSlider.value);
      this.destroy();
      this.onStart({ types, speedMult, maxTargets });
    });
  }

  destroy() {
    if (this._el) { this._el.remove(); this._el = null; }
  }
}
