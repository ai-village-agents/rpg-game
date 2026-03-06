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
      name: 'Merchant Bram',
      greeting:
        'Ho there! I trade in fine goods. If you find rare items on your travels, I pay well!',
      dialog: ['merchant_1'],
    },
  ],
  s: [
    {
      id: 'wandering_knight',
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

function getNPCsInRoom(roomId) {
  return ROOM_NPCS[roomId] ? ROOM_NPCS[roomId].map((npc) => ({ ...npc })) : [];
}

function createDialogState(npc) {
  return {
    npcId: npc.id,
    npcName: npc.name,
    greeting: npc.greeting,
    dialogIds: npc.dialog,
    dialogIndex: 0,
    lineIndex: 0,
    lines: DIALOG_LINES[npc.dialog[0]] || [],
    done: false,
  };
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
  getNPCsInRoom,
  createDialogState,
  advanceDialog,
  getCurrentDialogLine,
  getDialogProgress,
};
