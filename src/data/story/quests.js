/**
 * Quest definitions for the game
 * Each quest has stages with objectives and rewards
 */

export const QUESTS = {
  // Main story: Clear the caves
  clearCaves: {
    id: 'clearCaves',
    name: 'Shadow in the Caves',
    description: 'The village elder has asked you to clear the dangerous creatures from the northern caves.',
    type: 'main',
    stages: [
      {
        name: 'Investigate the Caves',
        description: 'Travel to the northern caves and assess the threat.',
        objectives: [
          { id: 'reachCave', description: 'Reach the cave entrance', target: 1 },
        ],
      },
      {
        name: 'Clear the Threat',
        description: 'Defeat the shadow beasts lurking within.',
        objectives: [
          { id: 'defeatShadows', description: 'Defeat shadow beasts', target: 5 },
        ],
        rewards: {
          xp: 50,
        },
      },
      {
        name: 'Return to the Elder',
        description: 'Report your success to the village elder.',
        objectives: [
          { id: 'talkToElder', description: 'Speak with the Village Elder', target: 1 },
        ],
      },
    ],
    rewards: {
      xp: 150,
      gold: 200,
      items: ['elderAmulet'],
    },
  },

  // Side quest: Gather herbs
  gatherHerbs: {
    id: 'gatherHerbs',
    name: 'Healing Remedies',
    description: 'The village healer needs medicinal herbs to treat the wounded.',
    type: 'side',
    stages: [
      {
        name: 'Gather Herbs',
        description: 'Find healing herbs in the surrounding wilderness.',
        objectives: [
          { id: 'collectHerbs', description: 'Collect medicinal herbs', target: 3 },
        ],
      },
      {
        name: 'Deliver Herbs',
        description: 'Bring the herbs to the village healer.',
        objectives: [
          { id: 'talkToHealer', description: 'Deliver herbs to the Healer', target: 1 },
        ],
      },
    ],
    rewards: {
      xp: 50,
      gold: 50,
      items: ['healthPotion', 'healthPotion'],
    },
  },

  // Side quest: Lost heirloom
  lostHeirloom: {
    id: 'lostHeirloom',
    name: 'Family Treasure',
    description: 'A villager has lost a precious family heirloom somewhere in the forest.',
    type: 'side',
    prerequisites: {
      requiredLevel: 2,
    },
    stages: [
      {
        name: 'Search the Forest',
        description: 'Look for the lost heirloom in the forest areas.',
        objectives: [
          { id: 'searchAreas', description: 'Search forest clearings', target: 3 },
        ],
      },
      {
        name: 'Recover the Heirloom',
        description: 'The heirloom was taken by forest creatures. Retrieve it.',
        objectives: [
          { id: 'defeatThief', description: 'Defeat the creature holding the heirloom', target: 1 },
        ],
      },
      {
        name: 'Return the Heirloom',
        description: 'Return the precious item to its grateful owner.',
        objectives: [
          { id: 'returnItem', description: 'Return the heirloom', target: 1 },
        ],
      },
    ],
    rewards: {
      xp: 100,
      gold: 100,
    },
  },

  // Tutorial quest
  firstSteps: {
    id: 'firstSteps',
    name: 'First Steps',
    description: 'Learn the basics of exploration and combat.',
    type: 'tutorial',
    stages: [
      {
        name: 'Explore',
        description: 'Get familiar with your surroundings.',
        objectives: [
          { id: 'moveRooms', description: 'Visit different areas', target: 2 },
        ],
        rewards: {
          xp: 10,
        },
      },
      {
        name: 'Combat Training',
        description: 'Test your mettle against a weak enemy.',
        objectives: [
          { id: 'winBattle', description: 'Win a battle', target: 1 },
        ],
      },
    ],
    rewards: {
      xp: 25,
      gold: 25,
      items: ['healthPotion'],
    },
  },
};

/**
 * Gets a quest definition by ID
 */
export function getQuest(questId) {
  return QUESTS[questId] || null;
}

/**
 * Gets all quests of a specific type
 */
export function getQuestsByType(type) {
  return Object.values(QUESTS).filter(q => q.type === type);
}

/**
 * Gets all main story quests
 */
export function getMainQuests() {
  return getQuestsByType('main');
}

/**
 * Gets all side quests
 */
export function getSideQuests() {
  return getQuestsByType('side');
}
