/**
 * Tests for Food Provisions System
 * Created by Claude Opus 4.5 (Villager) on Day 343
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  foodItems,
  getAllFoodItems,
  getFoodByCategory,
  getFoodByRarity,
  calculateFoodValue,
  consumeFood,
  getRandomFood,
  FOOD_CATEGORIES
} from '../src/food-provisions.js';

describe('Food Provisions System', () => {
  describe('FOOD_CATEGORIES', () => {
    it('should have all expected categories', () => {
      assert.ok(FOOD_CATEGORIES.MEAT);
      assert.ok(FOOD_CATEGORIES.VEGETABLE);
      assert.ok(FOOD_CATEGORIES.GRAIN);
      assert.ok(FOOD_CATEGORIES.DAIRY);
      assert.ok(FOOD_CATEGORIES.FRUIT);
      assert.ok(FOOD_CATEGORIES.PREPARED);
    });
  });

  describe('foodItems', () => {
    it('should contain bread', () => {
      assert.ok(foodItems.bread);
      assert.equal(foodItems.bread.name, 'Bread Loaf');
      assert.equal(foodItems.bread.type, 'consumable');
      assert.equal(foodItems.bread.category, FOOD_CATEGORIES.GRAIN);
    });

    it('should contain cheese', () => {
      assert.ok(foodItems.cheese);
      assert.equal(foodItems.cheese.name, 'Aged Cheese');
      assert.ok(foodItems.cheese.effect.buff);
    });

    it('should contain cooked meat', () => {
      assert.ok(foodItems.cookedMeat);
      assert.equal(foodItems.cookedMeat.category, FOOD_CATEGORIES.MEAT);
      assert.equal(foodItems.cookedMeat.effect.heal, 25);
    });

    it('should contain vegetable stew', () => {
      assert.ok(foodItems.vegetableStew);
      assert.equal(foodItems.vegetableStew.rarity, 'Uncommon');
    });

    it('should contain tavern pie', () => {
      assert.ok(foodItems.tavernPie);
      assert.equal(foodItems.tavernPie.rarity, 'Rare');
    });

    it('should contain farm fresh omelet', () => {
      assert.ok(foodItems.farmFreshOmelet);
      assert.equal(foodItems.farmFreshOmelet.category, FOOD_CATEGORIES.PREPARED);
      assert.equal(foodItems.farmFreshOmelet.effect.heal, 28);
    });

    it('should contain spiced scramble', () => {
      assert.ok(foodItems.spicedScramble);
      assert.ok(foodItems.spicedScramble.effect.buff);
      assert.equal(foodItems.spicedScramble.effect.buff.type, 'spd-up');
    });

    it('should contain dragon nest souffle', () => {
      assert.ok(foodItems.dragonNestSouffle);
      assert.equal(foodItems.dragonNestSouffle.rarity, 'Epic');
      assert.equal(foodItems.dragonNestSouffle.effect.heal, 80);
      assert.equal(foodItems.dragonNestSouffle.effect.restoreMP, 40);
    });

    it('should have valid structure for all food items', () => {
      Object.values(foodItems).forEach(food => {
        assert.ok(food.id, `Missing id for food`);
        assert.ok(food.name, `Missing name for ${food.id}`);
        assert.equal(food.type, 'consumable', `${food.id} should be consumable`);
        assert.ok(food.category, `Missing category for ${food.id}`);
        assert.ok(food.rarity, `Missing rarity for ${food.id}`);
        assert.ok(food.description, `Missing description for ${food.id}`);
        assert.ok(food.effect, `Missing effect for ${food.id}`);
        assert.ok(typeof food.value === 'number', `${food.id} should have numeric value`);
      });
    });
  });

  describe('getAllFoodItems', () => {
    it('should return all food items', () => {
      const all = getAllFoodItems();
      assert.ok(Object.keys(all).length > 0);
      assert.ok(all.bread);
      assert.ok(all.cheese);
      assert.ok(all.cookedMeat);
    });

    it('should return a copy not the original', () => {
      const all = getAllFoodItems();
      all.testItem = { id: 'test' };
      assert.ok(!foodItems.testItem);
    });
  });

  describe('getFoodByCategory', () => {
    it('should return meat foods', () => {
      const meats = getFoodByCategory(FOOD_CATEGORIES.MEAT);
      assert.ok(meats.length > 0);
      meats.forEach(food => {
        assert.equal(food.category, FOOD_CATEGORIES.MEAT);
      });
    });

    it('should return prepared foods', () => {
      const prepared = getFoodByCategory(FOOD_CATEGORIES.PREPARED);
      assert.ok(prepared.length > 0);
      prepared.forEach(food => {
        assert.equal(food.category, FOOD_CATEGORIES.PREPARED);
      });
    });

    it('should return grain foods', () => {
      const grains = getFoodByCategory(FOOD_CATEGORIES.GRAIN);
      assert.ok(grains.length > 0);
      assert.ok(grains.some(f => f.id === 'bread'));
    });

    it('should return empty array for unknown category', () => {
      const unknown = getFoodByCategory('unknown');
      assert.deepEqual(unknown, []);
    });
  });

  describe('getFoodByRarity', () => {
    it('should return common foods', () => {
      const common = getFoodByRarity('Common');
      assert.ok(common.length > 0);
      common.forEach(food => {
        assert.equal(food.rarity, 'Common');
      });
    });

    it('should return uncommon foods', () => {
      const uncommon = getFoodByRarity('Uncommon');
      assert.ok(uncommon.length > 0);
      uncommon.forEach(food => {
        assert.equal(food.rarity, 'Uncommon');
      });
    });

    it('should return rare foods', () => {
      const rare = getFoodByRarity('Rare');
      assert.ok(rare.length > 0);
      rare.forEach(food => {
        assert.equal(food.rarity, 'Rare');
      });
    });

    it('should return epic foods', () => {
      const epic = getFoodByRarity('Epic');
      assert.ok(epic.length > 0);
      epic.forEach(food => {
        assert.equal(food.rarity, 'Epic');
      });
    });
  });

  describe('calculateFoodValue', () => {
    it('should calculate value for healing-only food', () => {
      const value = calculateFoodValue({ effect: { heal: 20 } });
      assert.equal(value, 20);
    });

    it('should calculate value for MP-restoring food', () => {
      const value = calculateFoodValue({ effect: { restoreMP: 20 } });
      assert.equal(value, 30); // 20 * 1.5
    });

    it('should calculate value for food with buffs', () => {
      const value = calculateFoodValue({ 
        effect: { heal: 10, buff: { type: 'atk-up', duration: 3 } } 
      });
      assert.equal(value, 25); // 10 + (3 * 5)
    });

    it('should calculate value for complex food', () => {
      const value = calculateFoodValue(foodItems.dragonNestSouffle);
      // 80 heal + 40*1.5 MP + 8*5 buff = 80 + 60 + 40 = 180
      assert.equal(value, 180);
    });

    it('should return 0 for invalid food', () => {
      assert.equal(calculateFoodValue(null), 0);
      assert.equal(calculateFoodValue({}), 0);
      assert.equal(calculateFoodValue({ effect: {} }), 0);
    });
  });

  describe('consumeFood', () => {
    it('should apply healing effect', () => {
      const character = { hp: 50, maxHp: 100 };
      const result = consumeFood(character, 'bread');
      assert.ok(result.success);
      assert.equal(result.effects.hp, 65); // 50 + 15
      assert.ok(result.message.includes('Bread Loaf'));
    });

    it('should not overheal', () => {
      const character = { hp: 95, maxHp: 100 };
      const result = consumeFood(character, 'bread');
      assert.ok(result.success);
      assert.equal(result.effects.hp, 100);
    });

    it('should apply MP restoration', () => {
      const character = { hp: 50, maxHp: 100, mp: 10, maxMp: 50 };
      const result = consumeFood(character, 'goldenHoneyBread');
      assert.ok(result.success);
      assert.equal(result.effects.mp, 30); // 10 + 20
    });

    it('should apply buffs', () => {
      const character = { hp: 50, maxHp: 100 };
      const result = consumeFood(character, 'cheese');
      assert.ok(result.success);
      assert.ok(result.effects.buff);
      assert.equal(result.effects.buff.type, 'def-up');
    });

    it('should handle unknown food', () => {
      const character = { hp: 50, maxHp: 100 };
      const result = consumeFood(character, 'unknownFood');
      assert.ok(!result.success);
      assert.ok(result.message.includes('Unknown food'));
    });

    it('should apply all effects for complex food', () => {
      const character = { hp: 20, maxHp: 150, mp: 10, maxMp: 100 };
      const result = consumeFood(character, 'dragonNestSouffle');
      assert.ok(result.success);
      assert.equal(result.effects.hp, 100); // 20 + 80
      assert.equal(result.effects.mp, 50); // 10 + 40
      assert.ok(result.effects.buff);
    });
  });

  describe('getRandomFood', () => {
    it('should return a random food item', () => {
      const food = getRandomFood();
      assert.ok(food);
      assert.ok(food.id);
      assert.ok(foodItems[food.id]);
    });

    it('should return food of specified rarity', () => {
      const food = getRandomFood('Rare');
      assert.ok(food);
      assert.equal(food.rarity, 'Rare');
    });

    it('should return null for invalid rarity', () => {
      const food = getRandomFood('InvalidRarity');
      assert.equal(food, null);
    });
  });
});
