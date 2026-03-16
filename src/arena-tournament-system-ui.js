/**
 * Arena Tournament System UI
 * Renders arena and tournament interfaces
 */

import {
  ARENA_TIER,
  TOURNAMENT_TYPE,
  TOURNAMENTS,
  getArenaStats,
  getNextTierProgress,
  escapeHtml
} from './arena-tournament-system.js';

// Tier display colors
const TIER_COLORS = {
  [ARENA_TIER.BRONZE]: '#cd7f32',
  [ARENA_TIER.SILVER]: '#c0c0c0',
  [ARENA_TIER.GOLD]: '#ffd700',
  [ARENA_TIER.PLATINUM]: '#e5e4e2',
  [ARENA_TIER.DIAMOND]: '#b9f2ff',
  [ARENA_TIER.CHAMPION]: '#ff4500'
};

// Tier icons
const TIER_ICONS = {
  [ARENA_TIER.BRONZE]: '🥉',
  [ARENA_TIER.SILVER]: '🥈',
  [ARENA_TIER.GOLD]: '🥇',
  [ARENA_TIER.PLATINUM]: '💎',
  [ARENA_TIER.DIAMOND]: '💠',
  [ARENA_TIER.CHAMPION]: '👑'
};

/**
 * Renders the main arena panel
 * @param {Object} state - Arena state
 * @param {Object} options - Display options
 * @returns {string} HTML string
 */
export function renderArenaPanel(state, options = {}) {
  const stats = getArenaStats(state);
  const tierColor = TIER_COLORS[stats.tier] || '#ffffff';
  const tierIcon = TIER_ICONS[stats.tier] || '';

  const html = `
    <div class="arena-panel" data-tier="${escapeHtml(stats.tier)}">
      <div class="arena-header">
        <h2>Arena</h2>
        <div class="arena-tier-badge" style="background-color: ${tierColor}">
          <span class="tier-icon">${tierIcon}</span>
          <span class="tier-name">${escapeHtml(formatTierName(stats.tier))}</span>
        </div>
      </div>

      <div class="arena-rating">
        <div class="rating-display">
          <span class="rating-value">${stats.rating}</span>
          <span class="rating-label">Rating</span>
        </div>
        ${renderTierProgress(stats.tierProgress)}
      </div>

      <div class="arena-stats">
        ${renderStatRow('Matches', stats.totalMatches)}
        ${renderStatRow('Wins', stats.wins, 'stat-wins')}
        ${renderStatRow('Losses', stats.losses, 'stat-losses')}
        ${renderStatRow('Draws', stats.draws, 'stat-draws')}
        ${renderStatRow('Win Rate', `${stats.winRate}%`)}
        ${renderStatRow('Win Streak', stats.winStreak)}
        ${renderStatRow('Best Streak', stats.bestWinStreak)}
      </div>

      ${options.showQuickMatch ? renderQuickMatchButton() : ''}
      ${options.showTournaments ? renderTournamentList(state) : ''}
    </div>
  `;

  return html;
}

/**
 * Formats tier name for display
 * @param {string} tier - Tier ID
 * @returns {string} Formatted name
 */
function formatTierName(tier) {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Renders tier progress bar
 * @param {Object} progress - Tier progress data
 * @returns {string} HTML string
 */
function renderTierProgress(progress) {
  if (!progress.nextTier) {
    return `
      <div class="tier-progress">
        <div class="tier-progress-label">Maximum Tier Reached!</div>
        <div class="tier-progress-bar">
          <div class="tier-progress-fill" style="width: 100%"></div>
        </div>
      </div>
    `;
  }

  const percentage = Math.round(progress.progress * 100);

  return `
    <div class="tier-progress">
      <div class="tier-progress-label">
        ${progress.pointsNeeded} points to ${escapeHtml(formatTierName(progress.nextTier))}
      </div>
      <div class="tier-progress-bar">
        <div class="tier-progress-fill" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}

/**
 * Renders a stat row
 * @param {string} label - Stat label
 * @param {*} value - Stat value
 * @param {string} className - Optional CSS class
 * @returns {string} HTML string
 */
function renderStatRow(label, value, className = '') {
  return `
    <div class="stat-row ${escapeHtml(className)}">
      <span class="stat-label">${escapeHtml(label)}</span>
      <span class="stat-value">${escapeHtml(String(value))}</span>
    </div>
  `;
}

/**
 * Renders quick match button
 * @returns {string} HTML string
 */
function renderQuickMatchButton() {
  return `
    <div class="arena-actions">
      <button class="arena-btn arena-btn-primary" data-action="quick-match">
        Find Match
      </button>
    </div>
  `;
}

/**
 * Renders tournament list
 * @param {Object} state - Arena state
 * @returns {string} HTML string
 */
function renderTournamentList(state) {
  const tournamentHtml = Object.values(TOURNAMENTS).map(tournament => {
    return renderTournamentCard(tournament, state);
  }).join('');

  return `
    <div class="tournament-list">
      <h3>Tournaments</h3>
      ${tournamentHtml}
    </div>
  `;
}

/**
 * Renders a tournament card
 * @param {Object} tournament - Tournament template
 * @param {Object} state - Arena state
 * @returns {string} HTML string
 */
function renderTournamentCard(tournament, state) {
  const canEnter = state && state.rating >= 0;

  return `
    <div class="tournament-card" data-tournament="${escapeHtml(tournament.id)}">
      <div class="tournament-header">
        <h4>${escapeHtml(tournament.name)}</h4>
        <span class="tournament-type">${escapeHtml(formatTournamentType(tournament.type))}</span>
      </div>
      <p class="tournament-desc">${escapeHtml(tournament.description)}</p>
      <div class="tournament-info">
        <span class="tournament-fee">Entry: ${tournament.entryFee} gold</span>
        <span class="tournament-level">Min Level: ${tournament.minLevel}</span>
      </div>
      <button
        class="arena-btn ${canEnter ? 'arena-btn-secondary' : 'arena-btn-disabled'}"
        data-action="enter-tournament"
        data-tournament-id="${escapeHtml(tournament.id)}"
        ${canEnter ? '' : 'disabled'}
      >
        Enter Tournament
      </button>
    </div>
  `;
}

/**
 * Formats tournament type for display
 * @param {string} type - Tournament type
 * @returns {string} Formatted type
 */
function formatTournamentType(type) {
  const typeNames = {
    [TOURNAMENT_TYPE.SINGLE_ELIMINATION]: 'Single Elim',
    [TOURNAMENT_TYPE.DOUBLE_ELIMINATION]: 'Double Elim',
    [TOURNAMENT_TYPE.ROUND_ROBIN]: 'Round Robin',
    [TOURNAMENT_TYPE.GAUNTLET]: 'Gauntlet'
  };
  return typeNames[type] || type;
}

/**
 * Renders active tournament view
 * @param {Object} tournament - Active tournament
 * @returns {string} HTML string
 */
export function renderActiveTournament(tournament) {
  if (!tournament) {
    return '<div class="tournament-empty">No active tournament</div>';
  }

  let bracketHtml = '';
  switch (tournament.bracket.type) {
    case TOURNAMENT_TYPE.SINGLE_ELIMINATION:
    case TOURNAMENT_TYPE.DOUBLE_ELIMINATION:
      bracketHtml = renderEliminationBracket(tournament);
      break;
    case TOURNAMENT_TYPE.ROUND_ROBIN:
      bracketHtml = renderRoundRobinView(tournament);
      break;
    case TOURNAMENT_TYPE.GAUNTLET:
      bracketHtml = renderGauntletView(tournament);
      break;
  }

  return `
    <div class="active-tournament" data-tournament-id="${escapeHtml(tournament.id)}">
      <div class="tournament-title">
        <h2>${escapeHtml(tournament.name)}</h2>
        <span class="tournament-status status-${escapeHtml(tournament.status)}">${escapeHtml(tournament.status)}</span>
      </div>
      ${bracketHtml}
      ${renderTournamentActions(tournament)}
    </div>
  `;
}

/**
 * Renders elimination bracket
 * @param {Object} tournament - Tournament instance
 * @returns {string} HTML string
 */
function renderEliminationBracket(tournament) {
  const bracket = tournament.bracket;
  const rounds = bracket.type === TOURNAMENT_TYPE.DOUBLE_ELIMINATION
    ? bracket.winners.rounds
    : bracket.rounds;

  let html = '<div class="bracket-container">';

  rounds.forEach((round, roundIndex) => {
    html += `<div class="bracket-round" data-round="${roundIndex}">`;
    html += `<div class="round-header">Round ${roundIndex + 1}</div>`;

    round.forEach(match => {
      html += renderBracketMatch(match);
    });

    html += '</div>';
  });

  html += '</div>';
  return html;
}

/**
 * Renders a bracket match
 * @param {Object} match - Match data
 * @returns {string} HTML string
 */
function renderBracketMatch(match) {
  const p1Class = match.winner && match.winner.id === match.participant1?.id ? 'winner' : '';
  const p2Class = match.winner && match.winner.id === match.participant2?.id ? 'winner' : '';
  const p1Player = match.participant1?.isPlayer ? 'is-player' : '';
  const p2Player = match.participant2?.isPlayer ? 'is-player' : '';

  return `
    <div class="bracket-match" data-match-id="${escapeHtml(match.id)}" data-status="${escapeHtml(match.status)}">
      <div class="match-participant ${p1Class} ${p1Player}">
        ${match.participant1 ? escapeHtml(match.participant1.name) : 'TBD'}
      </div>
      <div class="match-vs">vs</div>
      <div class="match-participant ${p2Class} ${p2Player}">
        ${match.participant2 ? escapeHtml(match.participant2.name) : 'TBD'}
      </div>
    </div>
  `;
}

/**
 * Renders round robin view
 * @param {Object} tournament - Tournament instance
 * @returns {string} HTML string
 */
function renderRoundRobinView(tournament) {
  const bracket = tournament.bracket;

  // Standings table
  let standingsHtml = `
    <div class="standings-table">
      <h3>Standings</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>W</th>
            <th>L</th>
            <th>D</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
  `;

  bracket.standings.forEach((standing, index) => {
    const isPlayer = standing.participant.isPlayer ? 'is-player' : '';
    standingsHtml += `
      <tr class="${isPlayer}">
        <td>${index + 1}</td>
        <td>${escapeHtml(standing.participant.name)}</td>
        <td>${standing.wins}</td>
        <td>${standing.losses}</td>
        <td>${standing.draws}</td>
        <td><strong>${standing.points}</strong></td>
      </tr>
    `;
  });

  standingsHtml += '</tbody></table></div>';

  // Matches list
  let matchesHtml = '<div class="round-robin-matches"><h3>Matches</h3>';
  bracket.matches.forEach(match => {
    const statusClass = match.status === 'completed' ? 'match-completed' : 'match-pending';
    const hasPlayer = match.participant1.isPlayer || match.participant2.isPlayer;
    const playerClass = hasPlayer ? 'player-match' : '';

    matchesHtml += `
      <div class="rr-match ${statusClass} ${playerClass}" data-match-id="${escapeHtml(match.id)}">
        <span class="rr-p1 ${match.winner?.id === match.participant1.id ? 'winner' : ''}">
          ${escapeHtml(match.participant1.name)}
        </span>
        <span class="rr-vs">vs</span>
        <span class="rr-p2 ${match.winner?.id === match.participant2.id ? 'winner' : ''}">
          ${escapeHtml(match.participant2.name)}
        </span>
        ${match.status === 'completed' ? '<span class="rr-done">Done</span>' : ''}
      </div>
    `;
  });
  matchesHtml += '</div>';

  return standingsHtml + matchesHtml;
}

/**
 * Renders gauntlet view
 * @param {Object} tournament - Tournament instance
 * @returns {string} HTML string
 */
function renderGauntletView(tournament) {
  const bracket = tournament.bracket;

  let html = `
    <div class="gauntlet-view">
      <div class="gauntlet-progress">
        <span class="progress-label">Progress</span>
        <div class="gauntlet-progress-bar">
  `;

  bracket.rounds.forEach((round, index) => {
    let roundClass = 'gauntlet-round';
    if (round.status === 'completed') {
      roundClass += round.result === 'win' ? ' round-won' : ' round-lost';
    } else if (index === bracket.currentRound) {
      roundClass += ' round-current';
    }

    html += `<div class="${roundClass}" title="Round ${round.round}">${round.round}</div>`;
  });

  html += `
        </div>
      </div>
  `;

  if (!bracket.completed && bracket.currentRound < bracket.rounds.length) {
    const currentRound = bracket.rounds[bracket.currentRound];
    html += `
      <div class="gauntlet-current">
        <h3>Round ${currentRound.round}</h3>
        <div class="gauntlet-opponent">
          <div class="opponent-name">${escapeHtml(currentRound.opponent.name)}</div>
          <div class="opponent-level">Level ${currentRound.opponent.level}</div>
        </div>
      </div>
    `;
  } else {
    html += `
      <div class="gauntlet-complete">
        <h3>${bracket.currentRound >= bracket.rounds.length ? 'Gauntlet Complete!' : 'Defeated at Round ' + (bracket.currentRound + 1)}</h3>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Renders tournament action buttons
 * @param {Object} tournament - Tournament instance
 * @returns {string} HTML string
 */
function renderTournamentActions(tournament) {
  if (tournament.status === 'completed') {
    return `
      <div class="tournament-actions">
        <button class="arena-btn arena-btn-primary" data-action="claim-rewards">
          Claim Rewards
        </button>
        <button class="arena-btn arena-btn-secondary" data-action="leave-tournament">
          Leave
        </button>
      </div>
    `;
  }

  if (tournament.playerStatus === 'eliminated') {
    return `
      <div class="tournament-actions">
        <div class="eliminated-message">You have been eliminated</div>
        <button class="arena-btn arena-btn-secondary" data-action="leave-tournament">
          Leave Tournament
        </button>
      </div>
    `;
  }

  return `
    <div class="tournament-actions">
      <button class="arena-btn arena-btn-primary" data-action="next-match">
        Next Match
      </button>
      <button class="arena-btn arena-btn-danger" data-action="forfeit">
        Forfeit
      </button>
    </div>
  `;
}

/**
 * Renders match result popup
 * @param {Object} result - Match result data
 * @returns {string} HTML string
 */
export function renderMatchResult(result) {
  const isWin = result.result === 'win';
  const resultClass = isWin ? 'result-win' : 'result-loss';
  const resultText = isWin ? 'Victory!' : 'Defeat';

  let ratingChangeHtml = '';
  if (result.rewards.ratingChange !== undefined) {
    const changeClass = result.rewards.ratingChange >= 0 ? 'rating-up' : 'rating-down';
    const changeSign = result.rewards.ratingChange >= 0 ? '+' : '';
    ratingChangeHtml = `
      <div class="rating-change ${changeClass}">
        ${changeSign}${result.rewards.ratingChange} Rating
      </div>
    `;
  }

  let rewardsHtml = '';
  if (result.rewards.gold > 0 || result.rewards.xp > 0) {
    rewardsHtml = `
      <div class="match-rewards">
        ${result.rewards.gold > 0 ? `<span class="reward-gold">+${result.rewards.gold} Gold</span>` : ''}
        ${result.rewards.xp > 0 ? `<span class="reward-xp">+${result.rewards.xp} XP</span>` : ''}
      </div>
    `;
  }

  let tierPromotionHtml = '';
  if (result.rewards.tierPromotion) {
    const newTierIcon = TIER_ICONS[result.rewards.tierPromotion.to] || '';
    tierPromotionHtml = `
      <div class="tier-promotion">
        <span class="promotion-icon">${newTierIcon}</span>
        <span class="promotion-text">Promoted to ${escapeHtml(formatTierName(result.rewards.tierPromotion.to))}!</span>
      </div>
    `;
  }

  let streakHtml = '';
  if (result.rewards.streakBonus) {
    streakHtml = `
      <div class="streak-bonus">
        Win Streak Bonus: +${result.rewards.streakBonus} Gold
      </div>
    `;
  }

  return `
    <div class="match-result-popup ${resultClass}">
      <h2 class="result-title">${resultText}</h2>
      ${ratingChangeHtml}
      ${tierPromotionHtml}
      ${rewardsHtml}
      ${streakHtml}
      <button class="arena-btn arena-btn-primary" data-action="close-result">
        Continue
      </button>
    </div>
  `;
}

/**
 * Renders arena leaderboard
 * @param {Array} leaderboard - Leaderboard entries
 * @param {string} playerName - Current player name
 * @returns {string} HTML string
 */
export function renderLeaderboard(leaderboard, playerName) {
  if (!leaderboard || leaderboard.length === 0) {
    return '<div class="leaderboard-empty">No leaderboard data</div>';
  }

  let html = `
    <div class="arena-leaderboard">
      <h2>Leaderboard</h2>
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Tier</th>
            <th>Rating</th>
            <th>W-L</th>
          </tr>
        </thead>
        <tbody>
  `;

  leaderboard.forEach((entry, index) => {
    const isPlayer = entry.name === playerName ? 'is-player' : '';
    const tierIcon = TIER_ICONS[entry.tier] || '';
    const tierColor = TIER_COLORS[entry.tier] || '#ffffff';

    html += `
      <tr class="${isPlayer}">
        <td class="rank">${index + 1}</td>
        <td class="name">${escapeHtml(entry.name)}</td>
        <td class="tier" style="color: ${tierColor}">${tierIcon} ${escapeHtml(formatTierName(entry.tier))}</td>
        <td class="rating">${entry.rating}</td>
        <td class="record">${entry.wins}-${entry.losses}</td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  return html;
}

/**
 * Renders match history
 * @param {Array} history - Match history array
 * @returns {string} HTML string
 */
export function renderMatchHistory(history) {
  if (!history || history.length === 0) {
    return '<div class="history-empty">No match history</div>';
  }

  let html = '<div class="match-history"><h3>Recent Matches</h3><ul>';

  history.slice().reverse().slice(0, 20).forEach(match => {
    const resultClass = match.result === 'win' ? 'history-win' :
                       match.result === 'loss' ? 'history-loss' : 'history-draw';
    const resultText = match.result.charAt(0).toUpperCase() + match.result.slice(1);
    const ratingText = match.ratingChange >= 0 ? `+${match.ratingChange}` : match.ratingChange;
    const timestamp = new Date(match.timestamp).toLocaleDateString();

    html += `
      <li class="history-entry ${resultClass}">
        <span class="history-result">${escapeHtml(resultText)}</span>
        <span class="history-rating">${ratingText}</span>
        <span class="history-date">${escapeHtml(timestamp)}</span>
      </li>
    `;
  });

  html += '</ul></div>';
  return html;
}

/**
 * Renders arena HUD element
 * @param {Object} state - Arena state
 * @returns {string} HTML string
 */
export function renderArenaHud(state) {
  const tierIcon = TIER_ICONS[state.tier] || '';
  const tierColor = TIER_COLORS[state.tier] || '#ffffff';

  return `
    <div class="arena-hud">
      <span class="hud-tier" style="color: ${tierColor}">${tierIcon}</span>
      <span class="hud-rating">${state.rating}</span>
      ${state.winStreak >= 3 ? `<span class="hud-streak">🔥${state.winStreak}</span>` : ''}
    </div>
  `;
}

/**
 * Renders season summary
 * @param {Object} seasonStats - Season statistics
 * @returns {string} HTML string
 */
export function renderSeasonSummary(seasonStats) {
  const winRate = seasonStats.wins + seasonStats.losses > 0
    ? ((seasonStats.wins / (seasonStats.wins + seasonStats.losses)) * 100).toFixed(1)
    : 0;

  return `
    <div class="season-summary">
      <h3>Season ${seasonStats.season}</h3>
      <div class="season-stats">
        ${renderStatRow('Current Rating', seasonStats.rating)}
        ${renderStatRow('Highest Rating', seasonStats.highestRating)}
        ${renderStatRow('Season Wins', seasonStats.wins)}
        ${renderStatRow('Season Losses', seasonStats.losses)}
        ${renderStatRow('Win Rate', `${winRate}%`)}
      </div>
    </div>
  `;
}

/**
 * Gets CSS styles for arena components
 * @returns {string} CSS string
 */
export function getArenaStyles() {
  return `
    .arena-panel {
      background: #1a1a2e;
      border-radius: 8px;
      padding: 16px;
      color: #ffffff;
    }

    .arena-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .arena-tier-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-weight: bold;
    }

    .arena-rating {
      text-align: center;
      margin-bottom: 16px;
    }

    .rating-value {
      font-size: 32px;
      font-weight: bold;
    }

    .rating-label {
      display: block;
      color: #888;
    }

    .tier-progress-bar {
      background: #333;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 8px;
    }

    .tier-progress-fill {
      background: linear-gradient(90deg, #4caf50, #8bc34a);
      height: 100%;
      transition: width 0.3s ease;
    }

    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #333;
    }

    .stat-wins .stat-value { color: #4caf50; }
    .stat-losses .stat-value { color: #f44336; }
    .stat-draws .stat-value { color: #ff9800; }

    .arena-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      margin: 4px;
    }

    .arena-btn-primary {
      background: #4caf50;
      color: white;
    }

    .arena-btn-secondary {
      background: #2196f3;
      color: white;
    }

    .arena-btn-danger {
      background: #f44336;
      color: white;
    }

    .arena-btn-disabled {
      background: #666;
      color: #999;
      cursor: not-allowed;
    }

    .tournament-card {
      background: #252540;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
    }

    .bracket-container {
      display: flex;
      gap: 16px;
      overflow-x: auto;
    }

    .bracket-match {
      background: #252540;
      border-radius: 4px;
      padding: 8px;
      margin: 4px 0;
    }

    .match-participant.winner {
      color: #4caf50;
      font-weight: bold;
    }

    .match-participant.is-player {
      color: #2196f3;
    }

    .match-result-popup {
      text-align: center;
      padding: 24px;
    }

    .result-win .result-title { color: #4caf50; }
    .result-loss .result-title { color: #f44336; }

    .rating-up { color: #4caf50; }
    .rating-down { color: #f44336; }

    .tier-promotion {
      background: linear-gradient(45deg, #ffd700, #ff8c00);
      padding: 8px 16px;
      border-radius: 8px;
      margin: 8px 0;
    }

    .is-player {
      background: rgba(33, 150, 243, 0.2);
    }

    .gauntlet-progress-bar {
      display: flex;
      gap: 4px;
    }

    .gauntlet-round {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #333;
      border-radius: 50%;
    }

    .round-won { background: #4caf50; }
    .round-lost { background: #f44336; }
    .round-current { background: #2196f3; animation: pulse 1s infinite; }

    .tournament-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
}
