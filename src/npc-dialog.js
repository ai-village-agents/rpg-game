import { RelationshipLevel } from './npc-relationships.js';

const ROOM_NPCS = {
  center: [
    {
      id: 'village_elder',
      name: 'Village Elder Aldric',
      greeting:
        'Greetings, adventurer! Welcome to Millbrook Village. The road ahead is perilous — take care.',
      dialog: ['elder_1', 'elder_2', 'elder_3'],
    },
    {
      id: 'inn_keeper',
      name: 'Innkeeper Mira',
      greeting: "Welcome to the Wayfarer's Rest! Rest your weary feet, traveler.",
      dialog: ['inn_1'],
    },
  ],
  n: [
    {
      id: 'scout_patrol',
      name: 'Scout Patrol',
      greeting:
        'Halt! Identify yourself... Oh, a traveler. Proceed, but be wary — wolves were spotted to the north.',
      dialog: ['scout_1'],
    },
  ],
  ne: [
    {
      id: 'hermit_sage',
      hasShop: true,
      name: 'Hermit Sage',
      greeting:
        'Ah, a seeker of knowledge! The ridge holds ancient secrets. Ask and I shall share wisdom.',
      dialog: ['sage_1', 'sage_2'],
    },
  ],
  e: [
    {
      id: 'farmer_gale',
      name: 'Farmer Gale',
      greeting:
        'Good day! The harvest is poor this season. Goblins have been raiding our fields at night.',
      dialog: ['farmer_1'],
    },
  ],
  w: [
    {
      id: 'merchant_bram',
      hasShop: true,
      name: 'Merchant Bram',
      greeting:
        'Ho there! I trade in fine goods. If you find rare items on your travels, I pay well!',
      dialog: ['merchant_1'],
    },
  ],
  s: [
    {
      id: 'wandering_knight',
      hasShop: true,
      name: 'Wandering Knight',
      greeting:
        'Well met! I am Sir Aldous, knight errant. The southern road grows dangerous. Watch yourself.',
      dialog: ['knight_1'],
    },
  ],
  nw: [
    {
      id: 'forest_spirit',
      name: 'Forest Spirit',
      greeting:
        '*whispers* You tread on sacred ground. Show respect to the ancient trees...',
      dialog: ['spirit_1'],
    },
  ],
  sw: [
    {
      id: 'swamp_witch',
      hasShop: true,
      name: 'Swamp Witch Helga',
      greeting: "Eye of newt and wing of bat... Oh! A visitor! Don't mind the cauldron, dearie.",
      dialog: ['witch_1'],
    },
  ],
  se: [
    {
      id: 'old_fisherman',
      name: 'Old Fisherman Pete',
      greeting:
        'Finest dock this side of the realm! Though the waters have been restless lately...',
      dialog: ['fisher_1'],
    },
  ],
};

const DIALOG_LINES = {
  elder_1: [
    'The goblin raids began three weeks ago. Our farmers are terrified.',
    'I fear something dark stirs in the eastern forests.',
  ],
  elder_2: [
    'Legend speaks of an ancient evil that awakens every hundred years.',
    'Perhaps you are the hero foretold in the old prophecy?',
  ],
  elder_3: [
    'Should you face great danger, remember: courage is the heart of every hero.',
  ],
  inn_1: [
    'A room costs 10 gold per night. Our stew is the best in the realm!',
    'Many adventurers have passed through here. Not all returned...',
  ],
  scout_1: [
    'We patrol the perimeter to keep Millbrook safe.',
    'Report any unusual activity to Guard Captain Rolf in the village square.',
  ],
  sage_1: [
    'The three pillars of wisdom: Know thyself. Know thine enemy. Know when to retreat.',
    'Many brave fools charge ahead. The wise warrior lives to fight another day.',
  ],
  sage_2: [
    'The ridge was once home to a great mage tower. Only ruins remain now.',
    'Some say the stones still hold echoes of ancient spells...',
  ],
  farmer_1: [
    'Three nights running, something raids the crops. Small figures, green-skinned.',
    "Captain Rolf won't spare guards for farmers. Says we're not priority. Bah!",
  ],
  merchant_1: [
    'I buy and sell: weapons, potions, rare materials.',
    'My prices are fair. Try me after your next dungeon run!',
  ],
  knight_1: [
    'I have fought from the northern snows to the southern shores.',
    'Never underestimate a foe — not even a lowly goblin. I learned that the hard way.',
  ],
  spirit_1: [
    '*a gentle glow surrounds you* The grove remembers all who walk within it.',
    "Harm none that dwells here, and the forest's blessing be upon you.",
  ],
  witch_1: [
    "Forty years I've lived in this marsh. Peace and quiet — until goblins started stirring!",
    'I can brew potions if you bring me the right ingredients. Hint: check the grove.',
  ],
  fisher_1: [
    "Strange lights in the water lately. Not natural, I'd wager.",
    'The old sailors say the sea serpent wakes when the land troubles grow. Maybe just superstition...',
  ],
};

const RELATIONSHIP_GREETINGS = {
  village_elder: {
    [RelationshipLevel.HOSTILE]:
      'Elder Aldric scowls. "You have done ill by this village. I have nothing to say to you."',
    [RelationshipLevel.UNFRIENDLY]:
      'Elder Aldric regards you coolly. "State your business quickly."',
    [RelationshipLevel.NEUTRAL]:
      'Greetings, adventurer! Welcome to Millbrook Village. The road ahead is perilous — take care.',
    [RelationshipLevel.FRIENDLY]:
      'Elder Aldric smiles warmly. "Ah, a trusted friend! The village is grateful for your aid."',
    [RelationshipLevel.ALLIED]:
      'Elder Aldric beams with pride. "Our greatest champion returns! Millbrook stands with you always."',
  },
  inn_keeper: {
    [RelationshipLevel.HOSTILE]:
      'Mira narrows her eyes. "Not welcome here. Take your troubles elsewhere."',
    [RelationshipLevel.UNFRIENDLY]:
      'Mira keeps her distance. "Make it quick, and mind your manners."',
    [RelationshipLevel.NEUTRAL]:
      "Welcome to the Wayfarer's Rest! Rest your weary feet, traveler.",
    [RelationshipLevel.FRIENDLY]:
      'Mira beams. "Ah, a familiar face! First drink is on the house."',
    [RelationshipLevel.ALLIED]:
      "Mira grins. \"My hero! The Wayfarer's Rest is yours whenever you need it.\"",
  },
  scout_patrol: {
    [RelationshipLevel.HOSTILE]:
      'The scouts raise their spears. "Enemy sighted! You are not welcome here."',
    [RelationshipLevel.UNFRIENDLY]:
      'A scout eyes you warily. "State your name and move along."',
    [RelationshipLevel.NEUTRAL]:
      'Halt! Identify yourself... Oh, a traveler. Proceed, but be wary — wolves were spotted to the north.',
    [RelationshipLevel.FRIENDLY]:
      'The scouts nod with respect. "Good to see you again. The road is safer with you around."',
    [RelationshipLevel.ALLIED]:
      'The patrol salutes. "Captain says we can count on you. Our blades are yours."',
  },
  hermit_sage: {
    [RelationshipLevel.HOSTILE]:
      'The hermit frowns. "You bring discord. Leave my sanctuary."',
    [RelationshipLevel.UNFRIENDLY]:
      'The hermit speaks curtly. "I have little patience for you."',
    [RelationshipLevel.NEUTRAL]:
      'Ah, a seeker of knowledge! The ridge holds ancient secrets. Ask and I shall share wisdom.',
    [RelationshipLevel.FRIENDLY]:
      'The hermit smiles. "You return with an open mind. Sit, and I will share more."',
    [RelationshipLevel.ALLIED]:
      'The hermit bows. "Wisdom and warding are yours, trusted ally."',
  },
  farmer_gale: {
    [RelationshipLevel.HOSTILE]:
      'Farmer Gale clenches his fists. "You\'ve brought us nothing but trouble."',
    [RelationshipLevel.UNFRIENDLY]:
      'Farmer Gale sighs. "I\'ve got work to do. What do you want?"',
    [RelationshipLevel.NEUTRAL]:
      'Good day! The harvest is poor this season. Goblins have been raiding our fields at night.',
    [RelationshipLevel.FRIENDLY]:
      'Farmer Gale brightens. "Thanks again for your help. The fields are safer now."',
    [RelationshipLevel.ALLIED]:
      'Farmer Gale smiles proudly. "You\'re family to these farms. We stand with you."',
  },
  merchant_bram: {
    [RelationshipLevel.HOSTILE]:
      'Bram folds his arms. "No trade with you. Move along."',
    [RelationshipLevel.UNFRIENDLY]:
      'Bram eyes you cautiously. "If you\'re buying, be quick."',
    [RelationshipLevel.NEUTRAL]:
      'Ho there! I trade in fine goods. If you find rare items on your travels, I pay well!',
    [RelationshipLevel.FRIENDLY]:
      'Bram grins. "For you, friend, I can offer a fair discount."',
    [RelationshipLevel.ALLIED]:
      'Bram bows. "My best stock is yours. Consider it a gesture of alliance."',
  },
  wandering_knight: {
    [RelationshipLevel.HOSTILE]:
      'Sir Aldous glares. "Your deeds dishonor you. Begone."',
    [RelationshipLevel.UNFRIENDLY]:
      'Sir Aldous regards you sternly. "State your purpose."',
    [RelationshipLevel.NEUTRAL]:
      'Well met! I am Sir Aldous, knight errant. The southern road grows dangerous. Watch yourself.',
    [RelationshipLevel.FRIENDLY]:
      'Sir Aldous nods. "You have proven your valor. Well met, friend."',
    [RelationshipLevel.ALLIED]:
      'Sir Aldous salutes. "By my oath, I ride with you whenever you call."',
  },
  forest_spirit: {
    [RelationshipLevel.HOSTILE]:
      '*the air chills* "You have harmed the grove. Leave now."',
    [RelationshipLevel.UNFRIENDLY]:
      '*a wary rustle* "Tread lightly, outsider."',
    [RelationshipLevel.NEUTRAL]:
      '*whispers* You tread on sacred ground. Show respect to the ancient trees...',
    [RelationshipLevel.FRIENDLY]:
      '*soft glow* "The trees whisper of your kindness."',
    [RelationshipLevel.ALLIED]:
      '*a warm breeze* "The forest claims you as kin."',
  },
  swamp_witch: {
    [RelationshipLevel.HOSTILE]:
      'Helga cackles darkly. "You\'ve crossed me. Begone before I hex you."',
    [RelationshipLevel.UNFRIENDLY]:
      'Helga squints. "Speak your piece, then leave me to my brews."',
    [RelationshipLevel.NEUTRAL]:
      "Eye of newt and wing of bat... Oh! A visitor! Don't mind the cauldron, dearie.",
    [RelationshipLevel.FRIENDLY]:
      'Helga chuckles. "Ah, my favorite customer. Care for a special tonic?"',
    [RelationshipLevel.ALLIED]:
      'Helga grins. "For you, dearie, I\'ll brew the rarest of remedies."',
  },
  old_fisherman: {
    [RelationshipLevel.HOSTILE]:
      'Pete spits in the water. "Not another word to you."',
    [RelationshipLevel.UNFRIENDLY]:
      'Pete grumbles. "What do you want? I\'m busy."',
    [RelationshipLevel.NEUTRAL]:
      'Finest dock this side of the realm! Though the waters have been restless lately...',
    [RelationshipLevel.FRIENDLY]:
      'Pete smiles. "Good to see you. The fish have been biting since you came by."',
    [RelationshipLevel.ALLIED]:
      'Pete laughs. "You\'re like family. Anything you need, you just ask."',
  },
};

function getNpcById(npcId) {
  for (const roomId of Object.keys(ROOM_NPCS)) {
    const npc = ROOM_NPCS[roomId].find((entry) => entry.id === npcId);
    if (npc) return npc;
  }
  return null;
}

function getRelationshipGreeting(npcId, relationshipLevel) {
  const entry = RELATIONSHIP_GREETINGS[npcId];
  if (entry && relationshipLevel && entry[relationshipLevel]) {
    return entry[relationshipLevel];
  }
  const npc = getNpcById(npcId);
  return npc ? npc.greeting : null;
}

function getRelationshipLabel(relationshipLevel) {
  switch (relationshipLevel) {
    case RelationshipLevel.HOSTILE:
      return 'Hostile';
    case RelationshipLevel.UNFRIENDLY:
      return 'Unfriendly';
    case RelationshipLevel.NEUTRAL:
      return 'Neutral';
    case RelationshipLevel.FRIENDLY:
      return 'Friendly';
    case RelationshipLevel.ALLIED:
      return 'Allied';
    default:
      return 'Neutral';
  }
}

function getNPCsInRoom(roomId) {
  return ROOM_NPCS[roomId] ? ROOM_NPCS[roomId].map((npc) => ({ ...npc })) : [];
}

function createDialogState(npc, relationshipLevel) {
  const hasRelationshipLevel = relationshipLevel !== undefined && relationshipLevel !== null;
  const greeting = hasRelationshipLevel
    ? getRelationshipGreeting(npc.id, relationshipLevel)
    : npc.greeting;
  const dialogState = {
    npcId: npc.id,
    npcName: npc.name,
    greeting,
    dialogIds: npc.dialog,
    dialogIndex: 0,
    lineIndex: 0,
    lines: DIALOG_LINES[npc.dialog[0]] || [],
    done: false,
  };
  if (hasRelationshipLevel) {
    dialogState.relationshipLevel = relationshipLevel;
  }
  return dialogState;
}

function advanceDialog(dialogState) {
  if (dialogState.done) {
    return { ...dialogState };
  }

  const { lineIndex, lines, dialogIndex, dialogIds } = dialogState;

  if (lineIndex + 1 < lines.length) {
    return {
      ...dialogState,
      lineIndex: lineIndex + 1,
    };
  }

  if (dialogIndex + 1 < dialogIds.length) {
    const nextDialogIndex = dialogIndex + 1;
    const nextLines = DIALOG_LINES[dialogIds[nextDialogIndex]] || [];

    return {
      ...dialogState,
      dialogIndex: nextDialogIndex,
      lineIndex: 0,
      lines: nextLines,
    };
  }

  return {
    ...dialogState,
    done: true,
  };
}

function getCurrentDialogLine(dialogState) {
  if (dialogState.done) {
    return null;
  }

  if (!dialogState.lines || dialogState.lines.length === 0) {
    return dialogState.greeting;
  }

  return dialogState.lines[dialogState.lineIndex] || null;
}

function getDialogProgress(dialogState) {
  return {
    current: dialogState.lineIndex + 1,
    total: dialogState.lines.length,
    sectionCurrent: dialogState.dialogIndex + 1,
    sectionTotal: dialogState.dialogIds.length,
  };
}

export {
  ROOM_NPCS,
  DIALOG_LINES,
  RELATIONSHIP_GREETINGS,
  getNPCsInRoom,
  getRelationshipGreeting,
  getRelationshipLabel,
  createDialogState,
  advanceDialog,
  getCurrentDialogLine,
  getDialogProgress,
};
