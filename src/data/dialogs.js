/**
 * Dialog Data - Sample dialogs for the RPG
 * Part of Story/Dialog Module
 */

const DIALOGS = {
  // Village Elder - Main quest giver
  elder_intro: {
    id: 'elder_intro',
    nodes: [
      {
        id: 'start',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'Ah, a traveler! Welcome to our humble village of Millbrook.',
        next: 'choice1'
      },
      {
        id: 'choice1',
        type: 'CHOICE',
        speaker: 'Village Elder',
        text: 'What brings you to these parts?',
        choices: [
          { text: 'I seek adventure and glory!', next: 'adventure' },
          { text: 'Just passing through.', next: 'passing' },
          { text: 'I heard rumors of trouble here.', next: 'trouble' }
        ]
      },
      {
        id: 'adventure',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'Adventure, you say? Then perhaps fate has brought you here. We have a problem that requires someone of courage.',
        next: 'quest_offer'
      },
      {
        id: 'passing',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'I see. Well, before you go, perhaps you might help us with a small matter?',
        next: 'quest_offer'
      },
      {
        id: 'trouble',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'Your ears serve you well. Dark times have fallen upon Millbrook.',
        next: 'quest_offer'
      },
      {
        id: 'quest_offer',
        type: 'CONDITIONAL',
        conditions: [
          { type: 'QUEST_COMPLETE', questId: 'main_quest_1', then: 'quest_complete' },
          { type: 'QUEST_ACTIVE', questId: 'main_quest_1', then: 'quest_active' }
        ],
        default: 'quest_start'
      },
      {
        id: 'quest_start',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'Goblins have been raiding our farms at night. Will you help us drive them away?',
        next: 'accept_choice'
      },
      {
        id: 'accept_choice',
        type: 'CHOICE',
        speaker: 'Village Elder',
        text: 'What say you, traveler?',
        choices: [
          { text: 'I will help you!', next: 'accept' },
          { text: 'What is in it for me?', next: 'reward_info' },
          { text: 'Not my problem.', next: 'decline' }
        ]
      },
      {
        id: 'reward_info',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'We can offer 100 gold pieces and access to our armory. Plus, the gratitude of the village.',
        next: 'accept_choice'
      },
      {
        id: 'accept',
        type: 'ACTION',
        actions: [
          { type: 'START_QUEST', questId: 'main_quest_1' },
          { type: 'SET_FLAG', flag: 'met_elder', value: true }
        ],
        next: 'accepted'
      },
      {
        id: 'accepted',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'Bless you! The goblin camp lies to the east, past the old mill. Be careful!',
        next: 'end'
      },
      {
        id: 'decline',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'I understand. If you change your mind, you know where to find me.',
        next: 'end'
      },
      {
        id: 'quest_active',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'Have you dealt with the goblin menace yet? The camp lies east of here.',
        next: 'end'
      },
      {
        id: 'quest_complete',
        type: 'TEXT',
        speaker: 'Village Elder',
        text: 'You have saved our village! We are forever in your debt.',
        next: 'end'
      },
      {
        id: 'end',
        type: 'END'
      }
    ]
  },

  // Blacksmith conversation
  blacksmith_shop: {
    id: 'blacksmith_shop',
    nodes: [
      {
        id: 'start',
        type: 'TEXT',
        speaker: 'Tormund the Smith',
        text: '*clang* *clang* Ah, a customer! Name\'s Tormund. Finest weapons in the region.',
        next: 'choice1'
      },
      {
        id: 'choice1',
        type: 'CHOICE',
        speaker: 'Tormund the Smith',
        text: 'What can I do for you?',
        choices: [
          { text: 'Show me your wares.', next: 'shop' },
          { text: 'Can you upgrade my equipment?', next: 'upgrade' },
          { text: 'Tell me about yourself.', next: 'backstory' },
          { text: 'Goodbye.', next: 'bye' }
        ]
      },
      {
        id: 'shop',
        type: 'ACTION',
        actions: [
          { type: 'OPEN_SHOP', shopId: 'blacksmith_weapons' }
        ],
        next: 'after_shop'
      },
      {
        id: 'after_shop',
        type: 'TEXT',
        speaker: 'Tormund the Smith',
        text: 'Fine choices! Anything else?',
        next: 'choice1'
      },
      {
        id: 'upgrade',
        type: 'CONDITIONAL',
        conditions: [
          { type: 'GOLD_CHECK', amount: 50, then: 'can_upgrade' }
        ],
        default: 'no_gold'
      },
      {
        id: 'can_upgrade',
        type: 'TEXT',
        speaker: 'Tormund the Smith',
        text: 'Aye, I can reinforce your gear. 50 gold per piece. Interested?',
        next: 'upgrade_choice'
      },
      {
        id: 'upgrade_choice',
        type: 'CHOICE',
        speaker: 'Tormund the Smith',
        text: 'Which equipment would you like to upgrade?',
        choices: [
          { text: 'Upgrade my weapon (+5 ATK)', next: 'upgrade_weapon' },
          { text: 'Upgrade my armor (+5 DEF)', next: 'upgrade_armor' },
          { text: 'Maybe later.', next: 'choice1' }
        ]
      },
      {
        id: 'upgrade_weapon',
        type: 'ACTION',
        actions: [
          { type: 'TAKE_GOLD', amount: 50 },
          { type: 'MODIFY_STAT', stat: 'attack', amount: 5 }
        ],
        next: 'upgrade_done'
      },
      {
        id: 'upgrade_armor',
        type: 'ACTION',
        actions: [
          { type: 'TAKE_GOLD', amount: 50 },
          { type: 'MODIFY_STAT', stat: 'defense', amount: 5 }
        ],
        next: 'upgrade_done'
      },
      {
        id: 'upgrade_done',
        type: 'TEXT',
        speaker: 'Tormund the Smith',
        text: '*hammers away* There! Good as new, better even!',
        next: 'choice1'
      },
      {
        id: 'no_gold',
        type: 'TEXT',
        speaker: 'Tormund the Smith',
        text: 'Upgrades cost 50 gold, friend. Come back when you have the coin.',
        next: 'choice1'
      },
      {
        id: 'backstory',
        type: 'TEXT',
        speaker: 'Tormund the Smith',
        text: 'Been smithing since I was a lad. Learned from my father, who learned from his.',
        next: 'backstory2'
      },
      {
        id: 'backstory2',
        type: 'TEXT',
        speaker: 'Tormund the Smith',
        text: 'Used to forge weapons for the King\'s army. Now I prefer the quiet life.',
        next: 'choice1'
      },
      {
        id: 'bye',
        type: 'TEXT',
        speaker: 'Tormund the Smith',
        text: 'Come again! And stay safe out there.',
        next: 'end'
      },
      {
        id: 'end',
        type: 'END'
      }
    ]
  },

  // Inn keeper
  innkeeper_welcome: {
    id: 'innkeeper_welcome',
    nodes: [
      {
        id: 'start',
        type: 'TEXT',
        speaker: 'Mira the Innkeeper',
        text: 'Welcome to the Rusty Anchor! Best ale and softest beds in Millbrook.',
        next: 'services'
      },
      {
        id: 'services',
        type: 'CHOICE',
        speaker: 'Mira the Innkeeper',
        text: 'How can I help you today?',
        choices: [
          { text: 'I\'d like a room for the night. (20 gold)', next: 'rest_check' },
          { text: 'I\'ll have some food and drink. (10 gold)', next: 'food_check' },
          { text: 'Any rumors or news?', next: 'rumors' },
          { text: 'Just looking around.', next: 'bye' }
        ]
      },
      {
        id: 'rest_check',
        type: 'CONDITIONAL',
        conditions: [
          { type: 'GOLD_CHECK', amount: 20, then: 'rest' }
        ],
        default: 'no_money'
      },
      {
        id: 'rest',
        type: 'ACTION',
        actions: [
          { type: 'TAKE_GOLD', amount: 20 },
          { type: 'RESTORE_HP', amount: 9999 },
          { type: 'RESTORE_MP', amount: 9999 }
        ],
        next: 'rested'
      },
      {
        id: 'rested',
        type: 'TEXT',
        speaker: 'Mira the Innkeeper',
        text: 'Sweet dreams! *The next morning* Rise and shine! Feeling refreshed?',
        next: 'services'
      },
      {
        id: 'food_check',
        type: 'CONDITIONAL',
        conditions: [
          { type: 'GOLD_CHECK', amount: 10, then: 'food' }
        ],
        default: 'no_money'
      },
      {
        id: 'food',
        type: 'ACTION',
        actions: [
          { type: 'TAKE_GOLD', amount: 10 },
          { type: 'RESTORE_HP', amount: 25 }
        ],
        next: 'fed'
      },
      {
        id: 'fed',
        type: 'TEXT',
        speaker: 'Mira the Innkeeper',
        text: 'Here you go - fresh bread, cheese, and our famous stew. Enjoy!',
        next: 'services'
      },
      {
        id: 'no_money',
        type: 'TEXT',
        speaker: 'Mira the Innkeeper',
        text: 'Sorry, friend, but I run a business here. Come back with coin.',
        next: 'services'
      },
      {
        id: 'rumors',
        type: 'CONDITIONAL',
        conditions: [
          { type: 'FLAG_CHECK', flag: 'heard_goblin_rumor', then: 'no_new_rumors' }
        ],
        default: 'tell_rumors'
      },
      {
        id: 'tell_rumors',
        type: 'ACTION',
        actions: [
          { type: 'SET_FLAG', flag: 'heard_goblin_rumor', value: true }
        ],
        next: 'rumor_text'
      },
      {
        id: 'rumor_text',
        type: 'TEXT',
        speaker: 'Mira the Innkeeper',
        text: '*leans in close* Folk say there\'s something stirring in the old mines. Strange lights at night.',
        next: 'rumor_text2'
      },
      {
        id: 'rumor_text2',
        type: 'TEXT',
        speaker: 'Mira the Innkeeper',
        text: 'And the farmers... they\'ve been losing livestock. Some say it\'s wolves, but I\'ve seen wolf tracks. These ain\'t wolves.',
        next: 'services'
      },
      {
        id: 'no_new_rumors',
        type: 'TEXT',
        speaker: 'Mira the Innkeeper',
        text: 'Nothing new since last we talked. But keep your ears open.',
        next: 'services'
      },
      {
        id: 'bye',
        type: 'TEXT',
        speaker: 'Mira the Innkeeper',
        text: 'Don\'t be a stranger!',
        next: 'end'
      },
      {
        id: 'end',
        type: 'END'
      }
    ]
  },

  // Guard at village entrance
  guard_checkpoint: {
    id: 'guard_checkpoint',
    nodes: [
      {
        id: 'start',
        type: 'TEXT',
        speaker: 'Village Guard',
        text: 'Halt! State your business in Millbrook.',
        next: 'check_pass'
      },
      {
        id: 'check_pass',
        type: 'CONDITIONAL',
        conditions: [
          { type: 'ITEM_CHECK', itemId: 'village_pass', then: 'has_pass' },
          { type: 'FLAG_CHECK', flag: 'known_to_guards', then: 'recognized' }
        ],
        default: 'no_pass'
      },
      {
        id: 'has_pass',
        type: 'TEXT',
        speaker: 'Village Guard',
        text: 'Ah, you have the Elder\'s seal. Pass freely.',
        next: 'end'
      },
      {
        id: 'recognized',
        type: 'TEXT',
        speaker: 'Village Guard',
        text: 'Oh, it\'s you! Go on through, friend.',
        next: 'end'
      },
      {
        id: 'no_pass',
        type: 'CHOICE',
        speaker: 'Village Guard',
        text: 'You don\'t look like a local. What\'s your purpose here?',
        choices: [
          { text: 'I\'m an adventurer seeking work.', next: 'adventurer' },
          { text: 'I\'m a merchant.', next: 'merchant' },
          { text: 'None of your business!', next: 'hostile' }
        ]
      },
      {
        id: 'adventurer',
        type: 'ACTION',
        actions: [
          { type: 'SET_FLAG', flag: 'known_to_guards', value: true }
        ],
        next: 'welcome'
      },
      {
        id: 'merchant',
        type: 'ACTION',
        actions: [
          { type: 'SET_FLAG', flag: 'known_to_guards', value: true }
        ],
        next: 'welcome'
      },
      {
        id: 'welcome',
        type: 'TEXT',
        speaker: 'Village Guard',
        text: 'Fair enough. Welcome to Millbrook. Stay out of trouble.',
        next: 'end'
      },
      {
        id: 'hostile',
        type: 'TEXT',
        speaker: 'Village Guard',
        text: '*narrows eyes* I\'ll let you through this time, but I\'ll be watching you.',
        next: 'end'
      },
      {
        id: 'end',
        type: 'END'
      }
    ]
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DIALOGS };
}
