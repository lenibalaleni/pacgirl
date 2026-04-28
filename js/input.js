class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.direction = { ...CONFIG.DIRECTIONS.NONE };
    this.nextDirection = { ...CONFIG.DIRECTIONS.NONE };
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isTouching = false;
    this.keys = {};
    this.pauseRequested = false;
    this.enterPressed = false;

    this._setupKeyboard();
    this._setupTouch();
  }

  _setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          this.nextDirection = { ...CONFIG.DIRECTIONS.UP };
          e.preventDefault();
          break;
        case 'ArrowDown': case 's': case 'S':
          this.nextDirection = { ...CONFIG.DIRECTIONS.DOWN };
          e.preventDefault();
          break;
        case 'ArrowLeft': case 'a': case 'A':
          this.nextDirection = { ...CONFIG.DIRECTIONS.LEFT };
          e.preventDefault();
          break;
        case 'ArrowRight': case 'd': case 'D':
          this.nextDirection = { ...CONFIG.DIRECTIONS.RIGHT };
          e.preventDefault();
          break;
        case 'Escape': case 'p': case 'P':
          this.pauseRequested = true;
          break;
        case 'Enter':
          this.enterPressed = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  _setupTouch() {
    this._createTouchControls();

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.isTouching = true;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!this.isTouching) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this.touchStartX;
      const dy = touch.clientY - this.touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 15) {
        if (absDx > absDy) {
          this.nextDirection = dx > 0 ? { ...CONFIG.DIRECTIONS.RIGHT } : { ...CONFIG.DIRECTIONS.LEFT };
        } else {
          this.nextDirection = dy > 0 ? { ...CONFIG.DIRECTIONS.DOWN } : { ...CONFIG.DIRECTIONS.UP };
        }
      }
      this.isTouching = false;
    }, { passive: false });
  }

  _createTouchControls() {
    const existing = document.getElementById('touch-controls');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'touch-controls';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      gap: 4px;
      z-index: 100;
      grid-template-columns: 60px 60px 60px;
      grid-template-rows: 60px 60px 60px;
    `;

    const btns = [
      { label: '', col: 1, row: 1 },
      { label: '▲', col: 2, row: 1, dir: CONFIG.DIRECTIONS.UP },
      { label: '', col: 3, row: 1 },
      { label: '◀', col: 1, row: 2, dir: CONFIG.DIRECTIONS.LEFT },
      { label: '⏸', col: 2, row: 2, pause: true },
      { label: '▶', col: 3, row: 2, dir: CONFIG.DIRECTIONS.RIGHT },
      { label: '', col: 1, row: 3 },
      { label: '▼', col: 2, row: 3, dir: CONFIG.DIRECTIONS.DOWN },
      { label: '', col: 3, row: 3 }
    ];

    btns.forEach(btn => {
      const el = document.createElement('button');
      el.textContent = btn.label;
      el.style.cssText = `
        width: 60px;
        height: 60px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,0,100,0.5);
        border-radius: 12px;
        color: #ff0066;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
      `;
      if (btn.dir) {
        const handleTouch = (e) => {
          e.preventDefault();
          this.nextDirection = { ...btn.dir };
        };
        el.addEventListener('touchstart', handleTouch, { passive: false });
        el.addEventListener('mousedown', handleTouch);
      }
      if (btn.pause) {
        el.addEventListener('touchstart', (e) => { e.preventDefault(); this.pauseRequested = true; }, { passive: false });
      }
      container.appendChild(el);
    });

    document.body.appendChild(container);

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      container.style.display = 'grid';
      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        canvas.style.marginBottom = '220px';
      }
    }
  }

  consumeDirection() {
    const d = { ...this.nextDirection };
    return d;
  }

  consumeEnter() {
    if (this.enterPressed) {
      this.enterPressed = false;
      return true;
    }
    return false;
  }

  consumePause() {
    if (this.pauseRequested) {
      this.pauseRequested = false;
      return true;
    }
    return false;
  }
}