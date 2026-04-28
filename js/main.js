class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;

    this.input = new InputManager(this.canvas);
    this.renderer = new Renderer(this.canvas);
    this.ui = new UI(this.canvas);
    this.audio = new AudioManager();

    this.state = CONFIG.GAME_STATES.TITLE;
    this.currentLevel = 0;
    this.score = 0;
    this.player = null;
    this.enemies = [];
    this.maze = null;
    this.powerupManager = null;

    this.lastTime = 0;
    this.footstepTimer = 0;
    this.heartbeatTimer = 0;
    this.transitionTimer = 0;
    this.deathPauseTimer = 0;
    this.respawnPauseTimer = 0;

    this.gameLoop = this.gameLoop.bind(this);
    requestAnimationFrame(this.gameLoop);
  }

  gameLoop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (dt > 100) {
      requestAnimationFrame(this.gameLoop);
      return;
    }

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.gameLoop);
  }

  update(dt) {
    this.ui.update(dt);
    this.renderer.update(dt);

    switch (this.state) {
      case CONFIG.GAME_STATES.TITLE:
        if (this.input.consumeEnter()) {
          this.audio.init();
          this.audio.resume();
          this.startGame();
        }
        break;

      case CONFIG.GAME_STATES.PLAYING:
        if (this.input.consumePause()) {
          this.state = CONFIG.GAME_STATES.PAUSED;
          break;
        }
        this._updatePlaying(dt);
        break;

      case CONFIG.GAME_STATES.PAUSED:
        if (this.input.consumePause()) {
          this.state = CONFIG.GAME_STATES.PLAYING;
        }
        break;

      case CONFIG.GAME_STATES.LEVEL_TRANSITION:
        this.transitionTimer -= dt;
        if (this.transitionTimer <= 0) {
          this.state = CONFIG.GAME_STATES.PLAYING;
        }
        break;

      case CONFIG.GAME_STATES.GAME_OVER:
        if (this.input.consumeEnter()) {
          this.restartGame();
        }
        break;

      case CONFIG.GAME_STATES.WIN:
        if (this.input.consumeEnter()) {
          this.restartGame();
        }
        break;
    }
  }

  _updatePlaying(dt) {
    if (this.deathPauseTimer > 0) {
      this.deathPauseTimer -= dt;
      if (this.deathPauseTimer <= 0) {
        if (this.player.lives <= 0) {
          this.state = CONFIG.GAME_STATES.GAME_OVER;
          return;
        }
        this._respawnPlayer();
      }
      this.player.update(dt, this.maze);
      return;
    }

    this.player.setDirection(this.input.consumeDirection());
    this.player.update(dt, this.maze);

    this.footstepTimer += dt;
    if ((this.player.direction.x !== 0 || this.player.direction.y !== 0) && this.footstepTimer > 250) {
      this.audio.playFootstep();
      this.footstepTimer = 0;
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, this.maze, this.player);
    }

    this.powerupManager.update(dt, this.maze);

    this._checkCollisions();
    this._checkDots();
    this._checkPowerups();
    this._checkCompletion();

    let minDist = Infinity;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const dist = Math.abs(enemy.tileX - this.player.tileX) + Math.abs(enemy.tileY - this.player.tileY);
      if (dist < minDist) minDist = dist;
    }
    this.renderer.heartbeatProximity = minDist < 8 ? (8 - minDist) / 8 : 0;

    this.heartbeatTimer += dt;
    if (this.renderer.heartbeatProximity > 0.3 && this.heartbeatTimer > (1000 - this.renderer.heartbeatProximity * 500)) {
      this.audio.playHeartbeat(this.renderer.heartbeatProximity);
      this.heartbeatTimer = 0;
    }

    const bgmIntensity = Math.min(6, this.currentLevel + (1 - this.maze.dotsCollected / Math.max(1, this.maze.totalDots)) * 0.5);
    this.audio.updateBGMIntensity(bgmIntensity);
  }

  _checkCollisions() {
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.frozen) continue;

      const dx = this.player.pixelX - enemy.pixelX;
      const dy = this.player.pixelY - enemy.pixelY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.TILE_SIZE * 0.6) {
        if (this.player.hasPowerup('INVINCIBLE') || this.player.hasPowerup('FIRE')) {
          this._killEnemy(enemy);
        } else if (this.player.hasPowerup('FREEZE')) {
          // safe while frozen
        } else {
          this._playerDie();
        }
      }
    }

    if (this.player.hasPowerup('FIRE')) {
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        for (const trail of this.player.fireTrail) {
          const dx = trail.x - enemy.pixelX;
          const dy = trail.y - enemy.pixelY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONFIG.TILE_SIZE * 0.5) {
            this._killEnemy(enemy);
            break;
          }
        }
      }
    }
  }

  _killEnemy(enemy) {
    enemy.kill();
    this.score += CONFIG.ENEMY_KILL_SCORE;
    this.ui.addNotification(`+${CONFIG.ENEMY_KILL_SCORE}`, enemy.typeConfig.color, 1500);
    this.renderer.shakeScreen(5, 200);
    this.renderer.addParticle(enemy.pixelX, enemy.pixelY, enemy.typeConfig.color, 12, 3);
    this.renderer.triggerGlitch(0.3, 100);
    this.audio.playEnemyDeath();

    setTimeout(() => {
      enemy.respawn();
    }, 5000);
  }

  _playerDie() {
    this.player.die();
    this.deathPauseTimer = 1500;
    this.renderer.shakeScreen(10, 500);
    this.renderer.flashScreen('#ff0000', 300);
    this.renderer.triggerGlitch(0.8, 500);
    this.renderer.addParticle(this.player.pixelX, this.player.pixelY, '#ff0066', 20, 4);
    this.audio.playDeath();
  }

  _respawnPlayer() {
    const level = LEVELS[this.currentLevel];
    this.player._setPixelFromTile(level.playerStart.x, level.playerStart.y);
    this.player.targetTileX = level.playerStart.x;
    this.player.targetTileY = level.playerStart.y;
    this.player.atCenter = true;
    this.player.alive = true;
    this.player.direction = { x: 0, y: 0 };
    this.player.nextDirection = { x: 0, y: 0 };
    this.player.powerups = {};
    this.player.fireTrail = [];
  }

  _checkDots() {
    const dotCollected = this.maze.collectDot(this.player.tileX, this.player.tileY);
    if (dotCollected) {
      const multiplier = this.player.hasPowerup('DOUBLE') ? 2 : 1;
      this.score += CONFIG.DOT_SCORE * multiplier;
      this.audio.playDotCollect();
    }

    const bigDotCollected = this.maze.collectBigDot(this.player.tileX, this.player.tileY);
    if (bigDotCollected) {
      const multiplier = this.player.hasPowerup('DOUBLE') ? 2 : 1;
      this.score += CONFIG.DOT_SCORE * 5 * multiplier;
      this.audio.playBigDotCollect();
      this.renderer.shakeScreen(3, 150);
      this.renderer.addParticle(this.player.pixelX, this.player.pixelY, CONFIG.COLORS.DOT_BIG, 8, 2);

      for (const enemy of this.enemies) {
        if (enemy.alive) {
          enemy.scare();
          setTimeout(() => enemy.unscare(), 6000);
        }
      }
    }
  }

  _checkPowerups() {
    const collected = this.powerupManager.checkCollection(this.player);
    for (const p of collected) {
      const typeConfig = CONFIG.POWERUP_TYPES[p.type];
      this.score += CONFIG.POWERUP_SCORE;
      this.ui.addNotification(`${typeConfig.icon} ${typeConfig.name}!`, typeConfig.color, 2000);

      if (p.type === 'TELEPORT') {
        this._teleportPlayer();
      } else if (p.type === 'FREEZE') {
        this.player.addPowerup(p.type, typeConfig.duration);
        for (const enemy of this.enemies) {
          if (enemy.alive) enemy.freeze();
        }
        setTimeout(() => {
          for (const enemy of this.enemies) {
            enemy.unfreeze();
          }
        }, typeConfig.duration);
      } else {
        this.player.addPowerup(p.type, typeConfig.duration);
      }

      this.renderer.flashScreen(typeConfig.color, 200);
      this.renderer.shakeScreen(3, 150);
      this.renderer.triggerGlitch(0.2, 100);
      this.audio.playPowerup();
    }
  }

  _teleportPlayer() {
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.floor(Math.random() * CONFIG.COLS);
      const y = Math.floor(Math.random() * CONFIG.ROWS);
      if (this.maze.isWalkable(x, y) && !this._isEnemyAt(x, y)) {
        this.player._setPixelFromTile(x, y);
        this.player.targetTileX = x;
        this.player.targetTileY = y;
        this.player.atCenter = true;
        this.player.direction = { x: 0, y: 0 };
        this.renderer.addParticle(this.player.pixelX, this.player.pixelY, '#ff00ff', 15, 4);
        this.renderer.triggerGlitch(0.5, 300);
        break;
      }
      attempts++;
    }
  }

  _isEnemyAt(x, y) {
    return this.enemies.some(e => e.alive && e.tileX === x && e.tileY === y);
  }

  _checkCompletion() {
    if (this.maze.isComplete()) {
      this.audio.playLevelComplete();
      this.currentLevel++;

      if (this.currentLevel >= LEVELS.length) {
        this.state = CONFIG.GAME_STATES.WIN;
      } else {
        this._loadLevel(this.currentLevel);
        this.state = CONFIG.GAME_STATES.LEVEL_TRANSITION;
        this.transitionTimer = 2500;
      }
    }
  }

  startGame() {
    this.currentLevel = 0;
    this.score = 0;
    this._loadLevel(0);
    this.state = CONFIG.GAME_STATES.LEVEL_TRANSITION;
    this.transitionTimer = 2500;
    this.audio.startBGM(0);
  }

  _loadLevel(levelIndex) {
    const level = LEVELS[levelIndex];
    this.maze = new Maze(level);
    this.player = new Player(level.playerStart.x, level.playerStart.y);
    this.enemies = level.enemies.map(e => new Enemy(e.type, e.startTile));
    this.powerupManager = new PowerupManager();
    this.powerupManager.initFromLevel(level, this.maze);
    this.deathPauseTimer = 0;
    this.renderer.heartbeatProximity = 0;
    this.renderer.particles = [];
  }

  restartGame() {
    this.audio.stopBGM();
    this.currentLevel = 0;
    this.score = 0;
    this._loadLevel(0);
    this.state = CONFIG.GAME_STATES.LEVEL_TRANSITION;
    this.transitionTimer = 2500;
    this.audio.startBGM(0);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.state) {
      case CONFIG.GAME_STATES.TITLE:
        this.ui.drawTitleScreen();
        break;

      case CONFIG.GAME_STATES.PLAYING:
      case CONFIG.GAME_STATES.PAUSED:
        this._drawGame();
        if (this.state === CONFIG.GAME_STATES.PAUSED) {
          this.ui.drawPauseScreen();
        }
        break;

      case CONFIG.GAME_STATES.LEVEL_TRANSITION:
        this.ui.drawLevelTransition(this.currentLevel);
        break;

      case CONFIG.GAME_STATES.GAME_OVER:
        this._drawGame();
        this.ui.drawGameOver(this.score, CONFIG.LEVEL_THEMES[this.currentLevel] || CONFIG.LEVEL_THEMES[0]);
        break;

      case CONFIG.GAME_STATES.WIN:
        this.ui.drawWinScreen(this.score);
        break;
    }
  }

  _drawGame() {
    this.ctx.save();

    if (this.renderer.screenShake > 0) {
      const intensity = this.renderer.screenShakeIntensity * (this.renderer.screenShake / 300);
      this.ctx.translate(
        (Math.random() - 0.5) * intensity,
        (Math.random() - 0.5) * intensity
      );
    }

    this.renderer.clear();
    this.maze.draw(this.ctx, this.renderer.time);

    for (const enemy of this.enemies) {
      this.renderer.drawEnemy(enemy);
    }

    this.powerupManager.draw(this.ctx);
    this.renderer.drawPlayer(this.player);
    this.renderer.applyScreenEffects();

    this.ctx.restore();

    this.ui.drawHUD(this.score, this.player.lives, CONFIG.LEVEL_THEMES[this.currentLevel] || CONFIG.LEVEL_THEMES[0], this.player, this.maze);
    this.ui.drawNotifications();
  }
}

window.addEventListener('load', () => {
  new Game();
});