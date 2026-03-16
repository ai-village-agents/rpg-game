export function renderDefeatScreen(state) {
  const playerName = state?.player?.name || "Hero";
  const className = state?.player?.className || "Adventurer";
  const enemyName = state?.enemy?.displayName || state?.enemy?.name || "an unknown foe";
  const currentFloor = state?.dungeonState?.currentFloor || 1;

  const enemiesDefeated = state?.gameStats?.enemiesDefeated ?? 0;
  const totalDamageDealt = state?.gameStats?.totalDamageDealt ?? 0;
  const totalDamageTaken = state?.gameStats?.totalDamageTaken ?? 0;
  const goldEarned = state?.gameStats?.goldEarned ?? 0;
  const potionsUsed = state?.gameStats?.potionsUsed ?? 0;
  const highestCombo = state?.gameStats?.highestCombo ?? 0;

  const quotes = [
    "The darkness claims another soul...",
    "Your journey ends here, but legends never truly die.",
    "Steel failed, yet your courage did not.",
    "The abyss remembers your final stand.",
    "A hero falls, and the dungeon grows colder.",
    "Your heartbeat fades, but the tale endures.",
    "Fate has spoken with a cruel blade.",
    "Not all victories are written in blood.",
    "The torch goes out, but the path remains.",
    "Shadows gather where your light once stood."
  ];

  const quoteIndex = (enemiesDefeated + totalDamageDealt) % quotes.length;
  const finalWords = quotes[quoteIndex];

  return `
    <section class="defeat-screen">
      <header class="defeat-header">
        <h2 class="defeat-title">💀 DEFEAT</h2>
        <div class="defeat-identity">
          <span class="defeat-name">${playerName}</span>
          <span class="defeat-class">${className}</span>
        </div>
        <p class="defeat-epitaph">Slain by ${enemyName} on Floor ${currentFloor}</p>
      </header>

      <div class="defeat-stats">
        <h3 class="defeat-section-title">Run Statistics</h3>
        <div class="defeat-stats-grid">
          <div class="defeat-stat">
            <span class="defeat-stat-label">Enemies Defeated</span>
            <span class="defeat-stat-value">${enemiesDefeated}</span>
          </div>
          <div class="defeat-stat">
            <span class="defeat-stat-label">Damage Dealt</span>
            <span class="defeat-stat-value">${totalDamageDealt}</span>
          </div>
          <div class="defeat-stat">
            <span class="defeat-stat-label">Damage Taken</span>
            <span class="defeat-stat-value">${totalDamageTaken}</span>
          </div>
          <div class="defeat-stat">
            <span class="defeat-stat-label">Gold Earned</span>
            <span class="defeat-stat-value">${goldEarned}</span>
          </div>
          <div class="defeat-stat">
            <span class="defeat-stat-label">Potions Used</span>
            <span class="defeat-stat-value">${potionsUsed}</span>
          </div>
          <div class="defeat-stat">
            <span class="defeat-stat-label">Highest Combo</span>
            <span class="defeat-stat-value">${highestCombo}</span>
          </div>
        </div>
      </div>

      <div class="defeat-final-words">
        <h3 class="defeat-section-title">Final Words</h3>
        <p class="defeat-quote">${finalWords}</p>
      </div>
    </section>
  `;
}

export function renderDefeatActions() {
  return `
    <div class="defeat-actions">
      <button class="defeat-button" id="btnTryAgain">⚔️ Rise Again</button>
      <button class="defeat-button" id="btnLoad">💾 Load Save</button>
      <button class="defeat-button" id="btnViewStats">📊 View Statistics</button>
    </div>
  `;
}

export function getDefeatScreenStyles() {
  return `
    .defeat-screen {
      background: linear-gradient(180deg, #1a0000 0%, #0b0000 100%);
      color: #f2d6d6;
      font-family: 'Press Start 2P', monospace;
      padding: 20px;
      border: 2px solid #8b0000;
      box-shadow: 0 0 18px rgba(139, 0, 0, 0.6);
      animation: defeatFadeIn 1.5s ease-out;
    }

    .defeat-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .defeat-title {
      font-size: 24px;
      color: #dc143c;
      text-shadow: 0 0 6px rgba(220, 20, 60, 0.6), 0 0 12px rgba(139, 0, 0, 0.8);
      margin: 0 0 12px;
      animation: defeatPulse 2.5s ease-in-out infinite;
    }

    .defeat-identity {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
    }

    .defeat-name {
      color: #f9c0c0;
    }

    .defeat-class {
      color: #e8a0a0;
    }

    .defeat-epitaph {
      font-style: italic;
      color: #999;
      font-size: 11px;
      margin: 12px 0 0;
    }

    .defeat-stats {
      margin-bottom: 20px;
    }

    .defeat-section-title {
      font-size: 12px;
      color: #dc143c;
      margin-bottom: 12px;
      text-transform: uppercase;
    }

    .defeat-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
    }

    .defeat-stat {
      background: rgba(26, 0, 0, 0.6);
      border: 1px solid #8b0000;
      padding: 10px;
    }

    .defeat-stat-label {
      display: block;
      font-size: 9px;
      color: #d98c8c;
      margin-bottom: 6px;
    }

    .defeat-stat-value {
      font-size: 12px;
      color: #f5c7c7;
    }

    .defeat-final-words {
      border-top: 1px dashed #8b0000;
      border-bottom: 1px dashed #8b0000;
      padding: 14px 0;
      text-align: center;
      margin-bottom: 20px;
    }

    .defeat-quote {
      font-size: 10px;
      color: #f0b5b5;
      margin: 0;
    }

    .defeat-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
    }

    .defeat-button {
      background: #1a0000;
      color: #f2d6d6;
      border: 2px solid #8b0000;
      padding: 10px 14px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      cursor: pointer;
      transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    }

    .defeat-button:hover {
      border-color: #dc143c;
      color: #fff0f0;
      box-shadow: 0 0 10px rgba(220, 20, 60, 0.6);
    }

    @keyframes defeatPulse {
      0%, 100% {
        text-shadow: 0 0 6px rgba(220, 20, 60, 0.4), 0 0 12px rgba(139, 0, 0, 0.6);
      }
      50% {
        text-shadow: 0 0 10px rgba(220, 20, 60, 0.8), 0 0 18px rgba(139, 0, 0, 0.9);
      }
    }

    @keyframes defeatFadeIn {
      0% {
        opacity: 0;
        background: #000;
      }
      100% {
        opacity: 1;
        background: transparent;
      }
    }
  `;
}
