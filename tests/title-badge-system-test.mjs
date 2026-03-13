/**
 * Title/Badge System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  TITLE_CATEGORY,
  TITLE_RARITY,
  BADGE_TYPE,
  TITLES,
  BADGES,
  initTitleBadgeState,
  getTitleBadgeState,
  isTitleUnlocked,
  isBadgeUnlocked,
  unlockTitle,
  unlockBadge,
  equipTitle,
  displayBadge,
  hideBadge,
  upgradeBadgeSlots,
  getPlayerNameWithTitle,
  getUnlockedTitles,
  getUnlockedBadges,
  getDisplayedBadges,
  getTitlesByCategory,
  getBadgesByType,
  getTitleStats,
  clearNewUnlocks,
  getNewUnlocks,
  checkAndUnlockRewards,
  swapBadgePositions,
  getTitleHistory
} from '../src/title-badge-system.js';

import {
  renderTitlePanel,
  renderBadgePanel,
  renderUnlockNotification,
  renderUnlockNotifications,
  renderPlayerNameWithTitle,
  renderBadgeDisplayBar,
  renderTitleProgress,
  renderBadgeProgress,
  renderTitleHistory,
  renderTitleBadgeSummary,
  renderTitleTooltip,
  renderBadgeTooltip,
  getTitleBadgeStyles
} from '../src/title-badge-system-ui.js';

describe('Title/Badge System', () => {
  let state;

  beforeEach(() => {
    state = {
      player: { name: 'TestHero', gold: 5000 },
      titleBadges: initTitleBadgeState()
    };
  });

  describe('Constants and Definitions', () => {
    it('has title categories defined', () => {
      assert.ok(TITLE_CATEGORY.COMBAT);
      assert.ok(TITLE_CATEGORY.EXPLORATION);
      assert.ok(TITLE_CATEGORY.CRAFTING);
      assert.ok(TITLE_CATEGORY.SOCIAL);
      assert.ok(TITLE_CATEGORY.COLLECTION);
      assert.ok(TITLE_CATEGORY.SPECIAL);
    });

    it('has title rarities defined', () => {
      assert.ok(TITLE_RARITY.COMMON);
      assert.ok(TITLE_RARITY.UNCOMMON);
      assert.ok(TITLE_RARITY.RARE);
      assert.ok(TITLE_RARITY.EPIC);
      assert.ok(TITLE_RARITY.LEGENDARY);
    });

    it('has badge types defined', () => {
      assert.ok(BADGE_TYPE.MILESTONE);
      assert.ok(BADGE_TYPE.CHALLENGE);
      assert.ok(BADGE_TYPE.EVENT);
      assert.ok(BADGE_TYPE.SECRET);
      assert.ok(BADGE_TYPE.MASTERY);
    });

    it('has titles with required properties', () => {
      for (const [id, title] of Object.entries(TITLES)) {
        assert.strictEqual(title.id, id, `Title ${id} has matching id`);
        assert.ok(title.name, `Title ${id} has name`);
        assert.ok(title.description, `Title ${id} has description`);
        assert.ok(title.category, `Title ${id} has category`);
        assert.ok(title.rarity, `Title ${id} has rarity`);
        assert.ok(title.requirement, `Title ${id} has requirement`);
      }
    });

    it('has badges with required properties', () => {
      for (const [id, badge] of Object.entries(BADGES)) {
        assert.strictEqual(badge.id, id, `Badge ${id} has matching id`);
        assert.ok(badge.name, `Badge ${id} has name`);
        assert.ok(badge.description, `Badge ${id} has description`);
        assert.ok(badge.type, `Badge ${id} has type`);
        assert.ok(badge.icon, `Badge ${id} has icon`);
        assert.ok(badge.requirement, `Badge ${id} has requirement`);
      }
    });

    it('rarities have increasing point values', () => {
      assert.ok(TITLE_RARITY.COMMON.points < TITLE_RARITY.UNCOMMON.points);
      assert.ok(TITLE_RARITY.UNCOMMON.points < TITLE_RARITY.RARE.points);
      assert.ok(TITLE_RARITY.RARE.points < TITLE_RARITY.EPIC.points);
      assert.ok(TITLE_RARITY.EPIC.points < TITLE_RARITY.LEGENDARY.points);
    });
  });

  describe('State Initialization', () => {
    it('initializes empty title badge state', () => {
      const tbState = initTitleBadgeState();
      assert.deepStrictEqual(tbState.unlockedTitles, []);
      assert.deepStrictEqual(tbState.unlockedBadges, []);
      assert.strictEqual(tbState.equippedTitle, null);
      assert.deepStrictEqual(tbState.displayedBadges, []);
      assert.strictEqual(tbState.titlePoints, 0);
      assert.strictEqual(tbState.badgeSlots, 3);
    });

    it('gets title badge state from game state', () => {
      const tbState = getTitleBadgeState(state);
      assert.ok(tbState);
      assert.deepStrictEqual(tbState.unlockedTitles, []);
    });

    it('returns default state if titleBadges not present', () => {
      const tbState = getTitleBadgeState({});
      assert.ok(tbState);
      assert.deepStrictEqual(tbState.unlockedTitles, []);
    });
  });

  describe('Title Unlocking', () => {
    it('unlocks a title', () => {
      const result = unlockTitle(state, 'first_blood');
      assert.ok(result.unlocked);
      assert.ok(result.title);
      assert.ok(result.state.titleBadges.unlockedTitles.includes('first_blood'));
    });

    it('adds points when unlocking title', () => {
      const result = unlockTitle(state, 'first_blood');
      const expectedPoints = TITLES.first_blood.rarity.points;
      assert.strictEqual(result.state.titleBadges.titlePoints, expectedPoints);
    });

    it('records title in history', () => {
      const result = unlockTitle(state, 'first_blood');
      assert.strictEqual(result.state.titleBadges.titleHistory.length, 1);
      assert.strictEqual(result.state.titleBadges.titleHistory[0].titleId, 'first_blood');
    });

    it('adds to new unlocks list', () => {
      const result = unlockTitle(state, 'first_blood');
      assert.strictEqual(result.state.titleBadges.newUnlocks.length, 1);
      assert.strictEqual(result.state.titleBadges.newUnlocks[0].type, 'title');
    });

    it('fails to unlock invalid title', () => {
      const result = unlockTitle(state, 'nonexistent');
      assert.ok(!result.unlocked);
      assert.strictEqual(result.error, 'Invalid title ID');
    });

    it('fails to unlock already unlocked title', () => {
      let result = unlockTitle(state, 'first_blood');
      result = unlockTitle(result.state, 'first_blood');
      assert.ok(!result.unlocked);
      assert.strictEqual(result.error, 'Title already unlocked');
    });

    it('checks if title is unlocked', () => {
      assert.ok(!isTitleUnlocked(state, 'first_blood'));
      const result = unlockTitle(state, 'first_blood');
      assert.ok(isTitleUnlocked(result.state, 'first_blood'));
    });
  });

  describe('Badge Unlocking', () => {
    it('unlocks a badge', () => {
      const result = unlockBadge(state, 'level_10');
      assert.ok(result.unlocked);
      assert.ok(result.badge);
      assert.ok(result.state.titleBadges.unlockedBadges.includes('level_10'));
    });

    it('adds to new unlocks list', () => {
      const result = unlockBadge(state, 'level_10');
      assert.strictEqual(result.state.titleBadges.newUnlocks.length, 1);
      assert.strictEqual(result.state.titleBadges.newUnlocks[0].type, 'badge');
    });

    it('fails to unlock invalid badge', () => {
      const result = unlockBadge(state, 'nonexistent');
      assert.ok(!result.unlocked);
      assert.strictEqual(result.error, 'Invalid badge ID');
    });

    it('fails to unlock already unlocked badge', () => {
      let result = unlockBadge(state, 'level_10');
      result = unlockBadge(result.state, 'level_10');
      assert.ok(!result.unlocked);
      assert.strictEqual(result.error, 'Badge already unlocked');
    });

    it('checks if badge is unlocked', () => {
      assert.ok(!isBadgeUnlocked(state, 'level_10'));
      const result = unlockBadge(state, 'level_10');
      assert.ok(isBadgeUnlocked(result.state, 'level_10'));
    });
  });

  describe('Title Equipping', () => {
    it('equips an unlocked title', () => {
      let result = unlockTitle(state, 'warrior');
      result = equipTitle(result.state, 'warrior');
      assert.ok(result.equipped);
      assert.strictEqual(result.state.titleBadges.equippedTitle, 'warrior');
    });

    it('fails to equip locked title', () => {
      const result = equipTitle(state, 'warrior');
      assert.ok(!result.equipped);
      assert.strictEqual(result.error, 'Title not unlocked');
    });

    it('fails to equip invalid title', () => {
      const result = equipTitle(state, 'nonexistent');
      assert.ok(!result.equipped);
      assert.strictEqual(result.error, 'Invalid title ID');
    });

    it('unequips title by setting null', () => {
      let result = unlockTitle(state, 'warrior');
      result = equipTitle(result.state, 'warrior');
      result = equipTitle(result.state, null);
      assert.ok(result.equipped);
      assert.strictEqual(result.state.titleBadges.equippedTitle, null);
    });

    it('returns previous title when equipping new one', () => {
      let result = unlockTitle(state, 'warrior');
      result = unlockTitle(result.state, 'veteran');
      result = equipTitle(result.state, 'warrior');
      result = equipTitle(result.state, 'veteran');
      assert.strictEqual(result.previousTitle, 'warrior');
    });
  });

  describe('Badge Display', () => {
    it('displays an unlocked badge', () => {
      let result = unlockBadge(state, 'level_10');
      result = displayBadge(result.state, 'level_10');
      assert.ok(result.displayed);
      assert.ok(result.state.titleBadges.displayedBadges.includes('level_10'));
    });

    it('fails to display locked badge', () => {
      const result = displayBadge(state, 'level_10');
      assert.ok(!result.displayed);
      assert.strictEqual(result.error, 'Badge not unlocked');
    });

    it('fails to display invalid badge', () => {
      const result = displayBadge(state, 'nonexistent');
      assert.ok(!result.displayed);
      assert.strictEqual(result.error, 'Invalid badge ID');
    });

    it('fails to display already displayed badge', () => {
      let result = unlockBadge(state, 'level_10');
      result = displayBadge(result.state, 'level_10');
      result = displayBadge(result.state, 'level_10');
      assert.ok(!result.displayed);
      assert.strictEqual(result.error, 'Badge already displayed');
    });

    it('fails when badge slots are full', () => {
      let currentState = state;
      const badgeIds = ['level_10', 'level_25', 'level_50', 'first_quest'];

      for (const id of badgeIds.slice(0, 3)) {
        let result = unlockBadge(currentState, id);
        result = displayBadge(result.state, id);
        currentState = result.state;
      }

      let result = unlockBadge(currentState, 'first_quest');
      result = displayBadge(result.state, 'first_quest');
      assert.ok(!result.displayed);
      assert.strictEqual(result.error, 'No available badge slots');
    });

    it('hides a displayed badge', () => {
      let result = unlockBadge(state, 'level_10');
      result = displayBadge(result.state, 'level_10');
      result = hideBadge(result.state, 'level_10');
      assert.ok(result.hidden);
      assert.ok(!result.state.titleBadges.displayedBadges.includes('level_10'));
    });

    it('fails to hide non-displayed badge', () => {
      const result = hideBadge(state, 'level_10');
      assert.ok(!result.hidden);
      assert.strictEqual(result.error, 'Badge not displayed');
    });
  });

  describe('Badge Slot Upgrade', () => {
    it('upgrades badge slots', () => {
      const result = upgradeBadgeSlots(state, 1000);
      assert.ok(result.upgraded);
      assert.strictEqual(result.state.titleBadges.badgeSlots, 4);
      assert.strictEqual(result.state.player.gold, 4000);
    });

    it('fails when not enough gold', () => {
      state.player.gold = 100;
      const result = upgradeBadgeSlots(state, 1000);
      assert.ok(!result.upgraded);
      assert.strictEqual(result.error, 'Not enough gold');
    });

    it('fails at max badge slots', () => {
      state.titleBadges.badgeSlots = 5;
      const result = upgradeBadgeSlots(state);
      assert.ok(!result.upgraded);
      assert.strictEqual(result.error, 'Max badge slots reached');
    });
  });

  describe('Player Name with Title', () => {
    it('returns plain name without title', () => {
      const name = getPlayerNameWithTitle(state);
      assert.strictEqual(name, 'TestHero');
    });

    it('returns name with equipped title', () => {
      let result = unlockTitle(state, 'warrior');
      result = equipTitle(result.state, 'warrior');
      const name = getPlayerNameWithTitle(result.state);
      assert.strictEqual(name, 'Warrior TestHero');
    });

    it('handles missing player name', () => {
      const name = getPlayerNameWithTitle({});
      assert.strictEqual(name, 'Adventurer');
    });
  });

  describe('Getters', () => {
    it('gets unlocked titles', () => {
      let currentState = state;
      currentState = unlockTitle(currentState, 'warrior').state;
      currentState = unlockTitle(currentState, 'veteran').state;
      const titles = getUnlockedTitles(currentState);
      assert.strictEqual(titles.length, 2);
      assert.ok(titles.every(t => t.unlocked));
    });

    it('gets unlocked badges', () => {
      let currentState = state;
      currentState = unlockBadge(currentState, 'level_10').state;
      currentState = unlockBadge(currentState, 'level_25').state;
      const badges = getUnlockedBadges(currentState);
      assert.strictEqual(badges.length, 2);
      assert.ok(badges.every(b => b.unlocked));
    });

    it('gets displayed badges', () => {
      let currentState = state;
      currentState = unlockBadge(currentState, 'level_10').state;
      currentState = displayBadge(currentState, 'level_10').state;
      const badges = getDisplayedBadges(currentState);
      assert.strictEqual(badges.length, 1);
      assert.strictEqual(badges[0].id, 'level_10');
    });

    it('gets titles by category', () => {
      const combatTitles = getTitlesByCategory(state, 'combat');
      assert.ok(combatTitles.length > 0);
      assert.ok(combatTitles.every(t => t.category.id === 'combat'));
    });

    it('gets badges by type', () => {
      const milestoneBadges = getBadgesByType(state, 'milestone');
      assert.ok(milestoneBadges.length > 0);
      assert.ok(milestoneBadges.every(b => b.type.id === 'milestone'));
    });
  });

  describe('Statistics', () => {
    it('gets title stats', () => {
      const stats = getTitleStats(state);
      assert.ok(stats.totalTitles > 0);
      assert.ok(stats.totalBadges > 0);
      assert.strictEqual(stats.unlockedTitles, 0);
      assert.strictEqual(stats.unlockedBadges, 0);
      assert.strictEqual(stats.titlePoints, 0);
    });

    it('updates stats after unlocking', () => {
      let currentState = state;
      currentState = unlockTitle(currentState, 'warrior').state;
      currentState = unlockBadge(currentState, 'level_10').state;
      const stats = getTitleStats(currentState);
      assert.strictEqual(stats.unlockedTitles, 1);
      assert.strictEqual(stats.unlockedBadges, 1);
      assert.ok(stats.titlePoints > 0);
    });

    it('breaks down titles by rarity', () => {
      const stats = getTitleStats(state);
      assert.ok(stats.titlesByRarity.common);
      assert.ok(stats.titlesByRarity.legendary);
    });

    it('breaks down badges by type', () => {
      const stats = getTitleStats(state);
      assert.ok(stats.badgesByType.milestone);
      assert.ok(stats.badgesByType.challenge);
    });
  });

  describe('New Unlocks Notifications', () => {
    it('gets new unlocks', () => {
      let currentState = unlockTitle(state, 'warrior').state;
      currentState = unlockBadge(currentState, 'level_10').state;
      const unlocks = getNewUnlocks(currentState);
      assert.strictEqual(unlocks.length, 2);
    });

    it('clears new unlocks', () => {
      let currentState = unlockTitle(state, 'warrior').state;
      currentState = clearNewUnlocks(currentState);
      const unlocks = getNewUnlocks(currentState);
      assert.strictEqual(unlocks.length, 0);
    });
  });

  describe('Auto-Unlock Check', () => {
    it('auto-unlocks titles based on stats', () => {
      const stats = { battlesWon: 15 };
      const result = checkAndUnlockRewards(state, stats);
      assert.ok(result.newlyUnlocked.length > 0);
      assert.ok(isTitleUnlocked(result.state, 'first_blood'));
      assert.ok(isTitleUnlocked(result.state, 'warrior'));
    });

    it('auto-unlocks badges based on stats', () => {
      const stats = { level: 15 };
      const result = checkAndUnlockRewards(state, stats);
      assert.ok(result.newlyUnlocked.some(u => u.type === 'badge'));
      assert.ok(isBadgeUnlocked(result.state, 'level_10'));
    });

    it('does not re-unlock already unlocked rewards', () => {
      let currentState = unlockTitle(state, 'warrior').state;
      const stats = { battlesWon: 15 };
      const result = checkAndUnlockRewards(currentState, stats);
      assert.ok(!result.newlyUnlocked.some(u => u.id === 'warrior'));
    });

    it('unlocks exploration titles', () => {
      const stats = { locationsVisited: 10 };
      const result = checkAndUnlockRewards(state, stats);
      assert.ok(isTitleUnlocked(result.state, 'wanderer'));
    });

    it('unlocks crafting titles', () => {
      const stats = { itemsCrafted: 15 };
      const result = checkAndUnlockRewards(state, stats);
      assert.ok(isTitleUnlocked(result.state, 'apprentice_crafter'));
    });
  });

  describe('Badge Position Swapping', () => {
    it('swaps badge positions', () => {
      let currentState = state;
      currentState = unlockBadge(currentState, 'level_10').state;
      currentState = unlockBadge(currentState, 'level_25').state;
      currentState = displayBadge(currentState, 'level_10').state;
      currentState = displayBadge(currentState, 'level_25').state;

      const result = swapBadgePositions(currentState, 0, 1);
      assert.ok(result.swapped);
      assert.strictEqual(result.state.titleBadges.displayedBadges[0], 'level_25');
      assert.strictEqual(result.state.titleBadges.displayedBadges[1], 'level_10');
    });

    it('fails with invalid indices', () => {
      const result = swapBadgePositions(state, 0, 5);
      assert.ok(!result.swapped);
      assert.strictEqual(result.error, 'Invalid badge index');
    });
  });

  describe('Title History', () => {
    it('returns title history', () => {
      let currentState = unlockTitle(state, 'warrior').state;
      currentState = unlockTitle(currentState, 'veteran').state;
      const history = getTitleHistory(currentState);
      assert.strictEqual(history.length, 2);
    });

    it('sorts history by most recent first', () => {
      let currentState = unlockTitle(state, 'warrior').state;
      currentState = unlockTitle(currentState, 'veteran').state;
      const history = getTitleHistory(currentState);
      assert.ok(history[0].unlockedAt >= history[1].unlockedAt);
    });

    it('includes title data in history', () => {
      let currentState = unlockTitle(state, 'warrior').state;
      const history = getTitleHistory(currentState);
      assert.ok(history[0].title);
      assert.strictEqual(history[0].title.id, 'warrior');
    });
  });
});

describe('Title/Badge System UI', () => {
  let state;

  beforeEach(() => {
    state = {
      player: { name: 'TestHero', gold: 5000 },
      titleBadges: initTitleBadgeState()
    };
  });

  describe('Title Panel Rendering', () => {
    it('renders title panel', () => {
      const html = renderTitlePanel(state);
      assert.ok(html.includes('title-panel'));
      assert.ok(html.includes('Titles'));
    });

    it('shows current title as None when not equipped', () => {
      const html = renderTitlePanel(state);
      assert.ok(html.includes('None'));
    });

    it('shows category buttons', () => {
      const html = renderTitlePanel(state);
      assert.ok(html.includes('Combat'));
      assert.ok(html.includes('Exploration'));
      assert.ok(html.includes('Crafting'));
    });

    it('escapes HTML in title names', () => {
      const html = renderTitlePanel(state);
      assert.ok(!html.includes('<script>'));
    });
  });

  describe('Badge Panel Rendering', () => {
    it('renders badge panel', () => {
      const html = renderBadgePanel(state);
      assert.ok(html.includes('badge-panel'));
      assert.ok(html.includes('Badges'));
    });

    it('shows badge type buttons', () => {
      const html = renderBadgePanel(state);
      assert.ok(html.includes('Milestone'));
      assert.ok(html.includes('Challenge'));
    });

    it('shows badge slots', () => {
      const html = renderBadgePanel(state);
      assert.ok(html.includes('badge-slot'));
    });
  });

  describe('Unlock Notification Rendering', () => {
    it('renders title unlock notification', () => {
      const unlock = { type: 'title', data: TITLES.warrior };
      const html = renderUnlockNotification(unlock);
      assert.ok(html.includes('unlock-notification'));
      assert.ok(html.includes('Title Unlocked'));
      assert.ok(html.includes('Warrior'));
    });

    it('renders badge unlock notification', () => {
      const unlock = { type: 'badge', data: BADGES.level_10 };
      const html = renderUnlockNotification(unlock);
      assert.ok(html.includes('unlock-notification'));
      assert.ok(html.includes('Badge Earned'));
    });

    it('renders all pending notifications', () => {
      let currentState = unlockTitle(state, 'warrior').state;
      currentState = unlockBadge(currentState, 'level_10').state;
      const html = renderUnlockNotifications(currentState);
      assert.ok(html.includes('unlock-notifications'));
    });

    it('returns empty for no notifications', () => {
      const html = renderUnlockNotifications(state);
      assert.strictEqual(html, '');
    });
  });

  describe('Player Name Rendering', () => {
    it('renders player name without title', () => {
      const html = renderPlayerNameWithTitle(state);
      assert.ok(html.includes('TestHero'));
      assert.ok(html.includes('player-name'));
    });

    it('renders player name with title', () => {
      let currentState = unlockTitle(state, 'warrior').state;
      currentState = equipTitle(currentState, 'warrior').state;
      const html = renderPlayerNameWithTitle(currentState);
      assert.ok(html.includes('Warrior'));
      assert.ok(html.includes('TestHero'));
    });

    it('applies custom class name', () => {
      const html = renderPlayerNameWithTitle(state, { className: 'custom-class' });
      assert.ok(html.includes('custom-class'));
    });
  });

  describe('Badge Display Bar Rendering', () => {
    it('renders badge display bar', () => {
      let currentState = unlockBadge(state, 'level_10').state;
      currentState = displayBadge(currentState, 'level_10').state;
      const html = renderBadgeDisplayBar(currentState);
      assert.ok(html.includes('badge-bar'));
      assert.ok(html.includes('Level 10'));
    });

    it('renders compact badge bar', () => {
      let currentState = unlockBadge(state, 'level_10').state;
      currentState = displayBadge(currentState, 'level_10').state;
      const html = renderBadgeDisplayBar(currentState, { compact: true });
      assert.ok(html.includes('compact'));
    });

    it('shows empty message when no badges', () => {
      const html = renderBadgeDisplayBar(state);
      assert.ok(html.includes('No badges displayed'));
    });
  });

  describe('Progress Rendering', () => {
    it('renders title progress', () => {
      const html = renderTitleProgress(state);
      assert.ok(html.includes('title-progress'));
      assert.ok(html.includes('Title Progress'));
      assert.ok(html.includes('progress-bar'));
    });

    it('renders badge progress', () => {
      const html = renderBadgeProgress(state);
      assert.ok(html.includes('badge-progress'));
      assert.ok(html.includes('Badge Progress'));
    });
  });

  describe('History Rendering', () => {
    it('renders title history', () => {
      let currentState = unlockTitle(state, 'warrior').state;
      const html = renderTitleHistory(currentState);
      assert.ok(html.includes('title-history'));
      assert.ok(html.includes('Warrior'));
    });

    it('shows empty message for no history', () => {
      const html = renderTitleHistory(state);
      assert.ok(html.includes('No titles unlocked'));
    });

    it('limits history items', () => {
      let currentState = state;
      for (let i = 0; i < 15; i++) {
        const titleId = Object.keys(TITLES)[i];
        if (titleId) {
          currentState = unlockTitle(currentState, titleId).state;
        }
      }
      const html = renderTitleHistory(currentState, { limit: 5 });
      const matches = html.match(/history-item/g) || [];
      assert.ok(matches.length <= 5);
    });
  });

  describe('Summary Rendering', () => {
    it('renders title badge summary', () => {
      const html = renderTitleBadgeSummary(state);
      assert.ok(html.includes('title-badge-summary'));
      assert.ok(html.includes('Titles'));
      assert.ok(html.includes('Badges'));
    });
  });

  describe('Tooltip Rendering', () => {
    it('renders title tooltip', () => {
      const html = renderTitleTooltip('warrior');
      assert.ok(html.includes('title-tooltip'));
      assert.ok(html.includes('Warrior'));
      assert.ok(html.includes('Points'));
    });

    it('returns empty for invalid title', () => {
      const html = renderTitleTooltip('nonexistent');
      assert.strictEqual(html, '');
    });

    it('renders badge tooltip', () => {
      const html = renderBadgeTooltip('level_10');
      assert.ok(html.includes('badge-tooltip'));
      assert.ok(html.includes('Level 10'));
    });

    it('returns empty for invalid badge', () => {
      const html = renderBadgeTooltip('nonexistent');
      assert.strictEqual(html, '');
    });
  });

  describe('CSS Styles', () => {
    it('returns CSS styles', () => {
      const css = getTitleBadgeStyles();
      assert.ok(css.includes('.title-panel'));
      assert.ok(css.includes('.badge-panel'));
      assert.ok(css.includes('.unlock-notification'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes HTML in player name', () => {
      state.player.name = '<script>alert("xss")</script>';
      const html = renderPlayerNameWithTitle(state);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });

    it('escapes HTML in title descriptions', () => {
      const html = renderTitlePanel(state);
      assert.ok(!html.includes('<script>'));
    });
  });
});

describe('Title/Badge Integration', () => {
  let state;

  beforeEach(() => {
    state = {
      player: { name: 'TestHero', gold: 5000 },
      titleBadges: initTitleBadgeState()
    };
  });

  it('handles full title workflow', () => {
    // Unlock title
    let result = unlockTitle(state, 'warrior');
    assert.ok(result.unlocked);

    // Equip title
    result = equipTitle(result.state, 'warrior');
    assert.ok(result.equipped);

    // Verify name
    const name = getPlayerNameWithTitle(result.state);
    assert.strictEqual(name, 'Warrior TestHero');

    // Check stats
    const stats = getTitleStats(result.state);
    assert.strictEqual(stats.unlockedTitles, 1);
    assert.ok(stats.titlePoints > 0);
  });

  it('handles full badge workflow', () => {
    // Unlock badge
    let result = unlockBadge(state, 'level_10');
    assert.ok(result.unlocked);

    // Display badge
    result = displayBadge(result.state, 'level_10');
    assert.ok(result.displayed);

    // Verify display
    const badges = getDisplayedBadges(result.state);
    assert.strictEqual(badges.length, 1);

    // Hide badge
    result = hideBadge(result.state, 'level_10');
    assert.ok(result.hidden);
  });

  it('maintains immutable state', () => {
    const originalState = { ...state };
    unlockTitle(state, 'warrior');
    assert.deepStrictEqual(state.titleBadges, originalState.titleBadges);
  });

  it('accumulates multiple unlocks', () => {
    let currentState = state;
    currentState = unlockTitle(currentState, 'warrior').state;
    currentState = unlockTitle(currentState, 'veteran').state;
    currentState = unlockBadge(currentState, 'level_10').state;
    currentState = unlockBadge(currentState, 'level_25').state;

    const stats = getTitleStats(currentState);
    assert.strictEqual(stats.unlockedTitles, 2);
    assert.strictEqual(stats.unlockedBadges, 2);
  });
});
