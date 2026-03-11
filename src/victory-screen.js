/**
 * Victory Screen Module
 * Renders the "Game Complete" screen when the player defeats the final boss (Oblivion Lord, Floor 15).
 * Includes: victory fanfare animation, full stats summary, credits, and New Game+ option.
 */

export const CREDITS = [
  { role: 'Developed by', name: 'The AI Village Agents' },
  { role: '', name: '—' },
  { role: 'Agent', name: 'Claude Opus 4.6' },
  { role: 'Agent', name: 'Claude Opus 4.5' },
  { role: 'Agent', name: 'Claude Sonnet 4.6' },
  { role: 'Agent', name: 'Claude Sonnet 4.5' },
  { role: 'Agent', name: 'Claude Haiku 4.5' },
  { role: 'Agent', name: 'Opus 4.5 (Claude Code)' },
  { role: 'Agent', name: 'GPT-5' },
  { role: 'Agent', name: 'GPT-5.1' },
  { role: 'Agent', name: 'GPT-5.2' },
  { role: 'Agent', name: 'Gemini 2.5 Pro' },
  { role: 'Agent', name: 'Gemini 3.1 Pro' },
  { role: 'Agent', name: 'DeepSeek-V3.2' },
  { role: '', name: '—' },
  { role: 'Project', name: 'AI Digest — theaidigest.org' },
  { role: 'Village', name: 'theaidigest.org/village' },
];

/**
 * Calculate a performance rating based on game stats.
 * Returns { grade, title } where grade is S/A/B/C/D and title is a fun descriptor.
 */
export function calculateRating(gameStats, player) {
  if (!gameStats || !player) return { grade: 'C', title: 'Adventurer' };

  let score = 0;

  // Enemies defeated bonus
  score += Math.min(gameStats.enemiesDefeated * 2, 100);

  // Damage ratio bonus (dealt vs received)
  const ratio = gameStats.totalDamageReceived > 0
    ? gameStats.totalDamageDealt / gameStats.totalDamageReceived
    : gameStats.totalDamageDealt > 0 ? 10 : 0;
  score += Math.min(Math.floor(ratio * 10), 50);

  // Level bonus
  score += Math.min((player.level || 1) * 3, 60);

  // Battles won without fleeing
  const fleeRatio = gameStats.battlesWon > 0
    ? gameStats.battlesFled / gameStats.battlesWon
    : 1;
  score += fleeRatio < 0.1 ? 30 : fleeRatio < 0.25 ? 20 : fleeRatio < 0.5 ? 10 : 0;

  // Weakness exploitation bonus
  score += Math.min(gameStats.weaknessHits * 2, 40);

  // Shield break bonus
  score += Math.min(gameStats.shieldsBroken * 3, 30);

  if (score >= 250) return { grade: 'S', title: 'Legendary Champion' };
  if (score >= 200) return { grade: 'A', title: 'Master Slayer' };
  if (score >= 140) return { grade: 'B', title: 'Seasoned Warrior' };
  if (score >= 80)  return { grade: 'C', title: 'Adventurer' };
  return { grade: 'D', title: 'Survivor' };
}

/**
 * Format a time duration in seconds to a human-readable string.
 */
export function formatPlayTime(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '0m 0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

/**
 * Generate the victory screen HTML.
 * @param {Object} state - Game state with player, gameStats, dungeonState, inventory, etc.
 * @returns {string} HTML string for the victory screen HUD.
 */
export function renderVictoryScreen(state) {
  const gs = state.gameStats || {};
  const player = state.player || {};
  const rating = calculateRating(gs, player);
  const playTime = formatPlayTime(state.playTimeSeconds || 0);
  const floorsCleared = state.dungeonState?.floorsCleared?.length || 0;
  const itemCount = state.inventory?.length || 0;
  const className = player.className || player.class || 'Unknown';
  const specName = state.specializationState?.selectedSpec || '';

  const creditsHtml = CREDITS.map(c => {
    if (c.name === '—') return '<div class="victory-credits-divider">✦</div>';
    if (c.role) return `<div class="victory-credit-entry"><span class="victory-credit-role">${esc(c.role)}</span><span class="victory-credit-name">${esc(c.name)}</span></div>`;
    return `<div class="victory-credit-entry"><span class="victory-credit-name">${esc(c.name)}</span></div>`;
  }).join('');

  return `
    <div class="victory-screen" id="victoryScreen">
      <div class="victory-fanfare" id="victoryFanfare">
        <div class="victory-star victory-star-1">★</div>
        <div class="victory-star victory-star-2">★</div>
        <div class="victory-star victory-star-3">★</div>
        <div class="victory-star victory-star-4">✦</div>
        <div class="victory-star victory-star-5">✦</div>
      </div>

      <h1 class="victory-title">⚔ GAME COMPLETE ⚔</h1>
      <p class="victory-subtitle">The Oblivion Lord has been vanquished. Light returns to the realm.</p>

      <div class="victory-rating">
        <div class="victory-grade victory-grade-${rating.grade.toLowerCase()}">${esc(rating.grade)}</div>
        <div class="victory-rating-title">${esc(rating.title)}</div>
      </div>

      <div class="victory-hero-summary">
        <h3>${esc(player.name || 'Hero')}</h3>
        <div class="victory-hero-details">
          <span>Level ${player.level || 1} ${esc(className)}${specName ? ' — ' + esc(specName) : ''}</span>
        </div>
      </div>

      <div class="victory-stats-grid">
        <div class="victory-stat-card">
          <div class="victory-stat-label">Floors Cleared</div>
          <div class="victory-stat-value">${floorsCleared} / 15</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Enemies Defeated</div>
          <div class="victory-stat-value">${gs.enemiesDefeated || 0}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Battles Won</div>
          <div class="victory-stat-value">${gs.battlesWon || 0}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Damage Dealt</div>
          <div class="victory-stat-value">${(gs.totalDamageDealt || 0).toLocaleString()}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Damage Received</div>
          <div class="victory-stat-value">${(gs.totalDamageReceived || 0).toLocaleString()}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Items Collected</div>
          <div class="victory-stat-value">${itemCount}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Gold Earned</div>
          <div class="victory-stat-value">${(gs.goldEarned || 0).toLocaleString()}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">XP Earned</div>
          <div class="victory-stat-value">${(gs.xpEarned || 0).toLocaleString()}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Abilities Used</div>
          <div class="victory-stat-value">${gs.abilitiesUsed || 0}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Turns Played</div>
          <div class="victory-stat-value">${gs.turnsPlayed || 0}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Shields Broken</div>
          <div class="victory-stat-value">${gs.shieldsBroken || 0}</div>
        </div>
        <div class="victory-stat-card">
          <div class="victory-stat-label">Play Time</div>
          <div class="victory-stat-value">${playTime}</div>
        </div>
      </div>

      <div class="victory-credits" id="victoryCredits">
        <h3>Credits</h3>
        ${creditsHtml}
      </div>
    </div>
  `;
}

/**
 * Generate the victory screen action buttons HTML.
 */
export function renderVictoryActions() {
  return `
    <div class="buttons">
      <button id="btnNewGamePlus">New Game +</button>
      <button id="btnReturnTitle">Return to Title</button>
    </div>
  `;
}

/**
 * Create a New Game+ initial state.
 * Keeps: level, stats, some gold, class/spec.
 * Resets: dungeon progress, inventory (except equipped), quests.
 * Adds: NG+ flag and bonus.
 */
export function createNewGamePlusState(prevState) {
  const player = prevState.player || {};
  const ngPlusCount = (prevState.newGamePlusCount || 0) + 1;

  return {
    phase: 'exploration',
    player: {
      ...player,
      hp: player.maxHp || 50,
      mp: player.maxMp || 15,
      defending: false,
    },
    gold: Math.floor((prevState.gold || 0) * 0.5),
    inventory: (prevState.inventory || []).filter(i => i.equipped),
    log: [
      `New Game+ ${ngPlusCount} begins! Your power carries forward, but the dungeon grows stronger...`,
      'The Oblivion Lord has reformed. The cycle continues.',
    ],
    newGamePlus: true,
    newGamePlusCount: ngPlusCount,
    newGamePlusBonus: ngPlusCount,
    gameStats: prevState.gameStats,
    questState: undefined,
    dungeonState: undefined,
    bestiary: prevState.bestiary,
    visitedRooms: undefined,
    weatherState: undefined,
    worldEvent: undefined,
    companions: [],
    tutorialState: prevState.tutorialState,
  };
}

/** CSS styles for the victory screen. */
export function getVictoryScreenStyles() {
  return `
    .victory-screen {
      text-align: center;
      padding: 1.5rem 1rem;
      max-width: 700px;
      margin: 0 auto;
    }
    .victory-fanfare {
      position: relative;
      height: 60px;
      margin-bottom: 0.5rem;
      overflow: hidden;
    }
    .victory-star {
      position: absolute;
      font-size: 1.8rem;
      color: gold;
      animation: victory-sparkle 2s ease-in-out infinite;
    }
    .victory-star-1 { left: 10%; top: 10px; animation-delay: 0s; }
    .victory-star-2 { left: 30%; top: 25px; animation-delay: 0.3s; }
    .victory-star-3 { left: 50%; top: 5px; animation-delay: 0.6s; }
    .victory-star-4 { left: 70%; top: 20px; animation-delay: 0.9s; }
    .victory-star-5 { left: 90%; top: 10px; animation-delay: 1.2s; }
    @keyframes victory-sparkle {
      0%, 100% { opacity: 0.3; transform: scale(0.8) rotate(0deg); }
      50% { opacity: 1; transform: scale(1.3) rotate(180deg); }
    }
    .victory-title {
      font-size: 2rem;
      color: gold;
      text-shadow: 0 0 20px rgba(255,215,0,0.6), 0 2px 4px rgba(0,0,0,0.5);
      margin: 0.5rem 0;
      animation: victory-glow 3s ease-in-out infinite;
    }
    @keyframes victory-glow {
      0%, 100% { text-shadow: 0 0 20px rgba(255,215,0,0.6), 0 2px 4px rgba(0,0,0,0.5); }
      50% { text-shadow: 0 0 40px rgba(255,215,0,0.9), 0 0 60px rgba(255,215,0,0.3), 0 2px 4px rgba(0,0,0,0.5); }
    }
    .victory-subtitle {
      color: #ccc;
      font-style: italic;
      margin: 0.5rem 0 1rem;
    }
    .victory-rating {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 1rem 0;
    }
    .victory-grade {
      font-size: 3rem;
      font-weight: bold;
      width: 80px;
      height: 80px;
      line-height: 80px;
      border-radius: 50%;
      border: 3px solid;
      margin-bottom: 0.5rem;
    }
    .victory-grade-s { color: gold; border-color: gold; background: rgba(255,215,0,0.15); }
    .victory-grade-a { color: #7fff7f; border-color: #7fff7f; background: rgba(127,255,127,0.1); }
    .victory-grade-b { color: #7fd4ff; border-color: #7fd4ff; background: rgba(127,212,255,0.1); }
    .victory-grade-c { color: #ccc; border-color: #999; background: rgba(200,200,200,0.1); }
    .victory-grade-d { color: #ff9966; border-color: #ff9966; background: rgba(255,153,102,0.1); }
    .victory-rating-title {
      font-size: 1.1rem;
      color: #ddd;
      font-weight: bold;
    }
    .victory-hero-summary {
      margin: 1rem 0;
      padding: 0.8rem;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .victory-hero-summary h3 {
      margin: 0 0 0.3rem;
      color: #fff;
    }
    .victory-hero-details {
      color: #aaa;
      font-size: 0.9rem;
    }
    .victory-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.6rem;
      margin: 1rem 0;
    }
    .victory-stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 6px;
      padding: 0.5rem;
    }
    .victory-stat-label {
      font-size: 0.7rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .victory-stat-value {
      font-size: 1.1rem;
      font-weight: bold;
      color: #fff;
      margin-top: 0.2rem;
    }
    .victory-credits {
      margin: 1.5rem 0 1rem;
      padding: 1rem;
      background: rgba(255,255,255,0.03);
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .victory-credits h3 {
      margin: 0 0 0.8rem;
      color: gold;
    }
    .victory-credit-entry {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.2rem 0;
      font-size: 0.85rem;
    }
    .victory-credit-role {
      color: #888;
    }
    .victory-credit-name {
      color: #ddd;
      font-weight: bold;
    }
    .victory-credits-divider {
      color: gold;
      margin: 0.4rem 0;
      font-size: 0.8rem;
    }
  `;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
