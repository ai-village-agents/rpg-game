import { GameState } from '../engine.js';
import { WorldMap } from '../map.js';

const ROOM_COLS = 3;
const ROOM_ROWS = 3;
const ROOM_WIDTH = 250;
const ROOM_HEIGHT = 180;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const HUD_PADDING = 20;
const HUD_BAR_WIDTH = 140;
const HUD_BAR_HEIGHT = 12;

export class Renderer {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = typeof document !== 'undefined' ? document.getElementById(canvasId) : null;
    if (!this.canvas) {
      throw new Error(`Renderer: canvas element with id "${canvasId}" was not found.`);
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Renderer: failed to acquire 2D context.');
    }

    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;
  }

  initialize() {
    this.clear();
    return this;
  }

  clear() {
    this.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#000');
  }

  renderGame(gameState) {
    if (!gameState || typeof gameState.phase === 'undefined') {
      console.warn('Renderer: renderGame expected GameState instance.');
    }

    this.clear();
    if (!gameState) {
      this.drawText('Game state unavailable', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, {
        font: '20px sans-serif',
        color: '#fff',
        align: 'center',
      });
      return;
    }

    switch (gameState.phase) {
      case 'exploration':
        this.renderMap(gameState);
        this.renderHUD(gameState);
        break;
      case 'battle':
      case 'battle_victory':
      case 'battle_defeat':
        this.renderBattle(gameState.combat);
        this.renderBattleUI(gameState.combat);
        break;
      case 'menu':
        this.renderMenu(gameState.menu);
        break;
      default:
        this.drawText(`Unhandled phase: ${String(gameState.phase)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, {
          font: '20px sans-serif',
          color: '#fff',
          align: 'center',
        });
        break;
    }
  }

  renderMap(gameState) {
    const map = gameState.map;
    if (!map || !map.grid) {
      console.warn('Renderer: renderMap expected MapManager instance.');
    }

    const ctx = this.ctx;
    const originX = (CANVAS_WIDTH - ROOM_COLS * ROOM_WIDTH) / 2;
    const originY = (CANVAS_HEIGHT - ROOM_ROWS * ROOM_HEIGHT) / 2;

    const player = gameState.player || {};
    const playerPos = player.position || { x: 0, y: 0 };

    for (let row = 0; row < ROOM_ROWS; row += 1) {
      for (let col = 0; col < ROOM_COLS; col += 1) {
        const dx = col - Math.floor(ROOM_COLS / 2);
        const dy = row - Math.floor(ROOM_ROWS / 2);
        const roomX = playerPos.x + dx;
        const roomY = playerPos.y + dy;

        const room = this._getRoom(map, roomX, roomY);
        const x = originX + col * ROOM_WIDTH;
        const y = originY + row * ROOM_HEIGHT;

        this.drawRect(x, y, ROOM_WIDTH - 4, ROOM_HEIGHT - 4, room?.visited ? '#2a2d34' : '#1a1c20');
        this.drawRect(x + 2, y + 2, ROOM_WIDTH - 8, ROOM_HEIGHT - 8, 'rgba(255, 255, 255, 0.05)');

        this.drawText(`(${roomX},${roomY})`, x + 10, y + 24, {
          font: '14px monospace',
          color: '#b0b5c0',
        });

        if (room?.name) {
          this.drawText(room.name, x + ROOM_WIDTH / 2, y + ROOM_HEIGHT / 2, {
            font: '18px sans-serif',
            color: '#f0f3ff',
            align: 'center',
          });
        }
      }
    }

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#3fa7f0';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  renderHUD(gameState) {
    const ctx = this.ctx;
    const party = gameState.party;

    if (!party || !Array.isArray(party)) {
      console.warn('Renderer: renderHUD expected Party instance.');
    }

    this.drawText('Party', HUD_PADDING, HUD_PADDING, {
      font: '18px sans-serif',
      color: '#fff',
    });

    const members = this._extractPartyMembers(party);
    members.forEach((member, index) => {
      const y = HUD_PADDING + 28 + index * (HUD_BAR_HEIGHT * 2 + 18);
      const name = member?.name ?? `Member ${index + 1}`;

      this.drawText(name, HUD_PADDING, y, {
        font: '14px sans-serif',
        color: '#f0f3ff',
      });

      const hp = this._statTuple(member?.hp ?? member?.health);
      this.drawHealthBar(HUD_PADDING, y + 6, hp.current, hp.max, HUD_BAR_WIDTH, HUD_BAR_HEIGHT);
      this.drawText(`HP: ${hp.current}/${hp.max}`, HUD_PADDING + HUD_BAR_WIDTH + 10, y + 15, {
        font: '12px monospace',
        color: '#d0d4e0',
      });

      const mp = this._statTuple(member?.mp ?? member?.mana);
      this.drawHealthBar(HUD_PADDING, y + 6 + HUD_BAR_HEIGHT + 4, mp.current, mp.max, HUD_BAR_WIDTH, HUD_BAR_HEIGHT);
      this.drawText(`MP: ${mp.current}/${mp.max}`, HUD_PADDING + HUD_BAR_WIDTH + 10, y + 15 + HUD_BAR_HEIGHT + 4, {
        font: '12px monospace',
        color: '#9ad1f5',
      });
    });

    const turnInfo = `Turn: ${gameState.turn ?? 0}`;
    const goldInfo = `Gold: ${gameState.gold ?? 0}`;
    this.drawText(turnInfo, CANVAS_WIDTH - HUD_PADDING, HUD_PADDING, {
      font: '18px sans-serif',
      color: '#fff',
      align: 'right',
    });
    this.drawText(goldInfo, CANVAS_WIDTH - HUD_PADDING, HUD_PADDING + 22, {
      font: '16px sans-serif',
      color: '#ffd866',
      align: 'right',
    });
  }

  renderBattle(combat) {
    if (!combat || !combat.enemies) {
      console.warn('Renderer: renderBattle expected CombatState instance.');
    }

    this.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, '#12151c');

    const ctx = this.ctx;

    this.drawText('Battle', CANVAS_WIDTH / 2, 40, {
      font: '28px serif',
      color: '#fff',
      align: 'center',
    });

    const enemyGroup = this._safeArray(combat?.enemies ?? combat?.foes);
    enemyGroup.forEach((enemy, index) => {
      const x = CANVAS_WIDTH - 200;
      const y = 150 + index * 120;
      this.drawRect(x - 40, y - 40, 80, 80, '#5b1f1f');
      this.drawText(enemy?.name ?? `Enemy ${index + 1}`, x, y + 50, {
        font: '16px sans-serif',
        color: '#f5bfbf',
        align: 'center',
      });
      const hp = this._statTuple(enemy?.hp ?? enemy?.health);
      this.drawHealthBar(x - 60, y + 60, hp.current, hp.max, 120, 10);
    });

    const partyMembers = this._extractPartyMembers(combat?.party ?? combat?.allies);
    partyMembers.forEach((member, index) => {
      const x = 120;
      const y = 180 + index * 110;
      this.drawRect(x - 40, y - 40, 80, 80, '#1f3a5b');
      this.drawText(member?.name ?? `Ally ${index + 1}`, x, y + 50, {
        font: '16px sans-serif',
        color: '#c3dcff',
        align: 'center',
      });
      const hp = this._statTuple(member?.hp ?? member?.health);
      this.drawHealthBar(x - 60, y + 60, hp.current, hp.max, 120, 10);
    });
  }

  renderBattleUI(combat) {
    const panelHeight = 160;
    this.drawRect(0, CANVAS_HEIGHT - panelHeight, CANVAS_WIDTH, panelHeight, 'rgba(0, 0, 0, 0.7)');

    const options = this._safeArray(combat?.availableActions ?? ['Attack', 'Skill', 'Item', 'Defend', 'Run']);
    this.drawText('Actions', 30, CANVAS_HEIGHT - panelHeight + 30, {
      font: '18px sans-serif',
      color: '#fff',
    });

    options.forEach((label, index) => {
      const x = 30 + index * 140;
      const y = CANVAS_HEIGHT - panelHeight + 60;
      this.drawRect(x, y, 120, 36, '#2c3844');
      this.drawText(String(label).toUpperCase(), x + 60, y + 24, {
        font: '14px sans-serif',
        color: '#f0f3ff',
        align: 'center',
      });
    });

    const abilityList = this._safeArray(combat?.selectedActor?.abilities ?? combat?.abilities);
    this.drawText('Abilities', CANVAS_WIDTH - 200, CANVAS_HEIGHT - panelHeight + 30, {
      font: '18px sans-serif',
      color: '#fff',
      align: 'right',
    });

    abilityList.slice(0, 5).forEach((ability, index) => {
      const x = CANVAS_WIDTH - 200;
      const y = CANVAS_HEIGHT - panelHeight + 60 + index * 24;
      this.drawText(`• ${ability?.name ?? ability ?? 'Unknown'}`, x, y, {
        font: '14px sans-serif',
        color: '#c3dcff',
        align: 'right',
      });
    });
  }

  renderMenu(menuState) {
    this.drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 'rgba(0, 0, 0, 0.7)');

    const options = this._safeArray(menuState?.options ?? ['Resume', 'Inventory', 'Save', 'Quit']);
    const ctx = this.ctx;

    this.drawText(menuState?.title ?? 'Menu', CANVAS_WIDTH / 2, 160, {
      font: '32px serif',
      color: '#fff',
      align: 'center',
    });

    options.forEach((option, index) => {
      const y = 220 + index * 48;
      this.drawText(String(option), CANVAS_WIDTH / 2, y, {
        font: '22px sans-serif',
        color: '#f0f3ff',
        align: 'center',
      });
    });

    const hint = menuState?.hint ?? 'Press ESC to return.';
    this.drawText(hint, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80, {
      font: '16px sans-serif',
      color: '#b0b5c0',
      align: 'center',
    });
  }

  drawText(text, x, y, options = {}) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = options.font ?? '16px sans-serif';
    ctx.fillStyle = options.color ?? '#fff';
    ctx.textAlign = options.align ?? 'left';
    ctx.textBaseline = options.baseline ?? 'top';
    ctx.fillText(String(text), x, y);
    ctx.restore();
  }

  drawRect(x, y, w, h, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  drawHealthBar(x, y, current = 0, max = 1, width = 100, height = 10) {
    const ctx = this.ctx;
    const clampedMax = Math.max(max, 1);
    const ratio = Math.max(0, Math.min(1, current / clampedMax));

    this.drawRect(x, y, width, height, '#333');
    this.drawRect(x, y, width * ratio, height, ratio > 0.3 ? '#4caf50' : '#d9534f');

    ctx.save();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }

  _getRoom(map, x, y) {
    if (!map) return null;
    if (typeof map.getRoom === 'function') {
      return map.getRoom(x, y);
    }
    if (map.rooms && Array.isArray(map.rooms)) {
      return map.rooms.find((room) => room?.x === x && room?.y === y) ?? null;
    }
    if (map.grid && Array.isArray(map.grid[y]) && map.grid[y][x]) {
      return map.grid[y][x];
    }
    return null;
  }

  _extractPartyMembers(party) {
    if (!party) return [];
    if (party && typeof party.getMembers === 'function') {
      return this._safeArray(party.getMembers());
    }
    if (Array.isArray(party.members)) {
      return party.members;
    }
    if (Array.isArray(party)) {
      return party;
    }
    return [];
  }

  _statTuple(stat) {
    if (typeof stat === 'object' && stat !== null) {
      return {
        current: Number(stat.current ?? stat.value ?? 0),
        max: Number(stat.max ?? stat.maximum ?? 1),
      };
    }
    const value = Number(stat ?? 0);
    return { current: value, max: Math.max(value, 1) };
  }

  _safeArray(value) {
    return Array.isArray(value) ? value : [];
  }
}
