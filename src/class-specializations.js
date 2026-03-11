export const SPECIALIZATION_LEVEL = 5;

export const SPECIALIZATIONS = {
  warrior: {
    berserker: {
      id: 'berserker',
      name: 'Berserker',
      description: 'Channels fury into devastating attacks at the cost of defense.',
      statBonuses: { atk: 4, spd: 2, def: -2 },
      abilities: ['frenzy', 'reckless-strike'],
      passive: {
        id: 'bloodlust',
        name: 'Bloodlust',
        description:
          'Gain +2 ATK for each enemy defeated in combat (resets after combat).',
        type: 'on-kill',
        bonus: { atk: 2 },
      },
    },
    guardian: {
      id: 'guardian',
      name: 'Guardian',
      description:
        'Becomes an immovable fortress, protecting allies and absorbing damage.',
      statBonuses: { def: 5, maxHp: 15, spd: -1 },
      abilities: ['fortress-stance', 'taunt'],
      passive: {
        id: 'stalwart',
        name: 'Stalwart',
        description: 'Take 10% less damage when HP is below 50%.',
        type: 'damage-reduction',
        threshold: 0.5,
        reduction: 0.1,
      },
    },
  },
  mage: {
    elementalist: {
      id: 'elementalist',
      name: 'Elementalist',
      description:
        'Masters the raw elements, boosting fire, ice, and lightning damage.',
      statBonuses: { int: 5, maxMp: 10 },
      abilities: ['inferno-blast', 'chain-lightning'],
      passive: {
        id: 'elemental-mastery',
        name: 'Elemental Mastery',
        description: 'Elemental abilities deal 20% more damage.',
        type: 'damage-multiplier',
        multiplier: 1.2,
      },
    },
    enchanter: {
      id: 'enchanter',
      name: 'Enchanter',
      description: 'Weaves subtle magic to buff allies and debuff foes.',
      statBonuses: { int: 3, maxMp: 15, lck: 2 },
      abilities: ['arcane-barrier', 'hex'],
      passive: {
        id: 'mana-flow',
        name: 'Mana Flow',
        description: 'Recover 5% of max MP at the start of each turn.',
        type: 'mp-regen',
        percentage: 0.05,
      },
    },
  },
  rogue: {
    assassin: {
      id: 'assassin',
      name: 'Assassin',
      description:
        'A lethal striker who exploits weaknesses for massive critical hits.',
      statBonuses: { atk: 3, spd: 3, lck: 3 },
      abilities: ['execute', 'shadow-step'],
      passive: {
        id: 'deadly-precision',
        name: 'Deadly Precision',
        description: 'Critical hits deal 50% more bonus damage.',
        type: 'crit-bonus',
        multiplier: 1.5,
      },
    },
    shadow: {
      id: 'shadow',
      name: 'Shadow',
      description:
        'A phantom who slips through danger, evading attacks and striking from darkness.',
      statBonuses: { spd: 5, lck: 2, def: 1 },
      abilities: ['vanish', 'shadow-strike'],
      passive: {
        id: 'elusive',
        name: 'Elusive',
        description: '15% chance to completely dodge any attack.',
        type: 'dodge-chance',
        chance: 0.15,
      },
    },
  },
  cleric: {
    paladin: {
      id: 'paladin',
      name: 'Paladin',
      description:
        'A holy warrior who combines martial prowess with divine healing.',
      statBonuses: { atk: 3, def: 3, maxHp: 10 },
      abilities: ['holy-strike', 'divine-shield'],
      passive: {
        id: 'divine-favor',
        name: 'Divine Favor',
        description:
          'Healing spells also restore 5% of target max HP as bonus.',
        type: 'heal-bonus',
        percentage: 0.05,
      },
    },
    oracle: {
      id: 'oracle',
      name: 'Oracle',
      description:
        'A mystic seer with enhanced healing and the ability to foresee danger.',
      statBonuses: { int: 4, maxMp: 15, lck: 3 },
      abilities: ['prophecy', 'mass-heal'],
      passive: {
        id: 'foresight',
        name: 'Foresight',
        description:
          'At the start of combat, reveal enemy weaknesses and reduce their first attack damage by 20%.',
        type: 'combat-start',
        reduction: 0.2,
      },
    },
  },
};

const getClassIdFromPlayer = (player) =>
  player?.classId ?? player?.class ?? null;

const getSpecForClass = (classId, specId) =>
  SPECIALIZATIONS?.[classId]?.[specId] ?? null;

const mergeAbilities = (current, additions) => {
  const base = Array.isArray(current) ? current : [];
  const extra = Array.isArray(additions) ? additions : [];
  const seen = new Set(base);
  const merged = [...base];
  for (const ability of extra) {
    if (!seen.has(ability)) {
      seen.add(ability);
      merged.push(ability);
    }
  }
  return merged;
};

const applyStatBonuses = (player, bonuses) => {
  if (!player || !bonuses) {
    return { updatedPlayer: player, updatedStats: null };
  }

  const hasStatsObject =
    typeof player.stats === 'object' && player.stats !== null;
  const statsTarget = hasStatsObject ? { ...player.stats } : null;

  let maxHpDelta = 0;
  let maxMpDelta = 0;

  for (const [statKey, amount] of Object.entries(bonuses)) {
    if (statKey === 'maxHp') {
      maxHpDelta += amount;
    }
    if (statKey === 'maxMp') {
      maxMpDelta += amount;
    }

    if (hasStatsObject) {
      const currentValue = Number(statsTarget[statKey] ?? 0);
      statsTarget[statKey] = currentValue + amount;
    }
  }

  const updatedPlayer = { ...player };

  if (!hasStatsObject) {
    for (const [statKey, amount] of Object.entries(bonuses)) {
      const currentValue = Number(updatedPlayer[statKey] ?? 0);
      updatedPlayer[statKey] = currentValue + amount;
    }
  }

  if (maxHpDelta !== 0) {
    if (hasStatsObject) {
      if (typeof statsTarget.hp !== 'undefined') {
        statsTarget.hp = Number(statsTarget.hp ?? 0) + maxHpDelta;
      }
    } else if (typeof updatedPlayer.hp !== 'undefined') {
      updatedPlayer.hp = Number(updatedPlayer.hp ?? 0) + maxHpDelta;
    }
  }

  if (maxMpDelta !== 0) {
    if (hasStatsObject) {
      if (typeof statsTarget.mp !== 'undefined') {
        statsTarget.mp = Number(statsTarget.mp ?? 0) + maxMpDelta;
      }
    } else if (typeof updatedPlayer.mp !== 'undefined') {
      updatedPlayer.mp = Number(updatedPlayer.mp ?? 0) + maxMpDelta;
    }
  }

  return { updatedPlayer, updatedStats: statsTarget };
};

export function getSpecializationsForClass(classId) {
  if (!classId || !SPECIALIZATIONS[classId]) {
    return [];
  }
  return Object.values(SPECIALIZATIONS[classId]);
}

export function getSpecialization(classId, specId) {
  if (!classId || !specId) {
    return null;
  }
  return getSpecForClass(classId, specId);
}

export function canSpecialize(player) {
  if (!player) {
    return false;
  }
  return (
    Number(player.level ?? 0) >= SPECIALIZATION_LEVEL &&
    !player.specialization
  );
}

export function applySpecialization(player, specId) {
  if (!player || !specId || !canSpecialize(player)) {
    return null;
  }

  const classId = getClassIdFromPlayer(player);
  if (!classId) {
    return null;
  }

  const specialization = getSpecForClass(classId, specId);
  if (!specialization) {
    return null;
  }

  const { updatedPlayer, updatedStats } = applyStatBonuses(
    player,
    specialization.statBonuses
  );

  const nextPlayer = {
    ...updatedPlayer,
    specialization: specialization.id,
    specializationName: specialization.name,
    abilities: mergeAbilities(updatedPlayer.abilities, specialization.abilities),
    passive: specialization.passive,
  };

  if (updatedStats) {
    nextPlayer.stats = updatedStats;
  }

  return nextPlayer;
}

export function getSpecializationPassive(player) {
  if (!player?.specialization) {
    return null;
  }
  const classId = getClassIdFromPlayer(player);
  if (!classId) {
    return null;
  }
  const specialization = getSpecForClass(classId, player.specialization);
  return specialization?.passive ?? null;
}

export function isSpecialized(player) {
  return Boolean(player?.specialization);
}

export function getSpecializationInfo(player) {
  if (!player?.specialization) {
    return null;
  }
  const classId = getClassIdFromPlayer(player);
  if (!classId) {
    return null;
  }
  const specialization = getSpecForClass(classId, player.specialization);
  if (!specialization) {
    return null;
  }
  return {
    id: specialization.id,
    name: specialization.name,
    description: specialization.description,
    passive: specialization.passive,
  };
}

export function getAllSpecializations() {
  const all = [];
  for (const classSpecs of Object.values(SPECIALIZATIONS)) {
    for (const spec of Object.values(classSpecs)) {
      all.push(spec);
    }
  }
  return all;
}
