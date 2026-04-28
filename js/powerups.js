class Powerup {
  constructor(type, tileX, tileY) {
    this.type = type;
    this.typeConfig = CONFIG.POWERUP_TYPES[type];
    this.tileX = tileX;
    this.tileY = tileY;
    this.pixelX = tileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.pixelY = tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.collected = false;
    this.animTimer = Math.random() * 1000;
    this.spawnDelay = 0;
    this.visible = true;
  }

  update(dt) {
    if (this.collected) return;
    this.animTimer += dt;
    this.visible = true;
  }

  collect() {
    this.collected = true;
  }

  draw(ctx) {
    if (this.collected) return;

    const pulse = Math.sin(this.animTimer * 0.004) * 0.3 + 0.7;
    const size = CONFIG.TILE_SIZE * 0.35 * pulse;
    const bob = Math.sin(this.animTimer * 0.003) * 3;

    ctx.save();
    ctx.translate(this.pixelX, this.pixelY + bob);

    ctx.shadowColor = this.typeConfig.color;
    ctx.shadowBlur = 15 * pulse;

    ctx.strokeStyle = this.typeConfig.color;
    ctx.lineWidth = 2;
    ctx.fillStyle = this.typeConfig.color + '44';

    ctx.beginPath();
    ctx.roundRect(-size, -size, size * 2, size * 2, 5);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = `${Math.floor(size * 1.2)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.typeConfig.icon, 0, 0);

    ctx.restore();
  }
}

class PowerupManager {
  constructor() {
    this.powerups = [];
    this.mysteryPowerups = [];
    this.mysteryTimer = 0;
    this.mysteryInterval = 15000;
  }

  initFromLevel(level, maze) {
    this.powerups = [];
    this.mysteryPowerups = [];

    if (level.powerups) {
      for (const p of level.powerups) {
        this.powerups.push(new Powerup(p.type, p.tile.x, p.tile.y));
      }
    }

    this._scheduleMystery(maze);
  }

  _scheduleMystery(maze) {
    this.mysteryTimer = this.mysteryInterval;
  }

  update(dt, maze) {
    for (const p of this.powerups) {
      p.update(dt);
    }
    for (const p of this.mysteryPowerups) {
      p.update(dt);
    }

    this.mysteryTimer -= dt;
    if (this.mysteryTimer <= 0) {
      this._spawnMystery(maze);
      this.mysteryTimer = this.mysteryInterval + Math.random() * 10000;
    }
  }

  _spawnMystery(maze) {
    const types = Object.keys(CONFIG.POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];

    let attempts = 0;
    while (attempts < 50) {
      const x = Math.floor(Math.random() * CONFIG.COLS);
      const y = Math.floor(Math.random() * CONFIG.ROWS);
      if (maze.isWalkable(x, y) && !maze.hasDot(x, y)) {
        const tooClose = this.powerups.some(p => !p.collected && Math.abs(p.tileX - x) + Math.abs(p.tileY - y) < 3);
        if (!tooClose) {
          this.mysteryPowerups.push(new Powerup(type, x, y));
          return;
        }
      }
      attempts++;
    }
  }

  checkCollection(player) {
    const collected = [];

    for (const p of this.powerups) {
      if (!p.collected && player.tileX === p.tileX && player.tileY === p.tileY) {
        p.collect();
        collected.push(p);
      }
    }

    for (const p of this.mysteryPowerups) {
      if (!p.collected && player.tileX === p.tileX && player.tileY === p.tileY) {
        p.collect();
        collected.push(p);
      }
    }

    return collected;
  }

  draw(ctx) {
    for (const p of this.powerups) {
      p.draw(ctx);
    }
    for (const p of this.mysteryPowerups) {
      p.draw(ctx);
    }
  }
}