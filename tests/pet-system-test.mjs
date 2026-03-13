/**
 * Pet System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  PET_SPECIES,
  PET_RARITIES,
  PET_MOODS,
  PET_ACTIVITIES,
  PET_BONUSES,
  initPetState,
  createPet,
  addPetToCollection,
  releasePet,
  setActivePet,
  getActivePet,
  renamePet,
  feedPet,
  playWithPet,
  toggleFavorite,
  getCollectionStats,
  getPetsByFilter,
  getActivePetBonus,
  updatePetSettings,
  tickPetState,
  getAllSpecies,
  getAllRarities,
  getPetDisplayName
} from '../src/pet-system.js';

import {
  renderPetCard,
  renderMiniPet,
  renderPetCollection,
  renderPetDetails,
  renderCollectionStats,
  renderSpeciesFilter,
  renderRarityFilter,
  renderSortOptions,
  renderActivePetBonus,
  renderSummonResult,
  renderRenameDialog,
  renderReleaseConfirmation,
  renderPetManagementPage
} from '../src/pet-system-ui.js';

describe('Pet System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initPetState(state);
    state = result.state;
  });

  describe('PET_SPECIES', () => {
    it('has all species', () => {
      assert.ok(PET_SPECIES.CAT);
      assert.ok(PET_SPECIES.DOG);
      assert.ok(PET_SPECIES.DRAGON);
      assert.ok(PET_SPECIES.UNICORN);
    });

    it('has species properties', () => {
      assert.strictEqual(PET_SPECIES.CAT.id, 'cat');
      assert.strictEqual(PET_SPECIES.CAT.name, 'Cat');
      assert.ok(PET_SPECIES.CAT.icon);
    });
  });

  describe('PET_RARITIES', () => {
    it('has all rarities', () => {
      assert.ok(PET_RARITIES.COMMON);
      assert.ok(PET_RARITIES.UNCOMMON);
      assert.ok(PET_RARITIES.RARE);
      assert.ok(PET_RARITIES.EPIC);
      assert.ok(PET_RARITIES.LEGENDARY);
    });

    it('has rarity properties', () => {
      assert.ok(PET_RARITIES.LEGENDARY.bonusMultiplier > PET_RARITIES.COMMON.bonusMultiplier);
    });
  });

  describe('PET_MOODS', () => {
    it('has all moods', () => {
      assert.ok(PET_MOODS.JOYFUL);
      assert.ok(PET_MOODS.HAPPY);
      assert.ok(PET_MOODS.CONTENT);
      assert.ok(PET_MOODS.SAD);
      assert.ok(PET_MOODS.ANGRY);
    });
  });

  describe('initPetState', () => {
    it('creates initial state', () => {
      assert.ok(state.pets);
      assert.ok(Array.isArray(state.pets.collection));
      assert.strictEqual(state.pets.activePet, null);
      assert.ok(Array.isArray(state.pets.favorites));
    });

    it('initializes stats', () => {
      assert.strictEqual(state.pets.stats.totalCollected, 0);
      assert.strictEqual(state.pets.stats.totalReleased, 0);
    });
  });

  describe('createPet', () => {
    it('creates a pet', () => {
      const result = createPet('cat');
      assert.ok(result.success);
      assert.ok(result.pet);
      assert.strictEqual(result.pet.species, 'cat');
    });

    it('creates pet with rarity override', () => {
      const result = createPet('cat', 'legendary');
      assert.ok(result.success);
      assert.strictEqual(result.pet.rarity, 'legendary');
    });

    it('fails for invalid species', () => {
      const result = createPet('invalid');
      assert.ok(!result.success);
    });

    it('assigns primary bonus', () => {
      const result = createPet('dog');
      assert.ok(result.pet.primaryBonus);
      assert.ok(result.pet.primaryBonus.type);
      assert.ok(result.pet.primaryBonus.value > 0);
    });
  });

  describe('addPetToCollection', () => {
    it('adds pet to collection', () => {
      const pet = createPet('cat').pet;
      const result = addPetToCollection(state, pet);
      assert.ok(result.success);
      assert.strictEqual(result.state.pets.collection.length, 1);
    });

    it('increments stats', () => {
      const pet = createPet('cat').pet;
      const result = addPetToCollection(state, pet);
      assert.strictEqual(result.state.pets.stats.totalCollected, 1);
    });

    it('fails for duplicate pet', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = addPetToCollection(state, pet);
      assert.ok(!result.success);
    });

    it('fails for invalid pet', () => {
      const result = addPetToCollection(state, null);
      assert.ok(!result.success);
    });
  });

  describe('releasePet', () => {
    it('removes pet from collection', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = releasePet(state, pet.id);
      assert.ok(result.success);
      assert.strictEqual(result.state.pets.collection.length, 0);
    });

    it('clears active pet if released', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      state = setActivePet(state, pet.id).state;
      const result = releasePet(state, pet.id);
      assert.strictEqual(result.state.pets.activePet, null);
    });

    it('fails for non-existent pet', () => {
      const result = releasePet(state, 'invalid');
      assert.ok(!result.success);
    });
  });

  describe('setActivePet', () => {
    it('sets active pet', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = setActivePet(state, pet.id);
      assert.ok(result.success);
      assert.strictEqual(result.state.pets.activePet, pet.id);
    });

    it('clears active pet with null', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      state = setActivePet(state, pet.id).state;
      const result = setActivePet(state, null);
      assert.ok(result.success);
      assert.strictEqual(result.state.pets.activePet, null);
    });

    it('fails for non-existent pet', () => {
      const result = setActivePet(state, 'invalid');
      assert.ok(!result.success);
    });
  });

  describe('getActivePet', () => {
    it('returns active pet', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      state = setActivePet(state, pet.id).state;
      const result = getActivePet(state);
      assert.ok(result.found);
      assert.strictEqual(result.pet.id, pet.id);
    });

    it('returns not found when no active', () => {
      const result = getActivePet(state);
      assert.ok(!result.found);
    });
  });

  describe('renamePet', () => {
    it('renames pet', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = renamePet(state, pet.id, 'Fluffy');
      assert.ok(result.success);
      assert.strictEqual(result.pet.nickname, 'Fluffy');
    });

    it('fails for empty name', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = renamePet(state, pet.id, '');
      assert.ok(!result.success);
    });

    it('fails for long name', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = renamePet(state, pet.id, 'A'.repeat(21));
      assert.ok(!result.success);
    });
  });

  describe('feedPet', () => {
    it('feeds pet', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      // Make pet hungry first
      state.pets.collection[0].hunger = 50;
      const result = feedPet(state, pet.id, 20);
      assert.ok(result.success);
      assert.ok(result.pet.hunger < 50);
    });

    it('grants experience', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = feedPet(state, pet.id, 20);
      assert.ok(result.expGained > 0);
    });

    it('increments treat stats', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = feedPet(state, pet.id, 10);
      assert.strictEqual(result.state.pets.stats.totalTreatsGiven, 1);
    });
  });

  describe('playWithPet', () => {
    it('plays with pet', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = playWithPet(state, pet.id);
      assert.ok(result.success);
      assert.ok(result.expGained > 0);
    });

    it('increases happiness', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      state.pets.collection[0].happiness = 50;
      const result = playWithPet(state, pet.id);
      assert.ok(result.pet.happiness > 50);
    });

    it('increases hunger', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      state.pets.collection[0].hunger = 0;
      const result = playWithPet(state, pet.id);
      assert.ok(result.pet.hunger > 0);
    });
  });

  describe('toggleFavorite', () => {
    it('adds to favorites', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      const result = toggleFavorite(state, pet.id);
      assert.ok(result.success);
      assert.ok(result.isFavorite);
      assert.ok(result.state.pets.favorites.includes(pet.id));
    });

    it('removes from favorites', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      state = toggleFavorite(state, pet.id).state;
      const result = toggleFavorite(state, pet.id);
      assert.ok(!result.isFavorite);
      assert.ok(!result.state.pets.favorites.includes(pet.id));
    });
  });

  describe('getCollectionStats', () => {
    it('returns stats', () => {
      const pet1 = createPet('cat').pet;
      const pet2 = createPet('dog').pet;
      state = addPetToCollection(state, pet1).state;
      state = addPetToCollection(state, pet2).state;
      const stats = getCollectionStats(state);
      assert.strictEqual(stats.totalPets, 2);
    });

    it('tracks by rarity', () => {
      const pet = createPet('cat', 'rare').pet;
      state = addPetToCollection(state, pet).state;
      const stats = getCollectionStats(state);
      assert.strictEqual(stats.byRarity.rare, 1);
    });
  });

  describe('getPetsByFilter', () => {
    beforeEach(() => {
      const cat = createPet('cat', 'common').pet;
      const dog = createPet('dog', 'rare').pet;
      state = addPetToCollection(state, cat).state;
      state = addPetToCollection(state, dog).state;
    });

    it('filters by species', () => {
      const result = getPetsByFilter(state, { species: 'cat' });
      assert.strictEqual(result.count, 1);
    });

    it('filters by rarity', () => {
      const result = getPetsByFilter(state, { rarity: 'rare' });
      assert.strictEqual(result.count, 1);
    });

    it('filters favorites only', () => {
      const petId = state.pets.collection[0].id;
      state = toggleFavorite(state, petId).state;
      const result = getPetsByFilter(state, { favoritesOnly: true });
      assert.strictEqual(result.count, 1);
    });

    it('sorts by level', () => {
      state.pets.collection[0].level = 5;
      state.pets.collection[1].level = 10;
      const result = getPetsByFilter(state, { sortBy: 'level' });
      assert.strictEqual(result.pets[0].level, 10);
    });
  });

  describe('getActivePetBonus', () => {
    it('returns no bonus when no active pet', () => {
      const result = getActivePetBonus(state);
      assert.ok(!result.hasBonus);
    });

    it('returns bonus for active pet', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      state = setActivePet(state, pet.id).state;
      const result = getActivePetBonus(state);
      assert.ok(result.hasBonus);
      assert.ok(Object.keys(result.bonuses).length > 0);
    });
  });

  describe('updatePetSettings', () => {
    it('updates showPet', () => {
      const result = updatePetSettings(state, { showPet: false });
      assert.strictEqual(result.state.pets.settings.showPet, false);
    });

    it('clamps petScale', () => {
      const result = updatePetSettings(state, { petScale: 10 });
      assert.strictEqual(result.state.pets.settings.petScale, 2.0);
    });
  });

  describe('tickPetState', () => {
    it('increases hunger over time', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      state.pets.collection[0].hunger = 0;
      const result = tickPetState(state, 10);
      assert.ok(result.state.pets.collection[0].hunger > 0);
    });

    it('decreases happiness over time', () => {
      const pet = createPet('cat').pet;
      state = addPetToCollection(state, pet).state;
      state.pets.collection[0].happiness = 100;
      const result = tickPetState(state, 10);
      assert.ok(result.state.pets.collection[0].happiness < 100);
    });
  });

  describe('getAllSpecies', () => {
    it('returns all species', () => {
      const species = getAllSpecies();
      assert.ok(species.length > 0);
      assert.ok(species.find(s => s.id === 'cat'));
    });
  });

  describe('getAllRarities', () => {
    it('returns all rarities', () => {
      const rarities = getAllRarities();
      assert.ok(rarities.length > 0);
      assert.ok(rarities.find(r => r.id === 'legendary'));
    });
  });

  describe('getPetDisplayName', () => {
    it('returns nickname if set', () => {
      const pet = createPet('cat').pet;
      pet.nickname = 'Fluffy';
      assert.strictEqual(getPetDisplayName(pet), 'Fluffy');
    });

    it('returns species name if no nickname', () => {
      const pet = createPet('cat').pet;
      assert.strictEqual(getPetDisplayName(pet), 'Cat');
    });
  });
});

describe('Pet System UI', () => {
  let state;

  beforeEach(() => {
    state = initPetState({}).state;
    const cat = createPet('cat', 'rare').pet;
    const dog = createPet('dog').pet;
    state = addPetToCollection(state, cat).state;
    state = addPetToCollection(state, dog).state;
    state = setActivePet(state, cat.id).state;
  });

  describe('renderPetCard', () => {
    it('renders pet card', () => {
      const pet = state.pets.collection[0];
      const html = renderPetCard(pet);
      assert.ok(html.includes('pet-card'));
      assert.ok(html.includes(pet.icon));
    });

    it('shows active state', () => {
      const pet = state.pets.collection[0];
      const html = renderPetCard(pet, { isActive: true });
      assert.ok(html.includes('active'));
    });

    it('shows favorite star', () => {
      const pet = state.pets.collection[0];
      const html = renderPetCard(pet, { isFavorite: true });
      assert.ok(html.includes('favorite-star'));
    });
  });

  describe('renderMiniPet', () => {
    it('renders active pet', () => {
      const html = renderMiniPet(state);
      assert.ok(html.includes('mini-pet'));
      assert.ok(!html.includes('empty'));
    });

    it('shows empty state', () => {
      state = setActivePet(state, null).state;
      const html = renderMiniPet(state);
      assert.ok(html.includes('No pet active'));
    });
  });

  describe('renderPetCollection', () => {
    it('renders collection', () => {
      const html = renderPetCollection(state);
      assert.ok(html.includes('pet-collection'));
      assert.ok(html.includes('pet-grid'));
    });

    it('shows count', () => {
      const html = renderPetCollection(state);
      assert.ok(html.includes('2 pets'));
    });

    it('shows empty state', () => {
      const emptyState = initPetState({}).state;
      const html = renderPetCollection(emptyState);
      assert.ok(html.includes('No pets found'));
    });
  });

  describe('renderPetDetails', () => {
    it('renders details', () => {
      const pet = state.pets.collection[0];
      const html = renderPetDetails(pet, state);
      assert.ok(html.includes('pet-details'));
      assert.ok(html.includes('Level'));
    });

    it('shows actions', () => {
      const pet = state.pets.collection[0];
      const html = renderPetDetails(pet, state);
      assert.ok(html.includes('Feed'));
      assert.ok(html.includes('Play'));
    });

    it('shows empty state', () => {
      const html = renderPetDetails(null, state);
      assert.ok(html.includes('Select a pet'));
    });
  });

  describe('renderCollectionStats', () => {
    it('renders stats', () => {
      const html = renderCollectionStats(state);
      assert.ok(html.includes('Collection Statistics'));
      assert.ok(html.includes('Total Pets'));
    });

    it('shows rarity breakdown', () => {
      const html = renderCollectionStats(state);
      assert.ok(html.includes('Rarity'));
      assert.ok(html.includes('Rare'));
    });
  });

  describe('renderSpeciesFilter', () => {
    it('renders species options', () => {
      const html = renderSpeciesFilter();
      assert.ok(html.includes('species-filter'));
      assert.ok(html.includes('Cat'));
      assert.ok(html.includes('Dog'));
    });

    it('marks selected species', () => {
      const html = renderSpeciesFilter('cat');
      assert.ok(html.includes('data-species="cat"'));
    });
  });

  describe('renderRarityFilter', () => {
    it('renders rarity options', () => {
      const html = renderRarityFilter();
      assert.ok(html.includes('rarity-filter'));
      assert.ok(html.includes('Common'));
      assert.ok(html.includes('Legendary'));
    });
  });

  describe('renderSortOptions', () => {
    it('renders sort options', () => {
      const html = renderSortOptions();
      assert.ok(html.includes('sort-options'));
      assert.ok(html.includes('Newest'));
      assert.ok(html.includes('Level'));
    });
  });

  describe('renderActivePetBonus', () => {
    it('renders active bonus', () => {
      const html = renderActivePetBonus(state);
      assert.ok(html.includes('active-pet-bonus'));
      assert.ok(!html.includes('empty'));
    });

    it('shows empty when no active', () => {
      state = setActivePet(state, null).state;
      const html = renderActivePetBonus(state);
      assert.ok(html.includes('No active pet'));
    });
  });

  describe('renderSummonResult', () => {
    it('renders summon result', () => {
      const pet = state.pets.collection[0];
      const html = renderSummonResult(pet);
      assert.ok(html.includes('summon-result'));
      assert.ok(html.includes('Add to Collection'));
    });
  });

  describe('renderRenameDialog', () => {
    it('renders rename dialog', () => {
      const pet = state.pets.collection[0];
      const html = renderRenameDialog(pet);
      assert.ok(html.includes('rename-dialog'));
      assert.ok(html.includes('Rename'));
    });
  });

  describe('renderReleaseConfirmation', () => {
    it('renders release confirmation', () => {
      const pet = state.pets.collection[0];
      const html = renderReleaseConfirmation(pet);
      assert.ok(html.includes('release-dialog'));
      assert.ok(html.includes('cannot be undone'));
    });
  });

  describe('renderPetManagementPage', () => {
    it('renders full page', () => {
      const html = renderPetManagementPage(state);
      assert.ok(html.includes('pet-management-page'));
      assert.ok(html.includes('Pet Collection'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes pet names', () => {
      const pet = createPet('cat').pet;
      pet.nickname = '<script>alert("xss")</script>';
      state = addPetToCollection(state, pet).state;
      const html = renderPetCard(pet);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
