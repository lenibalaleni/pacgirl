class Maze {
  constructor(levelData) {
    this.grid = levelData.map.map(row => [...row]);
    this.dots = [];
    this.bigDots = [];
    this.theme = CONFIG.LEVEL_THEMES[CONFIG.LEVEL_THEMES.findIndex(() => true)] || CONFIG.LEVEL_THEMES[0];
    this.totalDots = 0;
    this.dotsCollected = 0;

    const levelIndex = LEVELS.indexOf(levelData);
    if (levelIndex >= 0 && levelIndex < CONFIG.LEVEL_THEMES.length) {
      this.theme = CONFIG.LEVEL_THEMES[levelIndex];
    }

    this._initDots(levelData);
  }

  _initDots(levelData) {
    this.dots = [];
    this.bigDots = [];
    this.totalDots = 0;
    this.dotsCollected = 0;

    for (let y = 0; y < CONFIG.ROWS; y++) {
      this.dots[y] = [];
      for (let x = 0; x < CONFIG.COLS; x++) {
        this.dots[y][x] = false;
      }
    }

    for (let y = 0; y < CONFIG.ROWS; y++) {
      for (let x = 0; x < CONFIG.COLS; x++) {
        if (this.grid[y][x] === 0) {
          this.dots[y][x] = true;
          this.totalDots++;
        }
      }
    }

    if (levelData.bigDots) {
      for (const bd of levelData.bigDots) {
        if (this.isWalkable(bd.x, bd.y)) {
          this.bigDots.push({ x: bd.x, y: bd.y, collected: false, animTimer: Math.random() * 1000 });
        }
      }
    }

    const playerTile = levelData.playerStart;
    if (this.dots[playerTile.y] && this.dots[playerTile.y][playerTile.x]) {
      this.dots[playerTile.y][playerTile.x] = false;
      this.totalDots--;
    }

    if (levelData.enemies) {
      for (const e of levelData.enemies) {
        if (this.dots[e.startTile.y] && this.dots[e.startTile.y][e.startTile.x]) {
          this.dots[e.startTile.y][e.startTile.x] = false;
          this.totalDots--;
        }
      }
    }

    if (levelData.powerups) {
      for (const p of levelData.powerups) {
        if (this.dots[p.tile.y] && this.dots[p.tile.y][p.tile.x]) {
          this.dots[p.tile.y][p.tile.x] = false;
          this.totalDots--;
        }
      }
    }
  }

  isWalkable(x, y) {
    if (x < 0 || x >= CONFIG.COLS || y < 0 || y >= CONFIG.ROWS) return false;
    return this.grid[y][x] === 0;
  }

  collectDot(x, y) {
    if (x >= 0 && x < CONFIG.COLS && y >= 0 && y < CONFIG.ROWS && this.dots[y][x]) {
      this.dots[y][x] = false;
      this.dotsCollected++;
      return true;
    }
    return false;
  }

  collectBigDot(x, y) {
    for (let i = 0; i < this.bigDots.length; i++) {
      const bd = this.bigDots[i];
      if (!bd.collected && bd.x === x && bd.y === y) {
        bd.collected = true;
        return true;
      }
    }
    return false;
  }

  hasDot(x, y) {
    if (x >= 0 && x < CONFIG.COLS && y >= 0 && y < CONFIG.ROWS) {
      return this.dots[y][x];
    }
    return false;
  }

  isComplete() {
    return this.dotsCollected >= this.totalDots;
  }

  draw(ctx, time) {
    const T = CONFIG.TILE_SIZE;

    ctx.fillStyle = this.theme.pathColor;
    ctx.fillRect(0, 0, CONFIG.COLS * T, CONFIG.ROWS * T);

    for (let y = 0; y < CONFIG.ROWS; y++) {
      for (let x = 0; x < CONFIG.COLS; x++) {
        const px = x * T;
        const py = y * T;

        if (this.grid[y][x] === 1) {
          this._drawWall(ctx, px, py, T, x, y);
        } else {
          if (this.dots[y][x]) {
            this._drawDot(ctx, px + T / 2, py + T / 2, time);
          }
        }
      }
    }

    for (const bd of this.bigDots) {
      if (!bd.collected) {
        bd.animTimer += 16;
        this._drawBigDot(ctx, bd.x * T + T / 2, bd.y * T + T / 2, bd.animTimer);
      }
    }
  }

  _drawWall(ctx, px, py, T, x, y) {
    const isTop = y > 0 && this.grid[y - 1][x] === 1;
    const isBot = y < CONFIG.ROWS - 1 && this.grid[y + 1][x] === 1;
    const isLeft = x > 0 && this.grid[y][x - 1] === 1;
    const isRight = x < CONFIG.COLS - 1 && this.grid[y][x + 1] === 1;

    ctx.fillStyle = this.theme.wallColor;
    ctx.fillRect(px, py, T, T);

    ctx.strokeStyle = this.theme.accentColor + '33';
    ctx.lineWidth = 1;

    if (!isTop) {
      ctx.beginPath();
      ctx.moveTo(px, py + 0.5);
      ctx.lineTo(px + T, py + 0.5);
      ctx.stroke();
    }
    if (!isBot) {
      ctx.beginPath();
      ctx.moveTo(px, py + T - 0.5);
      ctx.lineTo(px + T, py + T - 0.5);
      ctx.stroke();
    }
    if (!isLeft) {
      ctx.beginPath();
      ctx.moveTo(px + 0.5, py);
      ctx.lineTo(px + 0.5, py + T);
      ctx.stroke();
    }
    if (!isRight) {
      ctx.beginPath();
      ctx.moveTo(px + T - 0.5, py);
      ctx.lineTo(px + T - 0.5, py + T);
      ctx.stroke();
    }

    const gradient = ctx.createLinearGradient(px, py, px + T, py + T);
    gradient.addColorStop(0, 'rgba(255,255,255,0.03)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(px, py, T, T);

    if (!isTop && !isLeft) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(px, py, 3, 3);
    }
    if (!isBot && !isRight) {
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(px + T - 3, py + T - 3, 3, 3);
    }
  }

  _drawDot(ctx, cx, cy, time) {
    const pulse = Math.sin(time * 0.002) * 0.2 + 0.8;
    const radius = 2.5 * pulse;

    ctx.save();
    ctx.shadowColor = CONFIG.COLORS.DOT;
    ctx.shadowBlur = 6 * pulse;
    ctx.fillStyle = CONFIG.COLORS.DOT;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawBigDot(ctx, cx, cy, time) {
    const pulse = Math.sin(time * 0.005) * 0.3 + 0.7;
    const radius = 7 * pulse;

    ctx.save();
    ctx.shadowColor = CONFIG.COLORS.DOT_BIG;
    ctx.shadowBlur = 20 * pulse;
    ctx.fillStyle = CONFIG.COLORS.DOT_BIG;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff44';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}