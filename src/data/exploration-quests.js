/**
 * Exploration Quests - Map-aligned quests for world exploration
 * Uses actual map room IDs: nw, n, ne, w, center, e, sw, s, se
 * Part of Story/Dialog Module expansion
 */

const EXPLORATION_QUESTS = {
  // Village Exploration Tutorial
  explore_village: {
    id: 'explore_village',
    name: 'Know Your Surroundings',
    description: 'The Village Elder suggests you familiarize yourself with the area before venturing far.',
    type: 'SIDE',
    level: 1,
    stages: [
      {
        id: 'explore_center',
        name: 'Visit the Village Square',
        description: 'Start by exploring the village center.',
        objectives: [
          {
            id: 'visit_center',
            type: 'EXPLORE',
            description: 'Explore Village Square',
            locationId: 'center',
            required: true
          }
        ],
        nextStage: 'explore_paths'
      },
      {
        id: 'explore_paths',
        name: 'Scout the Paths',
        description: 'Check the roads leading out of the village.',
        objectives: [
          {
            id: 'visit_north',
            type: 'EXPLORE',
            description: 'Visit the Northern Path',
            locationId: 'n',
            required: true
          },
          {
            id: 'visit_south',
            type: 'EXPLORE',
            description: 'Visit the Southern Road',
            locationId: 's',
            required: true
          }
        ],
        nextStage: null
      }
    ],
    rewards: {
      experience: 25,
      gold: 10,
      items: []
    },
    prerequisites: []
  },

  // Marsh Mystery Quest
  marsh_mystery: {
    id: 'marsh_mystery',
    name: 'Whispers in the Marsh',
    description: 'Strange lights have been seen in the Southwest Marsh. Investigate the phenomenon.',
    type: 'SIDE',
    level: 2,
    stages: [
      {
        id: 'reach_marsh',
        name: 'Enter the Marsh',
        description: 'Travel to the Southwest Marsh to investigate.',
        objectives: [
          {
            id: 'explore_sw',
            type: 'EXPLORE',
            description: 'Reach the Southwest Marsh',
            locationId: 'sw',
            required: true
          }
        ],
        nextStage: 'investigate_lights'
      },
      {
        id: 'investigate_lights',
        name: 'Find the Source',
        description: 'Search for what is causing the mysterious lights.',
        objectives: [
          {
            id: 'defeat_wisps',
            type: 'KILL',
            description: 'Defeat Will-o-Wisps',
            enemyType: 'wisp',
            count: 3,
            current: 0,
            required: true
          }
        ],
        nextStage: null
      }
    ],
    rewards: {
      experience: 50,
      gold: 25,
      items: ['lantern_of_truth']
    },
    prerequisites: ['explore_village']
  },

  // Grove Guardian Quest
  grove_guardian: {
    id: 'grove_guardian',
    name: 'The Guardian of the Grove',
    description: 'An ancient spirit guards the Northwest Grove. Seek its wisdom.',
    type: 'SIDE',
    level: 3,
    stages: [
      {
        id: 'find_grove',
        name: 'Journey to the Grove',
        description: 'Travel northwest to find the sacred grove.',
        objectives: [
          {
            id: 'explore_nw',
            type: 'EXPLORE',
            description: 'Reach the Northwest Grove',
            locationId: 'nw',
            required: true
          }
        ],
        nextStage: 'meet_guardian'
      },
      {
        id: 'meet_guardian',
        name: 'Commune with the Guardian',
        description: 'The guardian tests all who seek its wisdom.',
        objectives: [
          {
            id: 'talk_guardian',
            type: 'TALK',
            description: 'Speak with the Grove Guardian',
            npcId: 'grove_guardian_spirit',
            required: true
          },
          {
            id: 'offering',
            type: 'DELIVER',
            description: 'Offer a forest herb',
            itemId: 'forest_herb',
            targetNpcId: 'grove_guardian_spirit',
            count: 1,
            required: true
          }
        ],
        nextStage: null
      }
    ],
    rewards: {
      experience: 75,
      gold: 0,
      items: ['blessing_of_nature']
    },
    prerequisites: []
  },

  // Ridge Expedition Quest
  ridge_expedition: {
    id: 'ridge_expedition',
    name: 'The Northeast Ridge',
    description: 'Scouts report bandits using the Northeast Ridge as a lookout. Clear them out.',
    type: 'MAIN',
    level: 3,
    stages: [
      {
        id: 'scout_ridge',
        name: 'Scout the Ridge',
        description: 'Carefully approach the Northeast Ridge.',
        objectives: [
          {
            id: 'explore_ne',
            type: 'EXPLORE',
            description: 'Reach the Northeast Ridge',
            locationId: 'ne',
            required: true
          }
        ],
        nextStage: 'clear_bandits'
      },
      {
        id: 'clear_bandits',
        name: 'Clear the Bandits',
        description: 'Defeat the bandit scouts and their leader.',
        objectives: [
          {
            id: 'kill_bandits',
            type: 'KILL',
            description: 'Defeat bandit scouts',
            enemyType: 'bandit_scout',
            count: 4,
            current: 0,
            required: true
          },
          {
            id: 'kill_leader',
            type: 'KILL',
            description: 'Defeat the Bandit Lookout',
            enemyType: 'bandit_lookout',
            count: 1,
            current: 0,
            required: true
          }
        ],
        nextStage: null
      }
    ],
    rewards: {
      experience: 100,
      gold: 75,
      items: ['scouts_cloak']
    },
    prerequisites: ['explore_village']
  },

  // Dock Investigation Quest
  dock_investigation: {
    id: 'dock_investigation',
    name: 'Trouble at the Docks',
    description: 'Smugglers have been spotted at the Southeast Dock. Investigate their activities.',
    type: 'SIDE',
    level: 4,
    stages: [
      {
        id: 'reach_dock',
        name: 'Travel to the Docks',
        description: 'Head southeast to the docks.',
        objectives: [
          {
            id: 'explore_se',
            type: 'EXPLORE',
            description: 'Reach the Southeast Dock',
            locationId: 'se',
            required: true
          }
        ],
        nextStage: 'gather_evidence'
      },
      {
        id: 'gather_evidence',
        name: 'Gather Evidence',
        description: 'Find proof of smuggling activity.',
        objectives: [
          {
            id: 'collect_manifest',
            type: 'COLLECT',
            description: 'Find smuggler manifest',
            itemId: 'smuggler_manifest',
            count: 1,
            current: 0,
            required: true
          },
          {
            id: 'talk_dockworker',
            type: 'TALK',
            description: 'Question the nervous dockworker',
            npcId: 'nervous_dockworker',
            required: false
          }
        ],
        nextStage: 'confront_smugglers'
      },
      {
        id: 'confront_smugglers',
        name: 'Confront the Smugglers',
        description: 'Catch the smugglers in the act.',
        objectives: [
          {
            id: 'defeat_smugglers',
            type: 'KILL',
            description: 'Defeat smugglers',
            enemyType: 'smuggler',
            count: 3,
            current: 0,
            required: true
          }
        ],
        nextStage: null
      }
    ],
    rewards: {
      experience: 125,
      gold: 100,
      items: ['contraband_blade']
    },
    prerequisites: ['explore_village']
  },

  // World Tour Achievement Quest
  world_tour: {
    id: 'world_tour',
    name: 'Explorer Extraordinaire',
    description: 'Visit every region in the known world.',
    type: 'ACHIEVEMENT',
    level: 1,
    stages: [
      {
        id: 'visit_all',
        name: 'Complete World Tour',
        description: 'Explore all nine regions of the world.',
        objectives: [
          {
            id: 'visit_nw',
            type: 'EXPLORE',
            description: 'Visit Northwest Grove',
            locationId: 'nw',
            required: true
          },
          {
            id: 'visit_n',
            type: 'EXPLORE',
            description: 'Visit Northern Path',
            locationId: 'n',
            required: true
          },
          {
            id: 'visit_ne',
            type: 'EXPLORE',
            description: 'Visit Northeast Ridge',
            locationId: 'ne',
            required: true
          },
          {
            id: 'visit_w',
            type: 'EXPLORE',
            description: 'Visit Western Crossing',
            locationId: 'w',
            required: true
          },
          {
            id: 'visit_center',
            type: 'EXPLORE',
            description: 'Visit Village Square',
            locationId: 'center',
            required: true
          },
          {
            id: 'visit_e',
            type: 'EXPLORE',
            description: 'Visit Eastern Fields',
            locationId: 'e',
            required: true
          },
          {
            id: 'visit_sw',
            type: 'EXPLORE',
            description: 'Visit Southwest Marsh',
            locationId: 'sw',
            required: true
          },
          {
            id: 'visit_s',
            type: 'EXPLORE',
            description: 'Visit Southern Road',
            locationId: 's',
            required: true
          },
          {
            id: 'visit_se',
            type: 'EXPLORE',
            description: 'Visit Southeast Dock',
            locationId: 'se',
            required: true
          }
        ],
        nextStage: null
      }
    ],
    rewards: {
      experience: 200,
      gold: 50,
      items: ['explorers_badge']
    },
    prerequisites: []
  }
};

// Helper to get all exploration quests
function getExplorationQuests() {
  return { ...EXPLORATION_QUESTS };
}

// Get quest by ID
function getExplorationQuest(questId) {
  return EXPLORATION_QUESTS[questId] || null;
}

// Get quests that can start in a specific room
function getQuestsForRoom(roomId) {
  const quests = [];
  for (const [id, quest] of Object.entries(EXPLORATION_QUESTS)) {
    const firstStage = quest.stages[0];
    if (firstStage && firstStage.objectives) {
      const startsHere = firstStage.objectives.some(
        obj => obj.type === 'EXPLORE' && obj.locationId === roomId
      );
      if (startsHere) {
        quests.push(quest);
      }
    }
  }
  return quests;
}

// Get all rooms mentioned in exploration objectives across all quests
function getQuestLocations() {
  const locations = new Set();
  for (const quest of Object.values(EXPLORATION_QUESTS)) {
    for (const stage of quest.stages) {
      for (const obj of stage.objectives || []) {
        if (obj.type === 'EXPLORE' && obj.locationId) {
          locations.add(obj.locationId);
        }
      }
    }
  }
  return Array.from(locations);
}

export {
  EXPLORATION_QUESTS,
  getExplorationQuests,
  getExplorationQuest,
  getQuestsForRoom,
  getQuestLocations
};
