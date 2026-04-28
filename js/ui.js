class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.notifications = [];
    this.titleAnimTimer = 0;
    this.glitchTimer = 0;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  addNotification(text, color = '#ffffff', duration = 2000) {
    this.notifications.push({
      text, color, duration, timer: duration, y: 0,
      targetY: 80 + this.notifications.length * 40
    });
  }

  update(dt) {
    this.titleAnimTimer += dt;
    this.glitchTimer += dt;

    this.notifications = this.notifications.filter(n => {
      n.timer -= dt;
      n.y += (n.targetY - n.y) * 0.1;
      return n.timer > 0;
    });

    for (let i = 0; i < this.notifications.length; i++) {
      this.notifications[i].targetY = 80 + i * 40;
    }
  }

  drawHUD(score, lives, level, player, maze) {
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.save();

    ctx.fillStyle = CONFIG.COLORS.UI_BG;
    ctx.fillRect(0, 0, w, 50);
    ctx.fillStyle = CONFIG.COLORS.UI_ACCENT;
    ctx.fillRect(0, 48, w, 2);

    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
    ctx.fillText(`SCORE: ${score}`, 10, 30);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`${maze.dotsCollected}/${maze.totalDots}`, 160, 30);

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = CONFIG.COLORS.UI_ACCENT;
    ctx.textAlign = 'center';
    ctx.fillText(level.name, w / 2, 30);

    ctx.textAlign = 'right';
    ctx.font = 'bold 16px monospace';
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = CONFIG.COLORS.PLAYER;
      ctx.beginPath();
      ctx.arc(w - 30 - i * 30, 28, 8, 0.2, Math.PI * 2 - 0.2);
      ctx.lineTo(w - 30 - i * 30, 28);
      ctx.closePath();
      ctx.fill();
    }

    if (player && Object.keys(player.powerups).length > 0) {
      let px = 10;
      const py = 60;
      for (const [type, time] of Object.entries(player.powerups)) {
        const config = CONFIG.POWERUP_TYPES[type];
        if (!config) continue;

        ctx.fillStyle = config.color + '33';
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px, py, 90, 20, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = config.color;
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${config.icon} ${config.name} ${(time / 1000).toFixed(1)}s`, px + 5, py + 14);

        px += 95;
      }
    }

    ctx.restore();
  }

  drawNotifications() {
    const ctx = this.ctx;
    ctx.save();
    for (const n of this.notifications) {
      const alpha = Math.min(1, n.timer / 500, n.duration / (n.duration - n.timer + 1));
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = n.color;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 10;
      ctx.fillText(n.text, this.canvas.width / 2, n.y);
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawTitleScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = CONFIG.COLORS.BG;
    ctx.fillRect(0, 0, w, h);

    this._drawBloodDripCanvas(ctx, w, h);

    ctx.save();

    const titleY = h * 0.3;
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';

    const glitchX = Math.sin(this.glitchTimer * 0.01) * 2 + (Math.random() < 0.05 ? (Math.random() - 0.5) * 20 : 0);

    ctx.shadowColor = CONFIG.COLORS.NEON_PINK;
    ctx.shadowBlur = 30;
    ctx.fillStyle = CONFIG.COLORS.NEON_PINK;
    ctx.fillText('PacGirl', w / 2 + glitchX, titleY);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = CONFIG.COLORS.NEON_BLUE;
    ctx.lineWidth = 1;
    ctx.strokeText('PacGirl', w / 2 + glitchX + 3, titleY + 3);

    ctx.font = '16px monospace';
    ctx.fillStyle = CONFIG.COLORS.NEON_PURPLE;
    ctx.shadowColor = CONFIG.COLORS.NEON_PURPLE;
    ctx.shadowBlur = 10;
    ctx.fillText('⬥ HORROR EDITION ⬥', w / 2, titleY + 40);
    ctx.shadowBlur = 0;

    ctx.font = '18px monospace';
    ctx.fillStyle = '#888';
    const blink = Math.sin(this.titleAnimTimer * 0.004) > 0;
    if (blink) {
      ctx.fillText('Toque ou ENTER para começar', w / 2, h * 0.55);
    }

    ctx.font = '12px monospace';
    ctx.fillStyle = '#555';
    ctx.fillText('WASD / Setas para mover', w / 2, h * 0.64);
    ctx.fillText('ESC para pausar', w / 2, h * 0.67);

    ctx.fillStyle = '#ff004466';
    ctx.font = '13px monospace';
    ctx.fillText('Sobrevive. Colecta. Escapa.', w / 2, h * 0.76);

    ctx.font = '20px monospace';
    ctx.fillStyle = CONFIG.COLORS.NEON_PINK;
    ctx.shadowColor = CONFIG.COLORS.NEON_PINK;
    ctx.shadowBlur = 15;
    ctx.fillText('By Helena Afonso', w / 2, h * 0.87);
    ctx.shadowBlur = 0;
  }

  drawPauseScreen() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.NEON_PINK;
    ctx.shadowColor = CONFIG.COLORS.NEON_PINK;
    ctx.shadowBlur = 20;
    ctx.fillText('PAUSED', w / 2, h / 2 - 20);
    ctx.shadowBlur = 0;

    ctx.font = '16px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Press ESC to continue', w / 2, h / 2 + 30);
  }

  drawGameOver(score, level) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = 'rgba(10,0,0,0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 56px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#cc0000';
    ctx.shadowColor = '#cc0000';
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', w / 2, h * 0.35);
    ctx.shadowBlur = 0;

    ctx.font = '20px monospace';
    ctx.fillStyle = '#ff3333';
    ctx.fillText(`Score: ${score}`, w / 2, h * 0.48);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText(`Reached: ${level.name}`, w / 2, h * 0.55);

    const blink = Math.sin(Date.now() * 0.004) > 0;
    if (blink) {
      ctx.fillStyle = '#666';
      ctx.fillText('Toque ou ENTER para tentar novamente', w / 2, h * 0.7);
    }
  }

  drawLevelTransition(levelIndex, callback) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const theme = CONFIG.LEVEL_THEMES[levelIndex] || CONFIG.LEVEL_THEMES[0];

    ctx.fillStyle = CONFIG.COLORS.BG;
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.accentColor;
    ctx.shadowColor = theme.accentColor;
    ctx.shadowBlur = 20;
    ctx.fillText(`Level ${levelIndex + 1}`, w / 2, h * 0.4);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = CONFIG.COLORS.UI_TEXT;
    ctx.fillText(theme.name, w / 2, h * 0.5);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#666';
    ctx.fillText('Get ready...', w / 2, h * 0.62);
  }

  drawWinScreen(score) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = CONFIG.COLORS.BG;
    ctx.fillRect(0, 0, w, h);

    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00';
    ctx.shadowBlur = 30;
    ctx.fillText('YOU ESCAPED!', w / 2, h * 0.35);
    ctx.shadowBlur = 0;

    ctx.font = '24px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Final Score: ${score}`, w / 2, h * 0.5);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#888';
    const blink = Math.sin(Date.now() * 0.004) > 0;
    if (blink) {
      ctx.fillText('Toque ou ENTER para jogar novamente', w / 2, h * 0.65);
    }
  }

  _drawBloodDripCanvas(ctx, w, h) {
    ctx.fillStyle = CONFIG.COLORS.BLOOD;
    ctx.globalAlpha = 0.4;
    for (let x = 0; x < w; x += 20) {
      const dripHeight = 50 + Math.sin(x * 0.1 + this.titleAnimTimer * 0.001) * 30;
      ctx.fillRect(x, 0, 15, dripHeight);
      ctx.beginPath();
      ctx.arc(x + 7, dripHeight, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}