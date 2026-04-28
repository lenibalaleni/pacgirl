class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.screenShake = 0;
    this.screenShakeIntensity = 0;
    this.flashTimer = 0;
    this.flashColor = '';
    this.glitchTimer = 0;
    this.glitchIntensity = 0;
    this.vignetteAlpha = 0.7;
    this.particles = [];
    this.animeLines = [];
    this.heartbeatProximity = 0;
    this.time = 0;
  }

  clear() {
    this.ctx.fillStyle = CONFIG.COLORS.BG;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  shakeScreen(intensity, duration) {
    this.screenShake = duration;
    this.screenShakeIntensity = intensity;
  }

  flashScreen(color, duration) {
    this.flashColor = color;
    this.flashTimer = duration;
  }

  triggerGlitch(intensity, duration) {
    this.glitchIntensity = intensity;
    this.glitchTimer = duration;
  }

  addParticle(x, y, color, count = 5, speed = 2) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 0.5) * speed * 2,
        life: 300 + Math.random() * 300,
        maxLife: 600,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  addAnimeLine(x, y, angle, color, length) {
    this.animeLines.push({
      x, y, angle, color, length,
      life: 200,
      maxLife: 200,
      width: 1 + Math.random() * 2
    });
  }

  update(dt) {
    this.time += dt;

    if (this.screenShake > 0) this.screenShake -= dt;
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.glitchTimer > 0) this.glitchTimer -= dt;

    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
      return p.life > 0;
    });

    this.animeLines = this.animeLines.filter(l => {
      l.life -= dt;
      return l.life > 0;
    });
  }

  applyScreenEffects() {
    const ctx = this.ctx;

    if (this.screenShake > 0) {
      const intensity = this.screenShakeIntensity * (this.screenShake / 300);
      const dx = (Math.random() - 0.5) * intensity * 2;
      const dy = (Math.random() - 0.5) * intensity * 2;
      ctx.translate(dx, dy);
    }

    if (this.glitchTimer > 0) {
      this._drawGlitch();
    }

    if (this.flashTimer > 0) {
      const alpha = Math.min(1, this.flashTimer / 200);
      ctx.fillStyle = this.flashColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this._drawVignette();

    this._drawParticles();
    this._drawAnimeLines();

    if (this.heartbeatProximity > 0) {
      this._drawHeartbeat();
    }
  }

  _drawVignette() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.max(w, h) * 0.5;

    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${this.vignetteAlpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  _drawGlitch() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const intensity = this.glitchIntensity;

    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.3 * intensity) {
        const y = Math.random() * h;
        const sliceHeight = 1 + Math.random() * 5 * intensity;
        const offset = (Math.random() - 0.5) * 20 * intensity;
        const imgData = ctx.getImageData(0, Math.floor(y), w, Math.ceil(sliceHeight));
        ctx.putImageData(imgData, offset, Math.floor(y));
      }
    }

    if (Math.random() < 0.2 * intensity) {
      ctx.fillStyle = `rgba(${Math.random() * 255},0,0,${0.1 * intensity})`;
      ctx.fillRect(0, 0, w, 2);
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(0,${Math.floor(100 * intensity)},${Math.floor(200 * intensity)},${0.05 * intensity})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  _drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  _drawAnimeLines() {
    const ctx = this.ctx;
    for (const l of this.animeLines) {
      const alpha = l.life / l.maxLife;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = l.color;
      ctx.lineWidth = l.width * alpha;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(
        l.x + Math.cos(l.angle) * l.length,
        l.y + Math.sin(l.angle) * l.length
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  _drawHeartbeat() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const pulse = Math.sin(this.time * 0.008 * (1 + this.heartbeatProximity)) * 0.5 + 0.5;
    const alpha = pulse * this.heartbeatProximity * 0.15;

    ctx.fillStyle = `rgba(255,0,0,${alpha})`;
    ctx.fillRect(0, 0, w, h);
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    const px = player.pixelX;
    const py = player.pixelY;
    const s = CONFIG.TILE_SIZE * 0.42;

    ctx.save();

    if (player.hasPowerup('INVINCIBLE')) {
      const flash = Math.sin(player.invincibleFlash) > 0;
      if (flash) {
        ctx.globalAlpha = 0.5;
      }
      ctx.shadowColor = CONFIG.POWERUP_TYPES.INVINCIBLE.color;
      ctx.shadowBlur = 15;
    }

    if (player.hasPowerup('SPEED')) {
      ctx.shadowColor = CONFIG.POWERUP_TYPES.SPEED.color;
      ctx.shadowBlur = 10;
    }

    if (player.hasPowerup('FIRE')) {
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 12;
    }

    const walkBounce = player.moving ? Math.sin(player.walkCycle) * 2 : 0;
    const legSwing = player.moving ? Math.sin(player.walkCycle) * 0.3 : 0;
    const armSwing = player.moving ? Math.sin(player.walkCycle) * 0.25 : 0;
    const hairFlow = Math.sin(this.time * 0.005) * 2;

    const facingRight = player.facingAngle > -Math.PI / 2 && player.facingAngle < Math.PI / 2;
    const facingLeft = !facingRight;
    const facingUp = player.facingAngle < 0;
    const vertFace = Math.abs(player.facingAngle + Math.PI / 2) < 0.8 || Math.abs(player.facingAngle - Math.PI / 2 - Math.PI * 2) < 0.8;
    const flipX = facingRight ? 1 : -1;

    ctx.save();
    ctx.translate(px, py + walkBounce);
    ctx.scale(flipX, 1);

    // --- LEGS ---
    const legY = s * 0.45;
    ctx.fillStyle = '#ff6688';
    ctx.strokeStyle = '#cc2244';
    ctx.lineWidth = 1;

    ctx.save();
    ctx.translate(-s * 0.15, legY);
    ctx.rotate(legSwing);
    ctx.fillStyle = '#ffd5cc';
    ctx.beginPath();
    ctx.roundRect(-s * 0.08, 0, s * 0.16, s * 0.35, 3);
    ctx.fill();
    ctx.fillStyle = '#ff4488';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.38, s * 0.12, s * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(s * 0.15, legY);
    ctx.rotate(-legSwing);
    ctx.fillStyle = '#ffd5cc';
    ctx.beginPath();
    ctx.roundRect(-s * 0.08, 0, s * 0.16, s * 0.35, 3);
    ctx.fill();
    ctx.fillStyle = '#ff4488';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.38, s * 0.12, s * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- SKIRT ---
    ctx.fillStyle = '#ff2255';
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, s * 0.15);
    ctx.quadraticCurveTo(-s * 0.4, s * 0.5 + Math.sin(player.walkCycle) * s * 0.05, -s * 0.15, s * 0.55);
    ctx.lineTo(s * 0.15, s * 0.55);
    ctx.quadraticCurveTo(s * 0.4, s * 0.5 - Math.sin(player.walkCycle) * s * 0.05, s * 0.35, s * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#dd1144';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.15, s * 0.35, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- BODY/TORSO ---
    ctx.fillStyle = '#ff2255';
    ctx.beginPath();
    ctx.moveTo(-s * 0.25, -s * 0.1);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.15, -s * 0.3, s * 0.2);
    ctx.lineTo(s * 0.3, s * 0.2);
    ctx.quadraticCurveTo(s * 0.3, s * 0.15, s * 0.25, -s * 0.1);
    ctx.closePath();
    ctx.fill();

    // --- ARMS ---
    ctx.save();
    ctx.translate(-s * 0.3, -s * 0.05);
    ctx.rotate(-armSwing);
    ctx.fillStyle = '#ffd5cc';
    ctx.beginPath();
    ctx.roundRect(-s * 0.06, 0, s * 0.12, s * 0.35, 3);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(s * 0.3, -s * 0.05);
    ctx.rotate(armSwing);
    ctx.fillStyle = '#ffd5cc';
    ctx.beginPath();
    ctx.roundRect(-s * 0.06, 0, s * 0.12, s * 0.35, 3);
    ctx.fill();
    ctx.restore();

    // --- HEAD ---
    ctx.fillStyle = '#ffd5cc';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.4, s * 0.32, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cc9988';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // --- HAIR ---
    ctx.fillStyle = '#ff2266';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.52, s * 0.34, s * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Side hair left
    ctx.fillStyle = '#dd1155';
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.4);
    ctx.quadraticCurveTo(-s * 0.35, -s * 0.1 + hairFlow * 0.5, -s * 0.38, -s * 0.05 + hairFlow);
    ctx.quadraticCurveTo(-s * 0.42, -s * 0.3, -s * 0.3, -s * 0.5);
    ctx.closePath();
    ctx.fill();

    // Side hair right
    ctx.fillStyle = '#ff3377';
    ctx.beginPath();
    ctx.moveTo(s * 0.3, -s * 0.4);
    ctx.quadraticCurveTo(s * 0.35, -s * 0.1 + hairFlow * 0.5, s * 0.38, -s * 0.05 + hairFlow);
    ctx.quadraticCurveTo(s * 0.42, -s * 0.3, s * 0.3, -s * 0.5);
    ctx.closePath();
    ctx.fill();

    // Bangs
    ctx.fillStyle = '#ff2266';
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, -s * 0.48);
    ctx.quadraticCurveTo(-s * 0.1, -s * 0.38, s * 0.05, -s * 0.48);
    ctx.quadraticCurveTo(s * 0.2, -s * 0.4, s * 0.28, -s * 0.48);
    ctx.quadraticCurveTo(s * 0.15, -s * 0.62, 0, -s * 0.65);
    ctx.quadraticCurveTo(-s * 0.15, -s * 0.62, -s * 0.28, -s * 0.48);
    ctx.closePath();
    ctx.fill();

    // --- AHOGEM (antenna hair) ---
    ctx.strokeStyle = '#ff2266';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.62);
    ctx.quadraticCurveTo(s * 0.1 + hairFlow, -s * 0.82, s * 0.2 + hairFlow, -s * 0.78);
    ctx.stroke();
    ctx.fillStyle = '#ff2266';
    ctx.beginPath();
    ctx.arc(s * 0.2 + hairFlow, -s * 0.78, s * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // --- EYES (big anime eyes) ---
    const eyeW = s * 0.18;
    const eyeH = s * 0.28;
    const eyeY = -s * 0.38;
    const leftEyeX = -s * 0.1;
    const rightEyeX = s * 0.1;

    for (const ex of [leftEyeX, rightEyeX]) {
      // White
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Iris
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.ellipse(ex + s * 0.02, eyeY + s * 0.02, eyeW * 0.65, eyeH * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil
      ctx.fillStyle = '#220011';
      ctx.beginPath();
      ctx.ellipse(ex + s * 0.02, eyeY + s * 0.03, eyeW * 0.35, eyeH * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight big
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(ex - eyeW * 0.2, eyeY - eyeH * 0.25, eyeW * 0.3, eyeH * 0.25, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Highlight small
      ctx.beginPath();
      ctx.arc(ex + eyeW * 0.15, eyeY + eyeH * 0.2, eyeW * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Eyelashes top
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ex - eyeW * 1.1, eyeY - eyeH * 0.6);
      ctx.quadraticCurveTo(ex, eyeY - eyeH * 1.2, ex + eyeW * 1.1, eyeY - eyeH * 0.7);
      ctx.stroke();
    }

    // --- BLUSH ---
    ctx.fillStyle = 'rgba(255,100,150,0.35)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.22, eyeY + eyeH * 0.8, s * 0.08, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.22, eyeY + eyeH * 0.8, s * 0.08, s * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();

    // --- MOUTH ---
    ctx.strokeStyle = '#cc3355';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -s * 0.2, s * 0.08, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Nose
    ctx.fillStyle = '#eebbaa';
    ctx.beginPath();
    ctx.arc(0, -s * 0.28, s * 0.03, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    if (player.hasPowerup('FIRE')) {
      this._drawFireTrail(player);
    }

    if (!player.alive) {
      this._drawDeathEffect(player);
    }

    ctx.restore();
  }

  _drawFireTrail(player) {
    const ctx = this.ctx;
    for (let i = 0; i < player.fireTrail.length; i++) {
      const f = player.fireTrail[i];
      const alpha = f.timer / 1500;
      const size = CONFIG.TILE_SIZE * 0.3 * alpha;
      ctx.fillStyle = `rgba(255,${Math.floor(100 * alpha)},0,${alpha * 0.8})`;
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(f.x, f.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  _drawDeathEffect(player) {
    const ctx = this.ctx;
    const progress = Math.min(1, player.deathTimer / 1000);

    ctx.save();
    ctx.translate(player.pixelX, player.pixelY);

    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = CONFIG.COLORS.NEON_PINK;
    ctx.shadowColor = CONFIG.COLORS.NEON_PINK;
    ctx.shadowBlur = 20;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + progress * 2;
      const dist = progress * 50;
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        3 * (1 - progress),
        0, Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  drawEnemy(enemy) {
    const ctx = this.ctx;
    const px = enemy.pixelX;
    const py = enemy.pixelY;
    const size = CONFIG.TILE_SIZE * 0.38;

    ctx.save();

    if (!enemy.alive) {
      const progress = Math.min(1, enemy.deathAnimTimer / 500);
      ctx.globalAlpha = 1 - progress;
      ctx.translate(px, py);
      ctx.scale(1 + progress, 1 + progress);
      this._drawEnemyBody(ctx, 0, 0, size, enemy);
      ctx.restore();
      return;
    }

    if (enemy.frozen) {
      ctx.shadowColor = CONFIG.POWERUP_TYPES.FREEZE.color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.7 + Math.sin(this.time * 0.01) * 0.2;
    }

    if (enemy.scared) {
      ctx.globalAlpha = 0.5 + Math.sin(this.time * 0.008) * 0.2;
    }

    const glowSize = Math.sin(enemy.glowPulse) * 3;
    ctx.shadowColor = enemy.typeConfig.color;
    ctx.shadowBlur = 15 + glowSize;

    ctx.translate(px, py);

    const bob = Math.sin(enemy.animTimer * 0.01 + enemy.startTile.x) * 2;
    ctx.translate(0, bob);

    this._drawEnemyBody(ctx, 0, 0, size, enemy);

    ctx.shadowBlur = 0;
    this._drawEnemyEyes(ctx, 0, 0, size, enemy);

    ctx.restore();
  }

  _drawEnemyBody(ctx, x, y, size, enemy) {
    ctx.fillStyle = enemy.typeConfig.color;

    switch (enemy.type) {
      case 'SHADOW':
        this._drawShadow(ctx, x, y, size);
        break;
      case 'SPIRIT':
        this._drawSpirit(ctx, x, y, size);
        break;
      case 'DEMON':
        this._drawDemon(ctx, x, y, size);
        break;
      case 'YOKAI':
        this._drawYokai(ctx, x, y, size);
        break;
    }
  }

  _drawShadow(ctx, x, y, size) {
    const t = this.time;

    ctx.fillStyle = '#2a0050';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.1, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6a00aa';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.1, size * 0.6, size * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 6; i++) {
      const phase = i / 6 * Math.PI * 2;
      const waveOff = Math.sin(t * 0.006 + i * 1.2) * 4;
      const sx = x + Math.sin(phase) * size * 0.35;
      const sy = y + size * 0.65 + waveOff;
      const sw = size * 0.18;
      const sh = size * 0.35 + Math.sin(t * 0.005 + i) * 3;

      ctx.fillStyle = i % 2 === 0 ? '#500088' : '#3a0066';
      ctx.beginPath();
      ctx.ellipse(sx, sy, sw, sh, Math.sin(t * 0.003 + i) * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.85, size * 0.5, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(100,0,200,0.15)';
    ctx.beginPath();
    ctx.ellipse(x, y, size * 1.3, size * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSpirit(ctx, x, y, size) {
    const t = this.time;
    const savedAlpha = ctx.globalAlpha;
    ctx.globalAlpha = savedAlpha * 0.65;

    const wave = (offset) => Math.sin(t * 0.002 + offset) * size * 0.1;

    ctx.fillStyle = '#009988';
    ctx.beginPath();
    ctx.moveTo(x, y - size * 1.1);
    ctx.bezierCurveTo(
      x + size * 0.3 + wave(0), y - size * 0.8,
      x + size * 0.7 + wave(1), y - size * 0.3,
      x + size * 0.8 + wave(2), y + size * 0.2
    );
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.7, x + size * 0.2, y + size * 1.0);
    ctx.quadraticCurveTo(x, y + size * 0.7, x - size * 0.2, y + size * 1.0);
    ctx.quadraticCurveTo(x - size * 0.5, y + size * 0.7, x - size * 0.8 + wave(3), y + size * 0.2);
    ctx.bezierCurveTo(
      x - size * 0.7 + wave(4), y - size * 0.3,
      x - size * 0.3 + wave(5), y - size * 0.8,
      x, y - size * 1.1
    );
    ctx.fill();

    ctx.fillStyle = 'rgba(0,255,200,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.2, size * 0.45, size * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const orbAngle = t * 0.003 + i * Math.PI * 2 / 3;
      const orbX = x + Math.cos(orbAngle) * size * 0.5;
      const orbY = y - size * 0.3 + Math.sin(orbAngle) * size * 0.3;
      ctx.fillStyle = 'rgba(0,255,200,0.4)';
      ctx.beginPath();
      ctx.arc(orbX, orbY, size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = savedAlpha;
  }

  _drawDemon(ctx, x, y, size) {
    const t = this.time;

    ctx.fillStyle = '#990022';
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.8);
    ctx.quadraticCurveTo(x + size * 0.9, y - size * 0.5, x + size * 0.7, y + size * 0.3);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.9, x, y + size * 0.7);
    ctx.quadraticCurveTo(x - size * 0.5, y + size * 0.9, x - size * 0.7, y + size * 0.3);
    ctx.quadraticCurveTo(x - size * 0.9, y - size * 0.5, x, y - size * 0.8);
    ctx.fill();

    ctx.fillStyle = '#cc0033';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.6);
    ctx.lineTo(x - size * 1.0, y - size * 1.4);
    ctx.lineTo(x - size * 0.2, y - size * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#cc0033';
    ctx.beginPath();
    ctx.moveTo(x + size * 0.4, y - size * 0.6);
    ctx.lineTo(x + size * 1.0, y - size * 1.4);
    ctx.lineTo(x + size * 0.2, y - size * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.6);
    ctx.lineTo(x - size * 0.85, y - size * 1.1);
    ctx.lineTo(x - size * 0.15, y - size * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.4, y - size * 0.6);
    ctx.lineTo(x + size * 0.85, y - size * 1.1);
    ctx.lineTo(x + size * 0.15, y - size * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffcc00';
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.15);
    ctx.quadraticCurveTo(x - size * 0.15, y + size * 0.05, x - size * 0.3, y - size * 0.05);
    ctx.lineTo(x, y + size * 0.1);
    ctx.quadraticCurveTo(x + size * 0.15, y + size * 0.05, x + size * 0.3, y - size * 0.05);
    ctx.lineTo(x, y - size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(x + size * 0.1, y + size * 0.5, size * 0.6, size * 0.4, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawYokai(ctx, x, y, size) {
    const t = this.time;

    ctx.fillStyle = '#cc4400';
    ctx.beginPath();
    ctx.ellipse(x, y - size * 0.15, size * 0.55, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.35, size * 0.55, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      const spikeAngle = -Math.PI * 0.9 + (Math.PI * 0.36) * i;
      const waveOff = Math.sin(t * 0.004 + i * 2) * 3;
      const baseX = x + Math.cos(spikeAngle) * size * 0.4;
      const baseY = y - size * 0.35 + Math.sin(spikeAngle) * size * 0.45;
      const tipX = x + Math.cos(spikeAngle) * size * 1.0 + waveOff;
      const tipY = y - size * 0.35 + Math.sin(spikeAngle) * size * 1.1;

      ctx.fillStyle = i % 2 === 0 ? '#ff5500' : '#cc3300';
      ctx.beginPath();
      ctx.moveTo(baseX - size * 0.08, baseY);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(baseX + size * 0.08, baseY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#ff7733';
    ctx.strokeStyle = '#cc4400';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + size * 0.55, size * 0.4, Math.PI, 0);
    ctx.quadraticCurveTo(x + size * 0.4, y + size * 0.75, x, y + size * 0.9);
    ctx.quadraticCurveTo(x - size * 0.4, y + size * 0.75, x - size * 0.4, y + size * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,100,0,0.1)';
    ctx.beginPath();
    ctx.arc(x, y, size * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawEnemyEyes(ctx, x, y, size, enemy) {
    const dx = enemy.eyeTarget ? enemy.eyeTarget.x - enemy.pixelX : 0;
    const dy = enemy.eyeTarget ? enemy.eyeTarget.y - enemy.pixelY : 0;
    const angle = Math.atan2(dy, dx);
    const eyeW = size * 0.28;
    const eyeH = size * 0.38;

    for (let side = -1; side <= 1; side += 2) {
      const ex = x + side * size * 0.28;
      const ey = y - size * 0.15;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(ex, ey, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const irisColor = enemy.scared ? '#4444ff' :
        enemy.type === 'DEMON' ? '#ff0000' :
        enemy.type === 'SPIRIT' ? '#00dddd' :
        enemy.type === 'YOKAI' ? '#ff8800' : '#cc00ff';

      const pupilOff = Math.min(eyeW, eyeH) * 0.3;
      const px = ex + Math.cos(angle) * pupilOff;
      const py = ey + Math.sin(angle) * pupilOff;

      ctx.fillStyle = irisColor;
      ctx.beginPath();
      ctx.ellipse(px, py, eyeW * 0.55, eyeH * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(px, py, eyeW * 0.25, eyeH * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - eyeW * 0.2, ey - eyeH * 0.25, eyeW * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff88';
      ctx.beginPath();
      ctx.arc(ex + eyeW * 0.15, ey + eyeH * 0.15, eyeW * 0.08, 0, Math.PI * 2);
      ctx.fill();

      if (enemy.type === 'DEMON') {
        ctx.strokeStyle = '#ff000088';
        ctx.lineWidth = 1;
        for (let v = 0; v < 2; v++) {
          const vx = ex + side * eyeW * 0.1;
          const vy = ey + eyeH * (0.8 + v * 0.3);
          ctx.beginPath();
          ctx.moveTo(vx - eyeW * 0.15, vy);
          ctx.lineTo(vx, vy + eyeH * 0.15);
          ctx.lineTo(vx + eyeW * 0.15, vy);
          ctx.stroke();
        }
      }

      if (enemy.type === 'SHADOW') {
        ctx.fillStyle = 'rgba(100,0,200,0.3)';
        ctx.beginPath();
        ctx.ellipse(ex, ey + eyeH * 0.1, eyeW * 1.1, eyeW * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (enemy.type === 'YOKAI') {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(x, y - size * 0.35, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff000066';
      ctx.beginPath();
      ctx.arc(x, y - size * 0.35, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}