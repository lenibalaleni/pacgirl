const CONFIG = {
  TILE_SIZE: 40,
  COLS: 15,
  ROWS: 15,
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 600,

  PLAYER_SPEED: 3.0,
  PLAYER_SIZE: 0.7,

  ENEMY_TYPES: {
    SHADOW: {
      name: 'Sombra',
      speed: 2.0,
      color: '#6a00aa',
      behavior: 'chase',
      description: 'Persegue sem parar'
    },
    SPIRIT: {
      name: 'Espírito',
      speed: 2.3,
      color: '#00ffcc',
      behavior: 'erratic',
      description: 'Movimento imprevisível'
    },
    DEMON: {
      name: 'Demónio',
      speed: 3.0,
      color: '#ff0033',
      behavior: 'ambush',
      description: 'Rápido e cruel'
    },
    YOKAI: {
      name: 'Yokai',
      speed: 2.2,
      color: '#ff6600',
      behavior: 'patrol',
      description: 'Patrulha e acelera'
    }
  },

  POWERUP_TYPES: {
    SPEED: {
      name: 'Velocidade',
      color: '#ffff00',
      duration: 5000,
      icon: '⚡'
    },
    INVINCIBLE: {
      name: 'Invencível',
      color: '#00ffff',
      duration: 4000,
      icon: '🛡'
    },
    FREEZE: {
      name: 'Congelar',
      color: '#88ccff',
      duration: 3000,
      icon: '❄'
    },
    TELEPORT: {
      name: 'Teleporte',
      color: '#ff00ff',
      duration: 0,
      icon: '🌀'
    },
    DOUBLE: {
      name: 'Duplos Pontos',
      color: '#ffcc00',
      duration: 6000,
      icon: '×2'
    },
    FIRE: {
      name: 'Rastro de Fogo',
      color: '#ff4400',
      duration: 4000,
      icon: '🔥'
    }
  },

  DIRECTIONS: {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    NONE: { x: 0, y: 0 }
  },

  COLORS: {
    BG: '#0a0a0f',
    WALL: '#1a1a2e',
    WALL_HIGHLIGHT: '#2a2a4e',
    WALL_SHADOW: '#0d0d1a',
    PATH: '#111118',
    DOT: '#ffcc00',
    DOT_BIG: '#ff8800',
    PLAYER: '#ff4488',
    PLAYER_HAIR: '#ff2266',
    PLAYER_EYE: '#ffffff',
    PLAYER_SKIN: '#ffd5cc',
    VIGNETTE: 'rgba(0,0,0,0.7)',
    UI_TEXT: '#ffffff',
    UI_ACCENT: '#ff2255',
    UI_BG: 'rgba(10,10,15,0.9)',
    BLOOD: '#880022',
    NEON_PINK: '#ff0066',
    NEON_BLUE: '#0088ff',
    NEON_PURPLE: '#aa00ff'
  },

  GAME_STATES: {
    TITLE: 'title',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_TRANSITION: 'level_transition',
    GAME_OVER: 'game_over',
    WIN: 'win',
    POWERUP_COLLECT: 'powerup_collect'
  },

  LEVEL_THEMES: [
    { name: 'Corredor Abandonado', wallColor: '#1a1a2e', pathColor: '#111118', accentColor: '#ff0044' },
    { name: 'Hospital Maldito', wallColor: '#1a2a1e', pathColor: '#0a140a', accentColor: '#00ff44' },
    { name: 'Floresta Negra', wallColor: '#1a1a0e', pathColor: '#0f0f08', accentColor: '#886600' },
    { name: 'Catacumbas', wallColor: '#2a1a1a', pathColor: '#140a0a', accentColor: '#ff4400' },
    { name: 'Escola Assombrada', wallColor: '#1e1a2e', pathColor: '#0e0a18', accentColor: '#aa00ff' },
    { name: 'Igreja Profana', wallColor: '#2e2a1a', pathColor: '#18140a', accentColor: '#ffaa00' },
    { name: 'Inferno', wallColor: '#2e0a0a', pathColor: '#1a0505', accentColor: '#ff0000' }
  ],

  DOT_SCORE: 10,
  POWERUP_SCORE: 50,
  ENEMY_KILL_SCORE: 200
};