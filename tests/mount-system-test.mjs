/**
 * Tests for Mount System
 * Run with: node --test tests/mount-system-test.mjs
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  MOUNTS,
  MOUNT_TYPES,
  MOUNT_RARITIES,
  MOUNT_ABILITIES,
  initMountState,
  getMountState,
  addMount,
  mountUp,
  dismount,
  calculateSpeedBonus,
  calculateMountLevel,
  useStamina,
  restMount,
  feedMount,
  getMountAbilities,
  canTraverseTerrain,
  getActiveMountInfo,
  getCollectionStats,
  getOwnedMounts,
  storeInStable,
  retrieveFromStable,
  recordDistance
} from '../src/mount-system.js';

describe('Mount System', () => {
  let gameState;

  beforeEach(() => {
    gameState = { mounts: initMountState() };
  });

  describe('Constants', () => {
    it('has all mount types', () => {
      assert.ok(MOUNT_TYPES.LAND);
      assert.ok(MOUNT_TYPES.FLYING);
      assert.ok(MOUNT_TYPES.AQUATIC);
      assert.ok(MOUNT_TYPES.AMPHIBIOUS);
    });

    it('has terrain info for mount types', () => {
      assert.ok(MOUNT_TYPES.LAND.terrain.includes('plains'));
      assert.ok(MOUNT_TYPES.FLYING.ignoresTerrain);
      assert.ok(MOUNT_TYPES.AQUATIC.terrain.includes('water'));
    });

    it('has all mount rarities', () => {
      assert.ok(MOUNT_RARITIES.COMMON);
      assert.ok(MOUNT_RARITIES.UNCOMMON);
      assert.ok(MOUNT_RARITIES.RARE);
      assert.ok(MOUNT_RARITIES.EPIC);
      assert.ok(MOUNT_RARITIES.LEGENDARY);
    });

    it('has speed bonuses for rarities', () => {
      assert.strictEqual(MOUNT_RARITIES.COMMON.speedBonus, 1.2);
      assert.strictEqual(MOUNT_RARITIES.LEGENDARY.speedBonus, 2.0);
    });

    it('has colors for rarities', () => {
      assert.strictEqual(MOUNT_RARITIES.COMMON.color, '#AAAAAA');
      assert.strictEqual(MOUNT_RARITIES.LEGENDARY.color, '#FF8800');
    });

    it('has multiple mounts defined', () => {
      assert.ok(Object.keys(MOUNTS).length >= 14);
      assert.ok(MOUNTS.draft_horse);
      assert.ok(MOUNTS.gryphon);
      assert.ok(MOUNTS.elder_dragon);
    });

    it('mounts have required properties', () => {
      for (const mount of Object.values(MOUNTS)) {
        assert.ok(mount.id);
        assert.ok(mount.name);
        assert.ok(mount.type);
        assert.ok(mount.rarity);
        assert.ok(mount.baseSpeed);
        assert.ok(mount.stamina);
        assert.ok(mount.description);
        assert.ok(Array.isArray(mount.abilities));
      }
    });

    it('has multiple mount abilities', () => {
      assert.ok(Object.keys(MOUNT_ABILITIES).length >= 20);
      assert.ok(MOUNT_ABILITIES.steady_pace);
      assert.ok(MOUNT_ABILITIES.dragon_breath);
    });

    it('abilities have descriptions', () => {
      for (const ability of Object.values(MOUNT_ABILITIES)) {
        assert.ok(ability.id);
        assert.ok(ability.name);
        assert.ok(ability.description);
      }
    });
  });

  describe('initMountState', () => {
    it('creates empty mount state', () => {
      const state = initMountState();
      assert.deepStrictEqual(state.ownedMounts, []);
      assert.strictEqual(state.activeMount, null);
      assert.deepStrictEqual(state.mountStats, {});
      assert.deepStrictEqual(state.stables, []);
      assert.strictEqual(state.totalDistanceTraveled, 0);
    });
  });

  describe('getMountState', () => {
    it('returns existing mount state', () => {
      const result = getMountState(gameState);
      assert.strictEqual(result, gameState.mounts);
    });

    it('creates new mount state if none exists', () => {
      const result = getMountState({});
      assert.ok(result.ownedMounts);
      assert.strictEqual(result.activeMount, null);
    });
  });

  describe('addMount', () => {
    it('adds mount to collection', () => {
      const result = addMount(gameState, 'draft_horse');
      assert.ok(result.added);
      assert.ok(result.state.mounts.ownedMounts.includes('draft_horse'));
    });

    it('creates mount stats', () => {
      const result = addMount(gameState, 'draft_horse');
      const stats = result.state.mounts.mountStats.draft_horse;
      assert.strictEqual(stats.level, 1);
      assert.strictEqual(stats.experience, 0);
      assert.strictEqual(stats.bond, 0);
      assert.strictEqual(stats.happiness, 100);
    });

    it('fails for invalid mount', () => {
      const result = addMount(gameState, 'invalid_mount');
      assert.strictEqual(result.added, false);
      assert.ok(result.error);
    });

    it('fails for already owned mount', () => {
      const result1 = addMount(gameState, 'draft_horse');
      const result2 = addMount(result1.state, 'draft_horse');
      assert.strictEqual(result2.added, false);
      assert.ok(result2.error);
    });

    it('sets current stamina to max', () => {
      const result = addMount(gameState, 'draft_horse');
      const stats = result.state.mounts.mountStats.draft_horse;
      assert.strictEqual(stats.currentStamina, MOUNTS.draft_horse.stamina);
    });

    it('adds to mount collection', () => {
      const result = addMount(gameState, 'draft_horse');
      assert.ok(result.state.mounts.mountCollection.draft_horse);
    });
  });

  describe('mountUp', () => {
    beforeEach(() => {
      const result = addMount(gameState, 'draft_horse');
      gameState = result.state;
    });

    it('mounts successfully', () => {
      const result = mountUp(gameState, 'draft_horse');
      assert.ok(result.mounted);
      assert.strictEqual(result.state.mounts.activeMount, 'draft_horse');
    });

    it('returns mount data', () => {
      const result = mountUp(gameState, 'draft_horse');
      assert.strictEqual(result.mount.id, 'draft_horse');
    });

    it('returns speed bonus', () => {
      const result = mountUp(gameState, 'draft_horse');
      assert.ok(result.speedBonus > 1);
    });

    it('fails for unowned mount', () => {
      const result = mountUp(gameState, 'gryphon');
      assert.strictEqual(result.mounted, false);
      assert.ok(result.error);
    });

    it('fails for invalid mount', () => {
      const result = mountUp(gameState, 'invalid');
      assert.strictEqual(result.mounted, false);
    });

    it('fails when mount is exhausted', () => {
      // Drain stamina
      const mountedResult = mountUp(gameState, 'draft_horse');
      let state = mountedResult.state;

      // Set stamina to 0
      state = {
        ...state,
        mounts: {
          ...state.mounts,
          mountStats: {
            ...state.mounts.mountStats,
            draft_horse: {
              ...state.mounts.mountStats.draft_horse,
              currentStamina: 0
            }
          },
          activeMount: null
        }
      };

      const result = mountUp(state, 'draft_horse');
      assert.strictEqual(result.mounted, false);
      assert.ok(result.error.includes('exhausted'));
    });

    it('sets lastMounted timestamp', () => {
      const before = Date.now();
      const result = mountUp(gameState, 'draft_horse');
      assert.ok(result.state.mounts.lastMounted >= before);
    });
  });

  describe('dismount', () => {
    beforeEach(() => {
      const result1 = addMount(gameState, 'draft_horse');
      const result2 = mountUp(result1.state, 'draft_horse');
      gameState = result2.state;
    });

    it('dismounts successfully', () => {
      const result = dismount(gameState);
      assert.ok(result.dismounted);
      assert.strictEqual(result.state.mounts.activeMount, null);
    });

    it('returns ride duration', () => {
      const result = dismount(gameState);
      assert.ok(result.rideDuration >= 0);
    });

    it('fails when not mounted', () => {
      const result1 = dismount(gameState);
      const result2 = dismount(result1.state);
      assert.strictEqual(result2.dismounted, false);
      assert.ok(result2.error);
    });

    it('grants experience based on ride time', () => {
      // Wait a bit to accumulate time
      const result = dismount(gameState);
      assert.ok(result.expGained >= 0);
    });
  });

  describe('calculateSpeedBonus', () => {
    it('calculates base speed bonus', () => {
      const mountData = MOUNTS.draft_horse;
      const stats = { level: 1, bond: 0 };
      const bonus = calculateSpeedBonus(mountData, stats);
      assert.ok(bonus > 1);
    });

    it('increases with level', () => {
      const mountData = MOUNTS.draft_horse;
      const stats1 = { level: 1, bond: 0 };
      const stats2 = { level: 10, bond: 0 };
      const bonus1 = calculateSpeedBonus(mountData, stats1);
      const bonus2 = calculateSpeedBonus(mountData, stats2);
      assert.ok(bonus2 > bonus1);
    });

    it('increases with bond', () => {
      const mountData = MOUNTS.draft_horse;
      const stats1 = { level: 1, bond: 0 };
      const stats2 = { level: 1, bond: 100 };
      const bonus1 = calculateSpeedBonus(mountData, stats1);
      const bonus2 = calculateSpeedBonus(mountData, stats2);
      assert.ok(bonus2 > bonus1);
    });

    it('higher rarity gives higher bonus', () => {
      const common = MOUNTS.draft_horse; // common
      const legendary = MOUNTS.elder_dragon; // legendary
      const stats = { level: 1, bond: 0 };
      const bonus1 = calculateSpeedBonus(common, stats);
      const bonus2 = calculateSpeedBonus(legendary, stats);
      assert.ok(bonus2 > bonus1);
    });
  });

  describe('calculateMountLevel', () => {
    it('starts at level 1', () => {
      assert.strictEqual(calculateMountLevel(0), 1);
    });

    it('level 2 at 100 exp', () => {
      assert.strictEqual(calculateMountLevel(100), 2);
    });

    it('level 3 at 300 exp', () => {
      assert.strictEqual(calculateMountLevel(300), 3);
    });

    it('caps at level 20', () => {
      assert.strictEqual(calculateMountLevel(100000), 20);
    });
  });

  describe('useStamina', () => {
    beforeEach(() => {
      const result1 = addMount(gameState, 'draft_horse');
      const result2 = mountUp(result1.state, 'draft_horse');
      gameState = result2.state;
    });

    it('uses stamina', () => {
      const result = useStamina(gameState, 10);
      assert.ok(result.used);
      // draft_horse has steady_pace which reduces stamina by 20% (10 * 0.8 = 8)
      assert.strictEqual(result.staminaUsed, 8);
    });

    it('updates remaining stamina', () => {
      const initialStamina = gameState.mounts.mountStats.draft_horse.currentStamina;
      const result = useStamina(gameState, 10);
      // draft_horse has steady_pace which reduces stamina by 20%
      assert.strictEqual(result.remaining, initialStamina - 8);
    });

    it('fails when not mounted', () => {
      const dismountResult = dismount(gameState);
      const result = useStamina(dismountResult.state, 10);
      assert.strictEqual(result.used, false);
    });

    it('auto-dismounts when exhausted', () => {
      const result = useStamina(gameState, 1000);
      assert.ok(result.exhausted);
      assert.strictEqual(result.state.mounts.activeMount, null);
    });

    it('applies stamina reduction ability', () => {
      // draft_horse from beforeEach has steady_pace (20% reduction)
      // Using 100 stamina base: 100 * 0.8 = 80 actual stamina used
      const result = useStamina(gameState, 100);
      assert.strictEqual(result.staminaUsed, 80);
    });
  });

  describe('restMount', () => {
    beforeEach(() => {
      const result = addMount(gameState, 'draft_horse');
      gameState = result.state;
    });

    it('restores stamina', () => {
      // First deplete some stamina
      const mountResult = mountUp(gameState, 'draft_horse');
      const useResult = useStamina(mountResult.state, 30);
      const dismountResult = dismount(useResult.state);

      const result = restMount(dismountResult.state, 'draft_horse', 30000);
      assert.ok(result.rested);
      assert.ok(result.staminaRecovered > 0);
    });

    it('fails for unowned mount', () => {
      const result = restMount(gameState, 'gryphon');
      assert.strictEqual(result.rested, false);
    });

    it('fails for invalid mount', () => {
      const result = restMount(gameState, 'invalid');
      assert.strictEqual(result.rested, false);
    });

    it('fails while mounted', () => {
      const mountResult = mountUp(gameState, 'draft_horse');
      const result = restMount(mountResult.state, 'draft_horse');
      assert.strictEqual(result.rested, false);
    });

    it('does not exceed max stamina', () => {
      const result = restMount(gameState, 'draft_horse', 600000);
      assert.ok(result.currentStamina <= result.maxStamina);
    });
  });

  describe('feedMount', () => {
    beforeEach(() => {
      const result = addMount(gameState, 'draft_horse');
      gameState = result.state;
    });

    it('feeds mount successfully', () => {
      const result = feedMount(gameState, 'draft_horse', 'apple');
      assert.ok(result.fed);
      assert.ok(result.effect);
    });

    it('increases happiness', () => {
      const initialHappiness = gameState.mounts.mountStats.draft_horse.happiness;
      const result = feedMount(gameState, 'draft_horse', 'apple');
      assert.ok(result.newStats.happiness >= initialHappiness);
    });

    it('increases bond', () => {
      const result = feedMount(gameState, 'draft_horse', 'apple');
      assert.ok(result.newStats.bond > 0);
    });

    it('restores stamina', () => {
      // Deplete stamina first
      const mountResult = mountUp(gameState, 'draft_horse');
      const useResult = useStamina(mountResult.state, 30);
      const dismountResult = dismount(useResult.state);

      const result = feedMount(dismountResult.state, 'draft_horse', 'carrot');
      assert.ok(result.newStats.currentStamina > dismountResult.state.mounts.mountStats.draft_horse.currentStamina);
    });

    it('fails for invalid feed item', () => {
      const result = feedMount(gameState, 'draft_horse', 'invalid_food');
      assert.strictEqual(result.fed, false);
    });

    it('fails for unowned mount', () => {
      const result = feedMount(gameState, 'gryphon', 'apple');
      assert.strictEqual(result.fed, false);
    });

    it('golden apple gives best effects', () => {
      const appleResult = feedMount(gameState, 'draft_horse', 'apple');
      const goldenResult = feedMount(gameState, 'draft_horse', 'golden_apple');
      assert.ok(goldenResult.effect.happiness > appleResult.effect.happiness);
      assert.ok(goldenResult.effect.bond > appleResult.effect.bond);
    });
  });

  describe('getMountAbilities', () => {
    it('returns abilities for mount', () => {
      const abilities = getMountAbilities('draft_horse');
      assert.ok(abilities.length > 0);
      assert.ok(abilities[0].id);
    });

    it('returns empty array for invalid mount', () => {
      const abilities = getMountAbilities('invalid');
      assert.deepStrictEqual(abilities, []);
    });

    it('legendary mounts have many abilities', () => {
      const abilities = getMountAbilities('elder_dragon');
      assert.ok(abilities.length >= 4);
    });
  });

  describe('canTraverseTerrain', () => {
    it('land mounts can traverse plains', () => {
      assert.ok(canTraverseTerrain('draft_horse', 'plains'));
    });

    it('land mounts cannot traverse water', () => {
      assert.strictEqual(canTraverseTerrain('draft_horse', 'water'), false);
    });

    it('flying mounts can traverse all terrain', () => {
      assert.ok(canTraverseTerrain('gryphon', 'water'));
      assert.ok(canTraverseTerrain('gryphon', 'plains'));
      assert.ok(canTraverseTerrain('gryphon', 'mountain'));
    });

    it('aquatic mounts can traverse water', () => {
      assert.ok(canTraverseTerrain('giant_turtle', 'water'));
    });

    it('returns false for invalid mount', () => {
      assert.strictEqual(canTraverseTerrain('invalid', 'plains'), false);
    });
  });

  describe('getActiveMountInfo', () => {
    it('returns not mounted when no active mount', () => {
      const info = getActiveMountInfo(gameState);
      assert.strictEqual(info.mounted, false);
    });

    it('returns mount info when mounted', () => {
      const result1 = addMount(gameState, 'draft_horse');
      const result2 = mountUp(result1.state, 'draft_horse');
      const info = getActiveMountInfo(result2.state);

      assert.ok(info.mounted);
      assert.strictEqual(info.mountId, 'draft_horse');
      assert.ok(info.mountData);
      assert.ok(info.stats);
      assert.ok(info.abilities);
      assert.ok(info.speedBonus > 1);
    });
  });

  describe('getCollectionStats', () => {
    it('returns empty stats for new state', () => {
      const stats = getCollectionStats(gameState);
      assert.strictEqual(stats.ownedCount, 0);
      assert.strictEqual(stats.completionPercent, 0);
    });

    it('updates owned count', () => {
      const result = addMount(gameState, 'draft_horse');
      const stats = getCollectionStats(result.state);
      assert.strictEqual(stats.ownedCount, 1);
    });

    it('calculates completion percent', () => {
      const result = addMount(gameState, 'draft_horse');
      const stats = getCollectionStats(result.state);
      assert.ok(stats.completionPercent > 0);
    });

    it('has breakdown by rarity', () => {
      const stats = getCollectionStats(gameState);
      assert.ok(stats.byRarity.common);
      assert.ok(stats.byRarity.legendary);
    });

    it('has breakdown by type', () => {
      const stats = getCollectionStats(gameState);
      assert.ok(stats.byType.land);
      assert.ok(stats.byType.flying);
    });
  });

  describe('getOwnedMounts', () => {
    it('returns empty array when none owned', () => {
      const mounts = getOwnedMounts(gameState);
      assert.deepStrictEqual(mounts, []);
    });

    it('returns owned mount details', () => {
      const result = addMount(gameState, 'draft_horse');
      const mounts = getOwnedMounts(result.state);
      assert.strictEqual(mounts.length, 1);
      assert.strictEqual(mounts[0].id, 'draft_horse');
      assert.ok(mounts[0].stats);
      assert.ok(mounts[0].abilities);
    });

    it('marks active mount', () => {
      const result1 = addMount(gameState, 'draft_horse');
      const result2 = mountUp(result1.state, 'draft_horse');
      const mounts = getOwnedMounts(result2.state);
      assert.ok(mounts[0].isActive);
    });
  });

  describe('storeInStable', () => {
    beforeEach(() => {
      const result = addMount(gameState, 'draft_horse');
      gameState = result.state;
    });

    it('stores mount in stable', () => {
      const result = storeInStable(gameState, 'draft_horse', 'stable_1');
      assert.ok(result.stored);
      assert.ok(result.state.mounts.stables.some(s => s.mountId === 'draft_horse'));
    });

    it('fails for unowned mount', () => {
      const result = storeInStable(gameState, 'gryphon', 'stable_1');
      assert.strictEqual(result.stored, false);
    });

    it('fails for active mount', () => {
      const mountResult = mountUp(gameState, 'draft_horse');
      const result = storeInStable(mountResult.state, 'draft_horse', 'stable_1');
      assert.strictEqual(result.stored, false);
    });
  });

  describe('retrieveFromStable', () => {
    beforeEach(() => {
      const result1 = addMount(gameState, 'draft_horse');
      const result2 = storeInStable(result1.state, 'draft_horse', 'stable_1');
      gameState = result2.state;
    });

    it('retrieves mount from stable', () => {
      const result = retrieveFromStable(gameState, 'draft_horse');
      assert.ok(result.retrieved);
      assert.ok(!result.state.mounts.stables.some(s => s.mountId === 'draft_horse'));
    });

    it('fails for mount not in stable', () => {
      const result = retrieveFromStable(gameState, 'gryphon');
      assert.strictEqual(result.retrieved, false);
    });
  });

  describe('recordDistance', () => {
    beforeEach(() => {
      const result1 = addMount(gameState, 'draft_horse');
      const result2 = mountUp(result1.state, 'draft_horse');
      gameState = result2.state;
    });

    it('records distance traveled', () => {
      const result = recordDistance(gameState, 100);
      assert.ok(result.recorded);
      assert.strictEqual(result.totalDistance, 100);
    });

    it('accumulates distance', () => {
      const result1 = recordDistance(gameState, 100);
      const result2 = recordDistance(result1.state, 50);
      assert.strictEqual(result2.totalDistance, 150);
    });

    it('fails when not mounted', () => {
      const dismountResult = dismount(gameState);
      const result = recordDistance(dismountResult.state, 100);
      assert.strictEqual(result.recorded, false);
    });
  });
});
