/**
 * NPC Data - Sample NPCs for the RPG
 * Part of Story/Dialog Module
 */

const NPCS = {
  // Quest Givers
  village_elder: {
    id: 'village_elder',
    name: 'Village Elder Aldric',
    type: 'QUEST_GIVER',
    location: 'village_square',
    sprite: 'elder',
    dialog: 'elder_intro',
    quests: ['main_quest_1'],
    schedule: {
      default: 'village_square',
      night: 'elder_house'
    },
    personality: {
      friendliness: 0.9,
      formality: 0.8,
      patience: 0.95
    }
  },

  healer_sera: {
    id: 'healer_sera',
    name: 'Healer Sera',
    type: 'QUEST_GIVER',
    location: 'healer_hut',
    sprite: 'healer',
    dialog: 'healer_intro',
    quests: ['side_herb_gathering'],
    canHeal: true,
    healCost: 5,
    personality: {
      friendliness: 0.95,
      formality: 0.3,
      patience: 0.85
    }
  },

  guard_captain_rolf: {
    id: 'guard_captain_rolf',
    name: 'Guard Captain Rolf',
    type: 'QUEST_GIVER',
    location: 'barracks',
    sprite: 'captain',
    dialog: 'captain_intro',
    quests: ['daily_training', 'side_cave_clearing'],
    personality: {
      friendliness: 0.5,
      formality: 0.9,
      patience: 0.4
    }
  },

  // Merchants
  blacksmith_tormund: {
    id: 'blacksmith_tormund',
    name: 'Tormund the Smith',
    type: 'MERCHANT',
    location: 'blacksmith_shop',
    sprite: 'blacksmith',
    dialog: 'blacksmith_shop',
    shopInventory: {
      weapons: ['iron_sword', 'steel_sword', 'iron_axe', 'steel_dagger'],
      armor: ['leather_armor', 'chainmail'],
      misc: ['whetstones']
    },
    buyMultiplier: 0.5,
    sellMultiplier: 1.0,
    personality: {
      friendliness: 0.7,
      formality: 0.4,
      patience: 0.6
    }
  },

  merchant_varro: {
    id: 'merchant_varro',
    name: 'Merchant Varro',
    type: 'MERCHANT',
    location: 'rusty_anchor_inn',
    sprite: 'merchant',
    dialog: 'varro_intro',
    shopInventory: {
      consumables: ['health_potion', 'mana_potion', 'antidote'],
      misc: ['torch', 'rope', 'camping_kit']
    },
    buyMultiplier: 0.4,
    sellMultiplier: 1.2,
    quests: ['side_escort_merchant'],
    personality: {
      friendliness: 0.8,
      formality: 0.5,
      patience: 0.7
    }
  },

  alchemist_pim: {
    id: 'alchemist_pim',
    name: 'Alchemist Pim',
    type: 'MERCHANT',
    location: 'alchemy_shop',
    sprite: 'alchemist',
    dialog: 'alchemist_intro',
    shopInventory: {
      potions: ['health_potion', 'mana_potion', 'strength_elixir', 'defense_tonic'],
      ingredients: ['moonpetal', 'silverleaf', 'fire_moss', 'crystal_dust']
    },
    canCraft: true,
    recipes: ['health_potion', 'mana_potion', 'antidote'],
    personality: {
      friendliness: 0.6,
      formality: 0.2,
      patience: 0.9
    }
  },

  // Innkeepers
  innkeeper_mira: {
    id: 'innkeeper_mira',
    name: 'Mira the Innkeeper',
    type: 'INNKEEPER',
    location: 'rusty_anchor_inn',
    sprite: 'innkeeper',
    dialog: 'innkeeper_welcome',
    services: {
      rest: { cost: 20, restoreHP: true, restoreMP: true },
      meal: { cost: 10, restoreHP: 25 },
      drink: { cost: 5, effect: 'slight_buff' }
    },
    rumors: ['goblin_rumor', 'mine_rumor', 'stranger_rumor'],
    personality: {
      friendliness: 0.85,
      formality: 0.3,
      patience: 0.75
    }
  },

  // Guards
  gate_guard: {
    id: 'gate_guard',
    name: 'Village Guard',
    type: 'GUARD',
    location: 'village_gate',
    sprite: 'guard',
    dialog: 'guard_checkpoint',
    patrol: ['village_gate', 'main_road'],
    personality: {
      friendliness: 0.4,
      formality: 0.85,
      patience: 0.3
    }
  },

  patrol_guard: {
    id: 'patrol_guard',
    name: 'Patrol Guard Marcus',
    type: 'GUARD',
    location: 'village_square',
    sprite: 'guard',
    dialog: 'guard_patrol',
    patrol: ['village_square', 'market', 'blacksmith_shop', 'village_square'],
    schedule: {
      day: 'patrol',
      night: 'barracks'
    },
    personality: {
      friendliness: 0.55,
      formality: 0.7,
      patience: 0.5
    }
  },

  // Villagers (ambient NPCs)
  farmer_grenn: {
    id: 'farmer_grenn',
    name: 'Farmer Grenn',
    type: 'VILLAGER',
    location: 'farm_north',
    sprite: 'farmer_male',
    dialog: 'farmer_grenn_dialog',
    questRelevant: ['main_quest_1'],
    schedule: {
      morning: 'farm_north',
      day: 'fields',
      evening: 'rusty_anchor_inn',
      night: 'farm_north'
    },
    personality: {
      friendliness: 0.65,
      formality: 0.2,
      patience: 0.6
    }
  },

  farmer_milda: {
    id: 'farmer_milda',
    name: 'Farmer Milda',
    type: 'VILLAGER',
    location: 'farm_south',
    sprite: 'farmer_female',
    dialog: 'farmer_milda_dialog',
    questRelevant: ['main_quest_1'],
    personality: {
      friendliness: 0.75,
      formality: 0.15,
      patience: 0.8
    }
  },

  child_tommy: {
    id: 'child_tommy',
    name: 'Tommy',
    type: 'VILLAGER',
    location: 'village_square',
    sprite: 'child_male',
    dialog: 'child_ambient',
    wanders: true,
    wanderArea: ['village_square', 'market', 'well'],
    personality: {
      friendliness: 0.9,
      formality: 0.0,
      patience: 0.2
    }
  },

  // Trainers
  combat_trainer: {
    id: 'combat_trainer',
    name: 'Veteran Kara',
    type: 'TRAINER',
    location: 'training_grounds',
    sprite: 'warrior_female',
    dialog: 'trainer_combat',
    skills: {
      'power_strike': { cost: 100, requirement: { level: 3 } },
      'shield_bash': { cost: 150, requirement: { level: 5 } },
      'battle_cry': { cost: 200, requirement: { level: 7 } }
    },
    personality: {
      friendliness: 0.5,
      formality: 0.6,
      patience: 0.55
    }
  },

  magic_trainer: {
    id: 'magic_trainer',
    name: 'Mage Elindra',
    type: 'TRAINER',
    location: 'mage_tower',
    sprite: 'mage_female',
    dialog: 'trainer_magic',
    skills: {
      'fireball': { cost: 150, requirement: { level: 4, intelligence: 10 } },
      'ice_shard': { cost: 150, requirement: { level: 4, intelligence: 10 } },
      'heal': { cost: 200, requirement: { level: 5, wisdom: 12 } }
    },
    personality: {
      friendliness: 0.6,
      formality: 0.75,
      patience: 0.8
    }
  },

  // Companions (can join party)
  companion_fenris: {
    id: 'companion_fenris',
    name: 'Fenris',
    type: 'COMPANION',
    location: 'rusty_anchor_inn',
    sprite: 'warrior_male',
    dialog: 'fenris_intro',
    canRecruit: true,
    recruitConditions: {
      quest: 'main_quest_1',
      stage: 'defeat_goblins'
    },
    stats: {
      class: 'Warrior',
      level: 2,
      hp: 45,
      mp: 10,
      attack: 12,
      defense: 10,
      speed: 8
    },
    skills: ['power_strike', 'taunt'],
    personality: {
      friendliness: 0.4,
      formality: 0.3,
      patience: 0.35
    },
    backstory: 'A former soldier haunted by his past, seeking redemption through battle.'
  },

  companion_lyra: {
    id: 'companion_lyra',
    name: 'Lyra',
    type: 'COMPANION',
    location: 'mage_tower',
    sprite: 'mage_female',
    dialog: 'lyra_intro',
    canRecruit: true,
    recruitConditions: {
      quest: 'side_cave_clearing',
      complete: true
    },
    stats: {
      class: 'Mage',
      level: 3,
      hp: 30,
      mp: 50,
      attack: 6,
      defense: 5,
      speed: 10,
      intelligence: 14
    },
    skills: ['fireball', 'ice_shard', 'heal'],
    personality: {
      friendliness: 0.7,
      formality: 0.6,
      patience: 0.65
    },
    backstory: 'A young mage eager to prove herself beyond the confines of the tower.'
  },

  // Boss NPCs
  goblin_chief: {
    id: 'goblin_chief',
    name: 'Grix the Goblin Chief',
    type: 'BOSS',
    location: 'goblin_camp',
    sprite: 'goblin_chief',
    dialog: 'goblin_chief_encounter',
    isBoss: true,
    stats: {
      level: 5,
      hp: 150,
      mp: 20,
      attack: 18,
      defense: 12,
      speed: 14
    },
    drops: {
      guaranteed: ['goblin_chief_key'],
      random: [
        { item: 'gold', min: 30, max: 50, chance: 1.0 },
        { item: 'rusty_crown', chance: 0.3 }
      ]
    },
    questRelevant: ['main_quest_1']
  }
};

// NPC type definitions for reference
const NPC_TYPES = {
  QUEST_GIVER: 'Gives and tracks quests',
  MERCHANT: 'Buys and sells items',
  TRAINER: 'Teaches skills for gold',
  INNKEEPER: 'Provides rest and meals',
  GUARD: 'Patrols and provides security',
  VILLAGER: 'Ambient NPC with dialog',
  COMPANION: 'Can join player party',
  BOSS: 'Major enemy encounter'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NPCS, NPC_TYPES };
}
