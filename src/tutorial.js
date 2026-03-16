export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    trigger: 'class-select',
    title: 'Welcome, Adventurer!',
    message: 'Choose a class to begin your journey. Each class has unique abilities and playstyles.',
    position: 'center',
  },
  {
    id: 'exploration-basics',
    trigger: 'first-exploration',
    title: 'Exploring the World',
    message: 'Click the directional buttons or use WASD to move between areas and discover new locations.',
    position: 'top',
  },
  {
    id: 'combat-intro',
    trigger: 'first-combat',
    title: 'Combat Basics',
    message: 'Use Attack for basic damage, Defend to reduce incoming damage, and abilities that cost MP for special effects.',
    position: 'top',
  },
  {
    id: 'inventory-intro',
    trigger: 'first-inventory',
    title: 'Your Inventory',
    message: 'Equipment improves your stats. Use sort and filter controls to organize items quickly.',
    position: 'top',
  },
  {
    id: 'shop-intro',
    trigger: 'first-shop',
    title: 'The Shop',
    message: 'Buy and sell items here. Rarer items cost more but offer greater power.',
    position: 'top',
  },
  {
    id: 'dungeon-intro',
    trigger: 'first-dungeon',
    title: 'Dungeon Delving',
    message: 'Dungeons have multiple floors with increasingly powerful enemies. Bring provisions and be prepared.',
    position: 'center',
  },
  {
    id: 'level-up-intro',
    trigger: 'first-level-up',
    title: 'Level Up!',
    message: 'Gain stats and skill points when you level up. Spend them in the talent tree.',
    position: 'center',
  },
  {
    id: 'quest-intro',
    trigger: 'first-quest',
    title: 'Quests',
    message: 'Quests provide objectives and rewards. Check the quest log for details.',
    position: 'top',
  },
  {
    id: 'crafting-intro',
    trigger: 'first-crafting',
    title: 'Crafting',
    message: 'Combine recipes to create powerful items. Discover new recipes as you explore.',
    position: 'top',
  },
  {
    id: 'companion-intro',
    trigger: 'first-companion',
    title: 'Companions',
    message: 'Companions can join your party and fight alongside you.',
    position: 'top',
  },
  {
    id: 'status-effects',
    trigger: 'first-status-effect',
    title: 'Status Effects',
    message: 'Buffs and debuffs affect combat flow. Some wear off over time.',
    position: 'top',
  },
  {
    id: 'abilities-intro',
    trigger: 'first-ability-use',
    title: 'Special Abilities',
    message: 'Abilities cost MP but can deal elemental damage or apply effects. Watch enemy weaknesses.',
    position: 'top',
  },
];

export function createTutorialState() {
  let hintsEnabled = true;
  try {
    const stored = typeof localStorage !== 'undefined' && localStorage.getItem('aiVillageRpg_hintsEnabled');
    if (stored === 'false') hintsEnabled = false;
  } catch(e) {}
  return {
    completedSteps: [],
    currentHint: null,
    hintsEnabled,
  };
}

export function getTutorialHint(tutorialState, triggerEvent) {
  if (!tutorialState || tutorialState.hintsEnabled === false) {
    return null;
  }

  const step = TUTORIAL_STEPS.find((s) => s.trigger === triggerEvent);
  if (!step) return null;
  if (tutorialState.completedSteps.includes(step.id)) return null;
  return step;
}

export function completeTutorialStep(tutorialState, stepId) {
  if (!tutorialState || tutorialState.completedSteps.includes(stepId)) {
    return tutorialState;
  }

  return {
    ...tutorialState,
    completedSteps: [...tutorialState.completedSteps, stepId],
    currentHint: null,
  };
}

export function dismissCurrentHint(tutorialState) {
  if (!tutorialState) {
    return tutorialState;
  }

  return {
    ...tutorialState,
    currentHint: null,
  };
}

export function showHint(tutorialState, stepId) {
  if (!tutorialState) {
    return tutorialState;
  }

  const step = TUTORIAL_STEPS.find((entry) => entry.id === stepId);
  if (!step) {
    return tutorialState;
  }

  return {
    ...tutorialState,
    currentHint: step,
  };
}

export function resetTutorial() {
  return createTutorialState();
}

export function getTutorialProgress(tutorialState) {
  const total = TUTORIAL_STEPS.length;
  const completed = tutorialState ? tutorialState.completedSteps.length : 0;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    completed,
    total,
    percentage,
  };
}
