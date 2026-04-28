class Enemy {
  constructor(type, startTile) {
    this.type = type;
    this.typeConfig = CONFIG.ENEMY_TYPES[type];
    this.startTile = { x: startTile.x, y: startTile.y };
    this.tileX = startTile.x;
    this.tileY = startTile.y;
    this.pixelX = startTile.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.pixelY = startTile.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.direction = { x: 0, y: 0 };
    this.speed = this.typeConfig.speed;
    this.baseSpeed = this.typeConfig.speed;
    this.alive = true;
    this.frozen = false;
    this.scared = false;
    this.animFrame = 0;
    this.animTimer = 0;
    this.patrolAngle = 0;
    this.teleportCooldown = 0;
    this.erraticTimer = 0;
    this.deathAnimTimer = 0;
    this.glowPulse = 0;
    this.eyeTarget = { x: 0, y: 0 };
    this.targetTileX = startTile.x;
    this.targetTileY = startTile.y;
    this._needsDirection = true;
  }

  reset() {
    this.tileX = this.startTile.x;
    this.tileY = this.startTile.y;
    this.pixelX = this.startTile.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.pixelY = this.startTile.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.direction = { x: 0, y: 0 };
    this.alive = true;
    this.frozen = false;
    this.scared = false;
    this.deathAnimTimer = 0;
    this.speed = this.baseSpeed;
    this.patrolAngle = 0;
    this.teleportCooldown = 0;
    this.erraticTimer = 0;
    this.targetTileX = this.startTile.x;
    this.targetTileY = this.startTile.y;
    this._needsDirection = true;
  }

  update(dt, maze, player) {
    if (!this.alive) { this.deathAnimTimer += dt; return; }

    this.animTimer += dt;
    if (this.animTimer > 150) { this.animFrame = (this.animTimer + 1) % 4; this.animTimer = 0; }
this.glowPulse += dt * 0.003;
    if (this.teleportCooldown > 0) this.teleportCooldown -= dt;

    if (this.frozen) {
      this.eyeTarget = { x: player.pixelX, y: player.pixelY };
      return;
    }

    // if scared, run away from player
    if (this.scared) {
      spd = this.baseSpeed * 0.6;
    }

    // initialize direction on first frame
    if (this.direction.x === 0 && this.direction.y === 0) {
      this._chooseDirection(maze, player);
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        this.targetTileX = this.tileX + this.direction.x;
        this.targetTileY = this.tileY + this.direction.y;
      }
    }

    var T = CONFIG.TILE_SIZE;
    var hs = T / 2;
    var spd = this.scared ? this.baseSpeed * 0.5 : this.speed;

    // target center
    var txPx = this.targetTileX * T + hs;
    var tyPx = this.targetTileY * T + hs;
    var dxT = txPx - this.pixelX;
    var dyT = tyPx - this.pixelY;
    var distT = Math.abs(dxT) + Math.abs(dyT);

    // reached target tile center?
    if (distT < spd + 1) {
      this.pixelX = txPx;
      this.pixelY = tyPx;
      this.tileX = this.targetTileX;
      this.tileY = this.targetTileY;

      // pick next direction based on AI
      this._chooseDirection(maze, player);

      // if we have a direction, set next target
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        var ntx = this.tileX + this.direction.x;
        var nty = this.tileY + this.direction.y;
        if (ntx >= 0 && ntx < CONFIG.COLS && nty >= 0 && nty < CONFIG.ROWS && maze.isWalkable(ntx, nty)) {
          this.targetTileX = ntx;
          this.targetTileY = nty;
        }
      }
    }

    // move toward target
    if (this.direction.x !== 0 || this.direction.y !== 0) {
      txPx = this.targetTileX * T + hs;
      tyPx = this.targetTileY * T + hs;
      dxT = txPx - this.pixelX;
      dyT = tyPx - this.pixelY;
      distT = Math.sqrt(dxT * dxT + dyT * dyT);

      if (distT > 0) {
        var mx = (dxT / distT) * spd;
        var my = (dyT / distT) * spd;
        if (Math.abs(mx) > Math.abs(dxT)) mx = dxT;
        if (Math.abs(my) > Math.abs(dyT)) my = dyT;
        this.pixelX += mx;
        this.pixelY += my;
      }
    }

    this.tileX = Math.round((this.pixelX - hs) / T);
    this.tileY = Math.round((this.pixelY - hs) / T);
    this.eyeTarget = { x: player.pixelX, y: player.pixelY };
  }

  _chooseDirection(maze, player) {
    if (this.scared) {
      this._moveAway(player.tileX, player.tileY, maze);
      return;
    }
    switch (this.typeConfig.behavior) {
      case 'chase': this._chaseAI(maze, player); break;
      case 'erratic': this._erraticAI(maze, player); break;
      case 'ambush': this._ambushAI(maze, player); break;
      case 'patrol': this._patrolAI(maze, player); break;
    }

    // validate chosen direction
    if (this.direction.x !== 0 || this.direction.y !== 0) {
      var nx = this.tileX + this.direction.x;
      var ny = this.tileY + this.direction.y;
      if (nx < 0 || nx >= CONFIG.COLS || ny < 0 || ny >= CONFIG.ROWS || !maze.isWalkable(nx, ny)) {
        this.direction = { x: 0, y: 0 };
      }
    }

    // if still no direction, pick any valid one
    if (this.direction.x === 0 && this.direction.y === 0) {
      this._pickRandom(maze);
    }
  }

  _chaseAI(maze, player) {
    this._moveTowards(player.tileX, player.tileY, maze);
  }

  _erraticAI(maze, player) {
    this.erraticTimer += 1;
    if (this.erraticTimer > 60) {
      this.erraticTimer = 0;
      if (Math.random() < 0.7) {
        this._moveTowards(player.tileX, player.tileY, maze);
      } else {
        this._moveRandom(maze);
      }
    } else {
      // keep current direction if possible
      var nx = this.tileX + this.direction.x;
      var ny = this.tileY + this.direction.y;
      if (nx < 0 || nx >= CONFIG.COLS || ny < 0 || ny >= CONFIG.ROWS || !maze.isWalkable(nx, ny)) {
        this._moveTowards(player.tileX, player.tileY, maze);
      }
    }
    if (this.teleportCooldown <= 0 && Math.random() < 0.001) {
      this._teleportNearPlayer(maze, player);
    }
  }

  _ambushAI(maze, player) {
    var tx = player.tileX + (player.direction ? player.direction.x : 0) * 3;
    var ty = player.tileY + (player.direction ? player.direction.y : 0) * 3;
    tx = Math.max(0, Math.min(CONFIG.COLS - 1, tx));
    ty = Math.max(0, Math.min(CONFIG.ROWS - 1, ty));
    if (maze.isWalkable(tx, ty)) {
      this._moveTowards(tx, ty, maze);
    } else {
      this._moveTowards(player.tileX, player.tileY, maze);
    }
  }

  _patrolAI(maze, player) {
    var distToPlayer = Math.abs(this.tileX - player.tileX) + Math.abs(this.tileY - player.tileY);
    if (distToPlayer < 6) {
      this.speed = this.baseSpeed * 1.5;
      this._moveTowards(player.tileX, player.tileY, maze);
    } else {
      this.speed = this.baseSpeed;
      this.patrolAngle += 0.03;
      this._movePreferDirection(Math.cos(this.patrolAngle), Math.sin(this.patrolAngle), maze);
    }
  }

  _moveTowards(targetX, targetY, maze) {
    var candidates = this._getValidDirs(maze);
    if (candidates.length === 0) { this.direction = { x: 0, y: 0 }; return; }

    // avoid reversing
    var opposite = { x: -this.direction.x, y: -this.direction.y };
    var preferred = candidates.filter(d => !(d.x === opposite.x && d.y === opposite.y));
    if (preferred.length === 0) preferred = candidates;

    var best = preferred[0];
    var bestDist = Infinity;
    for (var i = 0; i < preferred.length; i++) {
      var d = preferred[i];
      var nx = this.tileX + d.x;
      var ny = this.tileY + d.y;
      var dist = Math.abs(nx - targetX) + Math.abs(ny - targetY);
      if (dist < bestDist) { bestDist = dist; best = d; }
    }
    this.direction = best;
  }

  _movePreferDirection(preferX, preferY, maze) {
    var candidates = this._getValidDirs(maze);
    if (candidates.length === 0) { this.direction = { x: 0, y: 0 }; return; }

    var opposite = { x: -this.direction.x, y: -this.direction.y };
    var preferred = candidates.filter(d => !(d.x === opposite.x && d.y === opposite.y));
    if (preferred.length === 0) preferred = candidates;

    var best = preferred[0];
    var bestScore = -Infinity;
    for (var i = 0; i < preferred.length; i++) {
      var d = preferred[i];
      var score = d.x * preferX + d.y * preferY;
      if (score > bestScore) { bestScore = score; best = d; }
    }
    this.direction = best;
  }

  _moveRandom(maze) {
    var candidates = this._getValidDirs(maze);
    if (candidates.length === 0) { this.direction = { x: 0, y: 0 }; return; }

    var opposite = { x: -this.direction.x, y: -this.direction.y };
    var preferred = candidates.filter(d => !(d.x === opposite.x && d.y === opposite.y));
    if (preferred.length === 0) preferred = candidates;

    this.direction = preferred[Math.floor(Math.random() * preferred.length)];
  }

  _pickRandom(maze) {
    this._moveRandom(maze);
  }

  _moveAway(fromX, fromY, maze) {
    var candidates = this._getValidDirs(maze);
    if (candidates.length === 0) { this.direction = { x: 0, y: 0 }; return; }

    var opposite = { x: -this.direction.x, y: -this.direction.y };
    var preferred = candidates.filter(d => !(d.x === opposite.x && d.y === opposite.y));
    if (preferred.length === 0) preferred = candidates;

    var best = preferred[0];
    var bestDist = -1;
    for (var i = 0; i < preferred.length; i++) {
      var d = preferred[i];
      var nx = this.tileX + d.x;
      var ny = this.tileY + d.y;
      var dist = Math.abs(nx - fromX) + Math.abs(ny - fromY);
      if (dist > bestDist) { bestDist = dist; best = d; }
    }
    this.direction = best;
  }

  _getValidDirs(maze) {
    var dirs = [
      CONFIG.DIRECTIONS.UP,
      CONFIG.DIRECTIONS.DOWN,
      CONFIG.DIRECTIONS.LEFT,
      CONFIG.DIRECTIONS.RIGHT
    ];
    var valid = [];
    for (var i = 0; i < dirs.length; i++) {
      var d = dirs[i];
      var nx = this.tileX + d.x;
      var ny = this.tileY + d.y;
      if (nx >= 0 && nx < CONFIG.COLS && ny >= 0 && ny < CONFIG.ROWS && maze.isWalkable(nx, ny)) {
        valid.push(d);
      }
    }
    return valid;
  }

  _teleportNearPlayer(maze, player) {
    var offsets = [
      { x: -2, y: 0 }, { x: 2, y: 0 }, { x: 0, y: -2 }, { x: 0, y: 2 },
      { x: -3, y: 0 }, { x: 3, y: 0 }, { x: 0, y: -3 }, { x: 0, y: 3 }
    ];
    for (var i = 0; i < offsets.length; i++) {
      var nx = player.tileX + offsets[i].x;
      var ny = player.tileY + offsets[i].y;
      if (nx >= 0 && nx < CONFIG.COLS && ny >= 0 && ny < CONFIG.ROWS && maze.isWalkable(nx, ny)) {
        this.tileX = nx;
        this.tileY = ny;
        this.pixelX = nx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.pixelY = ny * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        this.targetTileX = nx;
        this.targetTileY = ny;
        this.teleportCooldown = 5000;
        break;
      }
    }
  }

  freeze() {
    this.frozen = true;
  }

  unfreeze() {
    this.frozen = false;
    this.direction = { x: 0, y: 0 };
  }

  scare() {
    this.scared = true;
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