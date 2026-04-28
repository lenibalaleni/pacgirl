class Enemy {
  constructor(type, startTile) {
    this.type = type;
    this.typeConfig = CONFIG.ENEMY_TYPES[type];
    this.startTile = { ...startTile };
    this.tileX = startTile.x;
    this.tileY = startTile.y;
    this.pixelX = startTile.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.pixelY = startTile.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.direction = { ...CONFIG.DIRECTIONS.NONE };
    this.speed = this.typeConfig.speed;
    this.baseSpeed = this.typeConfig.speed;
    this.alive = true;
    this.frozen = false;
    this.scared = false;
    this.animFrame = 0;
    this.animTimer = 0;
    this.moveTimer = 0;
    this.patrolAngle = 0;
    this.teleportCooldown = 0;
    this.erraticTimer = 0;
    this.erraticChangeInterval = 800 + Math.random() * 1200;
    this.deathAnimTimer = 0;
    this.glowPulse = 0;
    this.eyeTarget = { x: 0, y: 0 };
    this.chaseAggressiveness = 0.5 + (type === 'DEMON' ? 0.3 : 0);
  }

  reset() {
    this.tileX = this.startTile.x;
    this.tileY = this.startTile.y;
    this.pixelX = this.startTile.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.pixelY = this.startTile.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.direction = { ...CONFIG.DIRECTIONS.NONE };
    this.alive = true;
    this.frozen = false;
    this.scared = false;
    this.deathAnimTimer = 0;
    this.speed = this.baseSpeed;
    this.patrolAngle = 0;
    this.teleportCooldown = 0;
    this.erraticTimer = 0;
  }

  update(dt, maze, player) {
    if (!this.alive) {
      this.deathAnimTimer += dt;
      return;
    }

    this.animTimer += dt;
    if (this.animTimer > 150) {
      this.animFrame = (this.animFrame + 1) % 4;
      this.animTimer = 0;
    }

    this.glowPulse += dt * 0.003;

    if (this.frozen) return;

    if (this.teleportCooldown > 0) this.teleportCooldown -= dt;

    const targetCenterX = this.tileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    const targetCenterY = this.tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    const distToCenter = Math.abs(this.pixelX - targetCenterX) + Math.abs(this.pixelY - targetCenterY);

    const nearCenter = distToCenter < this.speed * 2;
    if (nearCenter) {
      this.pixelX = targetCenterX;
      this.pixelY = targetCenterY;

      switch (this.typeConfig.behavior) {
        case 'chase':
          this._chaseAI(maze, player);
          break;
        case 'erratic':
          this._erraticAI(maze, player);
          break;
        case 'ambush':
          this._ambushAI(maze, player);
          break;
        case 'patrol':
          this._patrolAI(maze, player);
          break;
      }
    }

    if (this.direction.x !== 0 || this.direction.y !== 0) {
      this.pixelX += this.direction.x * this.speed;
      this.pixelY += this.direction.y * this.speed;

      var newTileX = Math.round((this.pixelX - CONFIG.TILE_SIZE / 2) / CONFIG.TILE_SIZE);
      var newTileY = Math.round((this.pixelY - CONFIG.TILE_SIZE / 2) / CONFIG.TILE_SIZE);
      if (newTileX < 0 || newTileX >= CONFIG.COLS || newTileY < 0 || newTileY >= CONFIG.ROWS || !maze.isWalkable(newTileX, newTileY)) {
        this.pixelX = this.tileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.pixelY = this.tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.direction = { ...CONFIG.DIRECTIONS.NONE };
      }
    }

    this.tileX = Math.round((this.pixelX - CONFIG.TILE_SIZE / 2) / CONFIG.TILE_SIZE);
    this.tileY = Math.round((this.pixelY - CONFIG.TILE_SIZE / 2) / CONFIG.TILE_SIZE);

    this.eyeTarget = { x: player.pixelX, y: player.pixelY };
  }

  _chaseAI(maze, player) {
    this._moveTowards(player.tileX, player.tileY, maze);
  }

  _erraticAI(maze, player) {
    this.erraticTimer += 1;
    if (this.erraticTimer > this.erraticChangeInterval || this.direction.x === 0 && this.direction.y === 0) {
      this.erraticTimer = 0;
      if (Math.random() < 0.6) {
        this._moveTowards(player.tileX, player.tileY, maze);
      } else {
        this._moveRandom(maze);
      }
    }
    if (this.teleportCooldown <= 0 && Math.random() < 0.002) {
      this._teleportNearPlayer(maze, player);
    }
  }

  _ambushAI(maze, player) {
    const targetX = player.tileX + player.direction.x * 3;
    const targetY = player.tileY + player.direction.y * 3;
    const clampedX = Math.max(0, Math.min(CONFIG.COLS - 1, targetX));
    const clampedY = Math.max(0, Math.min(CONFIG.ROWS - 1, targetY));

    if (maze.isWalkable(clampedX, clampedY)) {
      this._moveTowards(clampedX, clampedY, maze);
    } else {
      this._moveTowards(player.tileX, player.tileY, maze);
    }
  }

  _patrolAI(maze, player) {
    const distToPlayer = Math.abs(this.tileX - player.tileX) + Math.abs(this.tileY - player.tileY);
    if (distToPlayer < 5) {
      this.speed = this.baseSpeed * 1.6;
      this._moveTowards(player.tileX, player.tileY, maze);
    } else {
      this.speed = this.baseSpeed;
      this.patrolAngle += 0.02;
      const dx = Math.cos(this.patrolAngle) > 0 ? 1 : -1;
      const dy = Math.sin(this.patrolAngle) > 0 ? 1 : 0;
      const candidates = this._getValidDirections(maze);
      if (candidates.length > 0) {
        let best = candidates[0];
        let bestScore = -Infinity;
        for (const dir of candidates) {
          const score = dir.x * dx + dir.y * dy;
          if (score > bestScore) {
            bestScore = score;
            best = dir;
          }
        }
        this.direction = best;
      }
    }
  }

  _moveTowards(targetX, targetY, maze) {
    const candidates = this._getValidDirections(maze);
    if (candidates.length === 0) return;

    const opposite = { x: -this.direction.x, y: -this.direction.y };
    const filtered = candidates.filter(d => !(d.x === opposite.x && d.y === opposite.y));

    const toUse = filtered.length > 0 ? filtered : candidates;

    let best = toUse[0];
    let bestDist = Infinity;
    for (const dir of toUse) {
      const newX = this.tileX + dir.x;
      const newY = this.tileY + dir.y;
      const dist = Math.abs(newX - targetX) + Math.abs(newY - targetY);
      if (dist < bestDist) {
        bestDist = dist;
        best = dir;
      }
    }

    this.direction = best;
  }

  _moveRandom(maze) {
    const candidates = this._getValidDirections(maze);
    if (candidates.length === 0) return;
    this.direction = candidates[Math.floor(Math.random() * candidates.length)];
  }

  _teleportNearPlayer(maze, player) {
    const offsets = [
      { x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 },
      { x: -3, y: 0 }, { x: 3, y: 0 }, { x: 0, y: -3 }, { x: 0, y: 3 }
    ];
    for (const off of offsets.sort(() => Math.random() - 0.5)) {
      const nx = player.tileX + off.x;
      const ny = player.tileY + off.y;
      if (nx >= 0 && nx < CONFIG.COLS && ny >= 0 && ny < CONFIG.ROWS && maze.isWalkable(nx, ny)) {
        this.tileX = nx;
        this.tileY = ny;
        this.pixelX = nx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.pixelY = ny * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.teleportCooldown = 5000;
        break;
      }
    }
  }

  _getValidDirections(maze) {
    const dirs = [CONFIG.DIRECTIONS.UP, CONFIG.DIRECTIONS.DOWN, CONFIG.DIRECTIONS.LEFT, CONFIG.DIRECTIONS.RIGHT];
    const valid = [];
    for (const d of dirs) {
      const nx = this.tileX + d.x;
      const ny = this.tileY + d.y;
      if (nx >= 0 && nx < CONFIG.COLS && ny >= 0 && ny < CONFIG.ROWS && maze.isWalkable(nx, ny)) {
        valid.push(d);
      }
    }
    return valid;
  }

  freeze() {
    this.frozen = true;
    this.direction = { ...CONFIG.DIRECTIONS.NONE };
  }

  unfreeze() {
    this.frozen = false;
  }

  scare() {
    this.scared = true;
    this.speed = this.baseSpeed * 0.5;
  }

  unscare() {
    this.scared = false;
    this.speed = this.baseSpeed;
  }

  kill() {
    this.alive = false;
    this.deathAnimTimer = 0;
  }

  respawn() {
    this.reset();
  }
}