class Player {
  constructor(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.speed = CONFIG.PLAYER_SPEED;
    this.baseSpeed = CONFIG.PLAYER_SPEED;
    this.alive = true;
    this.animFrame = 0;
    this.animTimer = 0;
    this.powerups = {};
    this.fireTrail = [];
    this.mouthOpen = 0;
    this.mouthDir = 1;
    this.invincibleFlash = 0;
    this.facingAngle = 0;
    this.lives = 3;
    this.deathTimer = 0;
    this.walkCycle = 0;
    this.moving = false;
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 };
    this._setPixelFromTile(tileX, tileY);
    this.targetTileX = tileX;
    this.targetTileY = tileY;
    this.atCenter = true;
  }

  _setPixelFromTile(tx, ty) {
    this.tileX = tx;
    this.tileY = ty;
    this.pixelX = tx * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    this.pixelY = ty * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
  }

  reset(tileX, tileY) {
    this._setPixelFromTile(tileX, tileY);
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 };
    this.targetTileX = tileX;
    this.targetTileY = tileY;
    this.atCenter = true;
    this.alive = true;
    this.speed = this.baseSpeed;
    this.powerups = {};
    this.fireTrail = [];
    this.deathTimer = 0;
    this.walkCycle = 0;
    this.moving = false;
  }

  setDirection(dir) {
    if (dir.x !== 0 || dir.y !== 0) {
      this.nextDirection = { x: dir.x, y: dir.y };
    }
  }

  _ok(tx, ty, maze) {
    return tx >= 0 && tx < CONFIG.COLS && ty >= 0 && ty < CONFIG.ROWS && maze.isWalkable(tx, ty);
  }

  update(dt, maze) {
    if (!this.alive) { this.deathTimer += dt; return; }

    this.animTimer += dt;
    if (this.animTimer > 100) { this.animFrame = (this.animFrame + 1) % 4; this.animTimer = 0; }
    this.mouthOpen += this.mouthDir * dt * 0.012;
    if (this.mouthOpen > 1) { this.mouthOpen = 1; this.mouthDir = -1; }
    if (this.mouthOpen < 0) { this.mouthOpen = 0; this.mouthDir = 1; }

    this._updatePowerups(dt);
    this.speed = this.powerups.SPEED ? this.baseSpeed * 1.8 : this.baseSpeed;
    if (this.powerups.FIRE) this.fireTrail.push({ x: this.pixelX, y: this.pixelY, timer: 1500 });
    this.fireTrail = this.fireTrail.filter(f => { f.timer -= dt; return f.timer > 0; });
    if (this.powerups.INVINCIBLE) this.invincibleFlash += dt * 0.01;

    var T = CONFIG.TILE_SIZE;
    var hs = T / 2;
    var spd = this.speed;

    // target center
    var txPx = this.targetTileX * T + hs;
    var tyPx = this.targetTileY * T + hs;
    var dxToTarget = txPx - this.pixelX;
    var dyToTarget = tyPx - this.pixelY;
    var distToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);

    // are we at the target tile center?
    this.atCenter = distToTarget < spd + 0.5;

    if (this.atCenter) {
      // snap to center
      this.pixelX = txPx;
      this.pixelY = tyPx;
      this.tileX = this.targetTileX;
      this.tileY = this.targetTileY;

      // try queued direction
      var nd = this.nextDirection;
      if ((nd.x !== 0 || nd.y !== 0) && this._ok(this.tileX + nd.x, this.tileY + nd.y, maze)) {
        this.direction = { x: nd.x, y: nd.y };
      }

      // check if current direction is still valid
      var cd = this.direction;
      if (cd.x !== 0 || cd.y !== 0) {
        if (this._ok(this.tileX + cd.x, this.tileY + cd.y, maze)) {
          // keep going - set new target
          this.targetTileX = this.tileX + cd.x;
          this.targetTileY = this.tileY + cd.y;
        } else {
          // wall ahead - stay at current center
          this.direction = { x: 0, y: 0 };
          this.atCenter = true;
          this.moving = false;
          return;
        }
      } else {
        // not moving - try queued direction one more time
        var nd2 = this.nextDirection;
        if ((nd2.x !== 0 || nd2.y !== 0) && this._ok(this.tileX + nd2.x, this.tileY + nd2.y, maze)) {
          this.direction = { x: nd2.x, y: nd2.y };
          this.targetTileX = this.tileX + nd2.x;
          this.targetTileY = this.tileY + nd2.y;
        } else {
          this.moving = false;
          return;
        }
      }
    }

    if (this.direction.x === 0 && this.direction.y === 0) {
      this.moving = false;
      return;
    }

    this.moving = true;
    this.facingAngle = Math.atan2(this.direction.y, this.direction.x);
    this.walkCycle += dt * 0.015 * this.speed;

    // move toward target
    txPx = this.targetTileX * T + hs;
    tyPx = this.targetTileY * T + hs;
    dxToTarget = txPx - this.pixelX;
    dyToTarget = tyPx - this.pixelY;
    distToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);

    if (distToTarget > 0) {
      var moveX = (dxToTarget / distToTarget) * spd;
      var moveY = (dyToTarget / distToTarget) * spd;

      // don't overshoot
      if (Math.abs(moveX) > Math.abs(dxToTarget)) moveX = dxToTarget;
      if (Math.abs(moveY) > Math.abs(dyToTarget)) moveY = dyToTarget;

      this.pixelX += moveX;
      this.pixelY += moveY;
    }

    // update tile
    this.tileX = Math.round((this.pixelX - hs) / T);
    this.tileY = Math.round((this.pixelY - hs) / T);
  }

  _updatePowerups(dt) {
    for (var key of Object.keys(this.powerups)) {
      this.powerups[key] -= dt;
      if (this.powerups[key] <= 0) delete this.powerups[key];
    }
  }

  hasPowerup(type) { return this.powerups[type] !== undefined && this.powerups[type] > 0; }

  addPowerup(type, duration) {
    this.powerups[type] = duration;
    if (type === 'TELEPORT') { delete this.powerups['TELEPORT']; return true; }
    return false;
  }

  die() { this.alive = false; this.lives--; this.deathTimer = 0; }
}