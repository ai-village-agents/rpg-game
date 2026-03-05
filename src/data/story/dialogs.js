/**
 * Dialog data for NPCs
 * Each dialog has nodes with text, optional choices, and effects
 */

export const DIALOGS = {
  // Village elder intro dialog
  elderIntro: {
    id: 'elderIntro',
    speaker: 'Village Elder',
    startNode: 'greeting',
    nodes: {
      greeting: {
        text: 'Ah, a traveler! Welcome to our village. These are troubled times, stranger.',
        nextNode: 'explain',
      },
      explain: {
        text: 'Dark creatures have been emerging from the northern caves. Our hunters cannot venture far anymore.',
        choices: [
          { text: 'I can help clear them out.', nextNode: 'acceptHelp' },
          { text: 'That sounds dangerous. Good luck.', nextNode: 'decline' },
          { text: 'Tell me more about these creatures.', nextNode: 'moreInfo' },
        ],
      },
      moreInfo: {
        text: 'They are shadow beasts - twisted things that fear the light. They started appearing a fortnight ago.',
        nextNode: 'explain',
      },
      acceptHelp: {
        text: 'Truly? The village would be in your debt! Seek out the cave entrance in the Northern Path.',
        effects: [
          { type: 'startQuest', questId: 'clearCaves' },
          { type: 'setFlag', key: 'talkedToElder', value: true },
        ],
        nextNode: 'end',
      },
      decline: {
        text: 'I understand. Safe travels to you, stranger.',
        effects: [
          { type: 'setFlag', key: 'declinedElderQuest', value: true },
        ],
        nextNode: 'end',
      },
    },
  },

  // Merchant dialog
  merchantShop: {
    id: 'merchantShop',
    speaker: 'Traveling Merchant',
    startNode: 'greeting',
    nodes: {
      greeting: {
        text: 'Welcome, welcome! I have wares from across the realm. What interests you?',
        choices: [
          { text: 'Show me your potions.', nextNode: 'potions' },
          { text: 'Do you have any weapons?', nextNode: 'weapons' },
          { text: 'Just browsing.', nextNode: 'end' },
        ],
      },
      potions: {
        text: 'Ah, a wise choice! Health potions are 50 gold, mana elixirs are 75.',
        choices: [
          { text: 'Buy Health Potion (50g)', nextNode: 'buyHealth', condition: { type: 'stat', key: 'gold', value: 50, operator: 'gte' } },
          { text: 'Buy Mana Elixir (75g)', nextNode: 'buyMana', condition: { type: 'stat', key: 'gold', value: 75, operator: 'gte' } },
          { text: 'Back to main selection.', nextNode: 'greeting' },
        ],
      },
      weapons: {
        text: 'Fine steel, sharpened just yesterday! A short sword runs 150 gold.',
        choices: [
          { text: 'Buy Short Sword (150g)', nextNode: 'buySword', condition: { type: 'stat', key: 'gold', value: 150, operator: 'gte' } },
          { text: 'Back to main selection.', nextNode: 'greeting' },
        ],
      },
      buyHealth: {
        text: 'A fine purchase! May it serve you well in battle.',
        effects: [
          { type: 'addItem', itemId: 'healthPotion' },
          { type: 'modifyStat', key: 'gold', value: -50 },
        ],
        nextNode: 'greeting',
      },
      buyMana: {
        text: 'Excellent! This elixir was brewed by a master alchemist.',
        effects: [
          { type: 'addItem', itemId: 'manaElixir' },
          { type: 'modifyStat', key: 'gold', value: -75 },
        ],
        nextNode: 'greeting',
      },
      buySword: {
        text: 'A warrior after my own heart! This blade will serve you faithfully.',
        effects: [
          { type: 'addItem', itemId: 'shortSword' },
          { type: 'modifyStat', key: 'gold', value: -150 },
        ],
        nextNode: 'greeting',
      },
    },
  },

  // Quest completion dialog with elder
  elderQuestComplete: {
    id: 'elderQuestComplete',
    speaker: 'Village Elder',
    startNode: 'greeting',
    nodes: {
      greeting: {
        text: 'You have returned! I see the light in your eyes - you have succeeded!',
        nextNode: 'reward',
      },
      reward: {
        text: 'The village is forever grateful. Please accept this reward.',
        effects: [
          { type: 'completeQuest', questId: 'clearCaves' },
          { type: 'modifyStat', key: 'gold', value: 200 },
          { type: 'addItem', itemId: 'elderAmulet' },
        ],
        nextNode: 'end',
      },
    },
  },

  // Mysterious stranger hint dialog
  strangerHint: {
    id: 'strangerHint',
    speaker: 'Hooded Stranger',
    startNode: 'greeting',
    nodes: {
      greeting: {
        text: '...You seek answers. The shadows are not the true threat.',
        choices: [
          { text: 'What do you mean?', nextNode: 'reveal' },
          { text: 'Who are you?', nextNode: 'identity' },
          { text: 'Leave me alone.', nextNode: 'end' },
        ],
      },
      identity: {
        text: 'Who I am matters not. What matters is what stirs beneath the mountain.',
        nextNode: 'reveal',
      },
      reveal: {
        text: 'Someone - or something - is summoning these creatures. Find the source, or they will never stop.',
        effects: [
          { type: 'setFlag', key: 'learnedOfSource', value: true },
        ],
        nextNode: 'warning',
      },
      warning: {
        text: 'Be wary, traveler. Not all who offer help have pure intentions...',
        nextNode: 'end',
      },
    },
  },
};

/**
 * Gets a dialog by ID
 */
export function getDialog(dialogId) {
  return DIALOGS[dialogId] || null;
}

/**
 * Gets all dialogs for a specific speaker
 */
export function getDialogsBySpeaker(speaker) {
  return Object.values(DIALOGS).filter(d => d.speaker === speaker);
}
