export const DUNGEON_FLOORS = [
  {
    id: 1,
    name: "Echoing Grotto",
    theme: "cavern",
    description: "Damp tunnels where slimes and bats cling to stone.",
    entryText:
      "Cool air beads on stone as distant drips answer your steps. The cavern breathes with hollow echoes.",
    ambientMessages: [
      "Water ticks from the ceiling, each drop a tiny bell.",
      "A leathery flutter brushes past, lost in the dark.",
      "Your footsteps ripple through tunnels like a slow drum.",
    ],
    clearText:
      "Silence settles and the grotto feels less hostile. The path downward opens among the wet stones.",
    enemyPool: ["slime", "cave_bat", "goblin"],
    difficultyMultiplier: 1.0,
    encounterRate: 0.3,
    bossFloor: false,
    bossId: null,
    minLevel: 3,
  },
  {
    id: 2,
    name: "Crystal Hollows",
    theme: "cavern",
    description: "Glittering caverns hide skittering fangs and ambushers.",
    entryText:
      "Light fractures across the walls, scattering cold rainbows. The glittering hollow feels razor-sharp and alive.",
    ambientMessages: [
      "Sharded crystal hums softly when your torchlight passes.",
      "Tiny skitters echo, then vanish behind glittering pillars.",
      "Your breath clouds the air, refracted into prismatic fog.",
    ],
    clearText:
      "The hollow quiets and the crystals dim to a steady glow. You claim the passage ahead.",
    enemyPool: ["slime", "cave_bat", "goblin", "giant_spider"],
    difficultyMultiplier: 1.15,
    encounterRate: 0.33,
    bossFloor: false,
    bossId: null,
    minLevel: 4,
  },
  {
    id: 3,
    name: "Goblin Stronghold",
    theme: "goblin_stronghold",
    description: "Barricaded caves echo with drums and goblin war cries.",
    entryText:
      "Crude banners sway above barricades and smoky braziers. The stench of oil and steel hangs thick.",
    ambientMessages: [
      "Distant drums thud in uneven patterns, then fall silent.",
      "Boots scrape stone beyond a wall, then retreat quickly.",
      "Ash drifts from a brazier, stinging your nose.",
    ],
    clearText:
      "The stronghold's drums are broken and its barricades lie open. Victory rings through the tunnels.",
    enemyPool: ["goblin", "goblin_chief", "cave_bat"],
    difficultyMultiplier: 1.3,
    encounterRate: 0.36,
    bossFloor: true,
    bossId: "goblin_chief",
    minLevel: 5,
  },
  {
    id: 4,
    name: "Silent Catacombs",
    theme: "crypt",
    description: "Ancient bones and cold mist rise from unmarked graves.",
    entryText:
      "Cold mist coils around cracked sarcophagi. The silence presses like weight on your ears.",
    ambientMessages: [
      "Faint whispers trail behind you, then dissolve into mist.",
      "Bones shift somewhere ahead, a dry rustle on stone.",
      "Your torchlight stretches long, then collapses into shadow.",
    ],
    clearText:
      "The catacombs release a slow, steady chill as threats fade. A hidden stair reveals itself among the graves.",
    enemyPool: ["skeleton", "wraith", "dark-cultist"],
    difficultyMultiplier: 1.45,
    encounterRate: 0.4,
    bossFloor: false,
    bossId: null,
    minLevel: 6,
  },
  {
    id: 5,
    name: "Shattered Mausoleum",
    theme: "crypt",
    description: "Cursed halls where spirits guard forgotten relics.",
    entryText:
      "Ruin and reverence mingle in the broken halls. A lingering chill clings to every relic.",
    ambientMessages: [
      "Chains sway without wind, clinking with mournful rhythm.",
      "Dust spirals upward as if stirred by unseen steps.",
      "Faded inscriptions glow faintly, then return to gray.",
    ],
    clearText:
      "The mausoleum's guardians are still, and the relics rest. You stand amid cracked stone, unopposed.",
    enemyPool: ["skeleton", "wraith", "dark-cultist", "orc"],
    difficultyMultiplier: 1.6,
    encounterRate: 0.44,
    bossFloor: false,
    bossId: null,
    minLevel: 7,
  },
  {
    id: 6,
    name: "Frozen Depths",
    theme: "frozen_depths",
    description: "Ice-choked passages where frost bites through armor.",
    entryText:
      "Ice seals the corridors and your breath crystallizes. Every sound snaps and rings in the cold.",
    ambientMessages: [
      "Frost creeps along your gauntlets, numbness biting hard.",
      "A distant howl bounces between walls, warped by ice.",
      "Snow crystals drift from the ceiling, glittering as they fall.",
    ],
    clearText:
      "Warmth returns to your limbs as the chill recedes. The frozen depths yield their passage.",
    enemyPool: ["ice-spirit", "wolf", "skeleton"],
    difficultyMultiplier: 1.75,
    encounterRate: 0.48,
    bossFloor: true,
    bossId: "ice-spirit",
    minLevel: 8,
  },
  {
    id: 7,
    name: "Ruined Causeway",
    theme: "ruins",
    description: "Broken stone bridges patrolled by hardened raiders.",
    entryText:
      "Broken bridges span chasms lit by dim torchlight. Wind whistles through the gaps with a sharp edge.",
    ambientMessages: [
      "Loose pebbles skitter over stone and vanish into the void.",
      "Old banners snap in the draft, their colors long faded.",
      "Far below, water roars like a distant forge.",
    ],
    clearText:
      "The causeway stands quiet, its raiders driven away. You cross with confidence toward the next descent.",
    enemyPool: ["stone-golem", "orc", "bandit", "blood-fiend", "shadow-weaver"],
    difficultyMultiplier: 1.9,
    encounterRate: 0.52,
    bossFloor: false,
    bossId: null,
    minLevel: 9,
  },
  {
    id: 8,
    name: "Forgotten Bastion",
    theme: "ruins",
    description: "Collapsed keeps shelter warbands and ancient sentries.",
    entryText:
      "Collapsed towers loom like fractured teeth. The bastion reeks of old battles and rust.",
    ambientMessages: [
      "A fallen shield rocks slightly, then rests against rubble.",
      "Crows call from high beams, then scatter into dust.",
      "Your steps echo in a courtyard once filled with soldiers.",
    ],
    clearText:
      "The bastion lies claimed and silent, its sentries toppled. A clear route opens deeper within.",
    enemyPool: ["stone-golem", "orc", "bandit", "wraith", "storm-elemental", "plague-bearer"],
    difficultyMultiplier: 2.05,
    encounterRate: 0.56,
    bossFloor: false,
    bossId: null,
    minLevel: 10,
  },
  {
    id: 9,
    name: "Infernal Gate",
    theme: "inferno",
    description: "Molten chambers blaze with stormfire and winged hunters.",
    entryText:
      "Heat surges in waves as molten light spills from vents. The air crackles with stormfire.",
    ambientMessages: [
      "Cinders drift past, stinging your skin with brief sparks.",
      "A low rumble rolls through the floor, like distant thunder.",
      "Wings beat once overhead, then vanish into the blaze.",
    ],
    clearText:
      "The gate's fury dims and the blaze steadies. You stand unburned at the threshold of the deep.",
    enemyPool: ["fire-spirit", "thunder-hawk", "dragon", "infernal-knight", "glacial-wyrm"],
    difficultyMultiplier: 2.2,
    encounterRate: 0.6,
    bossFloor: true,
    bossId: "dragon",
    minLevel: 11,
  },
  {
    id: 10,
    name: "Abyssal Throne",
    theme: "abyss",
    description: "The final descent where every terror gathers.",
    entryText:
      "The descent ends in a vast chamber of oppressive shadow. Every breath tastes of ash and iron.",
    ambientMessages: [
      "A distant heartbeat pulses in the stone, slow and heavy.",
      "Your light bends strangely, swallowed at the edges.",
      "A cold whisper slides past, promising nothing but ruin.",
    ],
    clearText:
      "The throne is empty and the darkness recoils. You have conquered the abyss and its last terror.",
    enemyPool: [
      "slime",
      "goblin",
      "goblin_chief",
      "cave_bat",
      "giant_spider",
      "wolf",
      "skeleton",
      "orc",
      "fire-spirit",
      "ice-spirit",
      "dark-cultist",
      "bandit",
      "wraith",
      "stone-golem",
      "thunder-hawk",
      "dragon",
      "frost-revenant",
      "blood-fiend",
      "shadow-weaver",
      "storm-elemental",
      "plague-bearer",
      "infernal-knight",
      "glacial-wyrm",
      "void-stalker",
    ],
    difficultyMultiplier: 2.35,
    encounterRate: 0.65,
    bossFloor: true,
    bossId: "abyss_overlord",
    minLevel: 12,
  },
];

const TOTAL_FLOORS = 10;

export function createDungeonState() {
  return {
    currentFloor: 0,
    deepestFloor: 0,
    floorsCleared: [],
    inDungeon: false,
    stairsFound: false,
  };
}

export function enterDungeon(dungeonState) {
  return {
    ...dungeonState,
    inDungeon: true,
    currentFloor: 1,
    stairsFound: false,
  };
}

export function exitDungeon(dungeonState) {
  return {
    ...dungeonState,
    inDungeon: false,
    currentFloor: 0,
    stairsFound: false,
  };
}

export function getFloorData(floorNumber) {
  return DUNGEON_FLOORS.find((floor) => floor.id === floorNumber) || null;
}

export function advanceFloor(dungeonState) {
  const nextFloor = Math.min(dungeonState.currentFloor + 1, TOTAL_FLOORS);
  return {
    ...dungeonState,
    currentFloor: nextFloor,
    deepestFloor: Math.max(dungeonState.deepestFloor, nextFloor),
    stairsFound: false,
  };
}

export function clearFloor(dungeonState) {
  const currentFloor = dungeonState.currentFloor;
  if (!currentFloor) {
    return { ...dungeonState };
  }
  if (dungeonState.floorsCleared.includes(currentFloor)) {
    return { ...dungeonState };
  }
  return {
    ...dungeonState,
    floorsCleared: [...dungeonState.floorsCleared, currentFloor],
  };
}

export function findStairs(dungeonState) {
  return {
    ...dungeonState,
    stairsFound: true,
  };
}

export function canAdvance(dungeonState) {
  if (!dungeonState.stairsFound) {
    return false;
  }
  const floorData = getFloorData(dungeonState.currentFloor);
  if (!floorData) {
    return false;
  }
  const cleared = dungeonState.floorsCleared.includes(dungeonState.currentFloor);
  return cleared || floorData.bossFloor;
}

export function getScaledEnemy(enemy, floorNumber) {
  const floorData = getFloorData(floorNumber);
  if (!floorData || !enemy) {
    return enemy ? { ...enemy } : null;
  }
  const multiplier = floorData.difficultyMultiplier;
  const scale = (value) => Math.max(1, Math.round(value * multiplier));
  return {
    ...enemy,
    hp: scale(enemy.hp),
    maxHp: scale(enemy.maxHp ?? enemy.hp),
    atk: scale(enemy.atk),
    def: scale(enemy.def),
    spd: scale(enemy.spd),
    xpReward: scale(enemy.xpReward),
    goldReward: scale(enemy.goldReward),
  };
}

export function getRandomEncounter(dungeonState, rngSeed) {
  const floorData = getFloorData(dungeonState.currentFloor);
  if (!floorData || !rngSeed) {
    return null;
  }
  const nextSeed = (rngSeed * 16807) % 2147483647;
  const roll = nextSeed / 2147483647;
  if (roll > floorData.encounterRate) {
    return null;
  }
  const poolIndex = Math.floor(roll * floorData.enemyPool.length);
  const enemyId = floorData.enemyPool[poolIndex];
  return { enemyId, seed: nextSeed };
}

export function getDungeonProgress(dungeonState) {
  const floorsCleared = dungeonState.floorsCleared.length;
  const percentComplete = Math.min(
    100,
    Math.round((floorsCleared / TOTAL_FLOORS) * 100)
  );
  return {
    currentFloor: dungeonState.currentFloor,
    deepestFloor: dungeonState.deepestFloor,
    floorsCleared,
    totalFloors: TOTAL_FLOORS,
    percentComplete,
  };
}

export function isFloorCleared(dungeonState, floorNumber) {
  return dungeonState.floorsCleared.includes(floorNumber);
}

export function getFloorTheme(floorNumber) {
  const floorData = getFloorData(floorNumber);
  return floorData ? floorData.theme : null;
}

export function canEnterDungeon(playerLevel) {
  return playerLevel >= 3;
}

export function getBossForFloor(floorNumber) {
  const floorData = getFloorData(floorNumber);
  return floorData ? floorData.bossId : null;
}
