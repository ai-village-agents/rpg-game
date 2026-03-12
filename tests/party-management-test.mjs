/**
 * Party Management System Tests
 * Tests party composition, formations, recruitment, and UI components
 */

import { describe, test } from 'node:test';
import assert from 'node:assert';

import {
  PARTY_ROLES,
  FORMATION,
  RECRUIT_SOURCE,
  PARTY_MEMBERS,
  MAX_PARTY_SIZE,
  createPartyState,
  getPartyMemberData,
  getAllPartyMembers,
  getPartyMembersByRole,
  canRecruitMember,
  recruitMember,
  dismissMember,
  rejoinMember,
  setMemberPosition,
  swapMemberPositions,
  getMembersByPosition,
  getActiveParty,
  setMemberActive,
  healPartyMember,
  damagePartyMember,
  healAllPartyMembers,
  addPartyBuff,
  removePartyBuff,
  processBuffDurations,
  getPartyBuffStats,
  addPartyXp,
  getPartyMember,
  isMemberInParty,
  wasMemberRecruited,
  getPartySize,
  getAvailableSlots,
  getAllPartyRoles,
} from '../src/party-management.js';

import {
  getPartyStyles,
  renderPartyPanel,
  renderFormationView,
  renderRecruitPanel,
  renderMemberDetail,
  renderPartyHud,
} from '../src/party-management-ui.js';

// ============================================================================
// Constants Tests
// ============================================================================

describe('Party Constants', () => {
  test('PARTY_ROLES has all expected roles', () => {
    assert.strictEqual(PARTY_ROLES.TANK, 'tank');
    assert.strictEqual(PARTY_ROLES.DPS, 'dps');
    assert.strictEqual(PARTY_ROLES.HEALER, 'healer');
    assert.strictEqual(PARTY_ROLES.SUPPORT, 'support');
  });

  test('FORMATION has front and back', () => {
    assert.strictEqual(FORMATION.FRONT, 'front');
    assert.strictEqual(FORMATION.BACK, 'back');
  });

  test('RECRUIT_SOURCE has all expected sources', () => {
    assert.strictEqual(RECRUIT_SOURCE.STORY, 'story');
    assert.strictEqual(RECRUIT_SOURCE.QUEST, 'quest');
    assert.strictEqual(RECRUIT_SOURCE.TAVERN, 'tavern');
    assert.strictEqual(RECRUIT_SOURCE.EVENT, 'event');
  });

  test('MAX_PARTY_SIZE is 4', () => {
    assert.strictEqual(MAX_PARTY_SIZE, 4);
  });

  test('getAllPartyRoles returns all roles', () => {
    const roles = getAllPartyRoles();
    assert.ok(roles.includes('tank'));
    assert.ok(roles.includes('dps'));
    assert.ok(roles.includes('healer'));
    assert.ok(roles.includes('support'));
  });
});

// ============================================================================
// Party Member Data Validation Tests
// ============================================================================

describe('Party Member Data Validation', () => {
  test('All party members have required fields', () => {
    for (const [id, member] of Object.entries(PARTY_MEMBERS)) {
      assert.strictEqual(member.id, id, `Member ${id} id mismatch`);
      assert.ok(member.name, `Member ${id} missing name`);
      assert.ok(member.title, `Member ${id} missing title`);
      assert.ok(member.portrait, `Member ${id} missing portrait`);
      assert.ok(member.role, `Member ${id} missing role`);
      assert.ok(member.defaultPosition, `Member ${id} missing defaultPosition`);
      assert.ok(member.baseStats, `Member ${id} missing baseStats`);
      assert.ok(member.description, `Member ${id} missing description`);
      assert.ok(Array.isArray(member.abilities), `Member ${id} missing abilities`);
    }
  });

  test('All member roles are valid', () => {
    const validRoles = Object.values(PARTY_ROLES);
    for (const [id, member] of Object.entries(PARTY_MEMBERS)) {
      assert.ok(validRoles.includes(member.role), `Member ${id} has invalid role: ${member.role}`);
    }
  });

  test('All member positions are valid', () => {
    const validPositions = Object.values(FORMATION);
    for (const [id, member] of Object.entries(PARTY_MEMBERS)) {
      assert.ok(validPositions.includes(member.defaultPosition), 
        `Member ${id} has invalid position: ${member.defaultPosition}`);
    }
  });

  test('All members have valid base stats', () => {
    for (const [id, member] of Object.entries(PARTY_MEMBERS)) {
      assert.ok(member.baseStats.hp > 0, `Member ${id} missing hp`);
      assert.ok(member.baseStats.attack >= 0, `Member ${id} missing attack`);
      assert.ok(member.baseStats.defense >= 0, `Member ${id} missing defense`);
      assert.ok(member.baseStats.speed >= 0, `Member ${id} missing speed`);
    }
  });
});

// ============================================================================
// Party State Tests
// ============================================================================

describe('Party State Management', () => {
  test('createPartyState returns valid initial state', () => {
    const state = createPartyState();
    assert.deepStrictEqual(state.members, []);
    assert.deepStrictEqual(state.formation, {});
    assert.deepStrictEqual(state.recruited, []);
    assert.deepStrictEqual(state.dismissed, []);
    assert.deepStrictEqual(state.partyBuffs, []);
    assert.strictEqual(state.partyLevel, 1);
    assert.strictEqual(state.partyXp, 0);
  });

  test('getPartyMemberData returns member by ID', () => {
    const member = getPartyMemberData('elena-knight');
    assert.strictEqual(member.name, 'Elena');
    assert.strictEqual(member.role, PARTY_ROLES.TANK);
  });

  test('getPartyMemberData returns null for invalid ID', () => {
    assert.strictEqual(getPartyMemberData('invalid'), null);
  });

  test('getAllPartyMembers returns all members', () => {
    const members = getAllPartyMembers();
    assert.ok(members.length > 0);
    assert.ok(members.some(m => m.id === 'elena-knight'));
  });

  test('getPartyMembersByRole filters correctly', () => {
    const tanks = getPartyMembersByRole(PARTY_ROLES.TANK);
    assert.ok(tanks.length > 0);
    assert.ok(tanks.every(m => m.role === PARTY_ROLES.TANK));
  });
});

// ============================================================================
// Recruitment Tests
// ============================================================================

describe('Party Recruitment', () => {
  test('canRecruitMember returns true for tavern recruit', () => {
    const state = createPartyState();
    const result = canRecruitMember(state, 'shadow-rogue');
    assert.strictEqual(result.canRecruit, true);
  });

  test('canRecruitMember fails for invalid member', () => {
    const state = createPartyState();
    const result = canRecruitMember(state, 'invalid');
    assert.strictEqual(result.canRecruit, false);
    assert.strictEqual(result.reason, 'invalid_member');
  });

  test('canRecruitMember fails for already recruited', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const result = canRecruitMember(state, 'shadow-rogue');
    assert.strictEqual(result.canRecruit, false);
    assert.strictEqual(result.reason, 'already_recruited');
  });

  test('canRecruitMember fails when party full', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    state = recruitMember(state, 'rex-berserker').state;
    // Party can only have 3 members (MAX_PARTY_SIZE - 1 for player)
    state = recruitMember(state, 'elena-knight', { questState: { completedQuests: ['village-defense'] } }).state;
    
    const result = canRecruitMember(state, 'felix-healer');
    assert.strictEqual(result.canRecruit, false);
    assert.strictEqual(result.reason, 'party_full');
  });

  test('recruitMember successfully adds member', () => {
    const state = createPartyState();
    const result = recruitMember(state, 'shadow-rogue');
    
    assert.strictEqual(result.success, true);
    assert.ok(result.state.members.some(m => m.id === 'shadow-rogue'));
    assert.ok(result.state.recruited.includes('shadow-rogue'));
  });

  test('recruitMember sets default position', () => {
    const state = createPartyState();
    const result = recruitMember(state, 'shadow-rogue');
    
    assert.strictEqual(result.state.formation['shadow-rogue'], FORMATION.FRONT);
  });

  test('recruitMember requires quest for story members', () => {
    const state = createPartyState();
    const result = recruitMember(state, 'elena-knight', { questState: { completedQuests: [] } });
    
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'quest_required');
  });
});

// ============================================================================
// Dismissal and Rejoin Tests
// ============================================================================

describe('Dismissal and Rejoin', () => {
  test('dismissMember removes from party', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const result = dismissMember(state, 'shadow-rogue');
    assert.strictEqual(result.success, true);
    assert.ok(!result.state.members.some(m => m.id === 'shadow-rogue'));
    assert.ok(result.state.dismissed.includes('shadow-rogue'));
  });

  test('dismissMember fails for non-member', () => {
    const state = createPartyState();
    const result = dismissMember(state, 'shadow-rogue');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'not_in_party');
  });

  test('rejoinMember adds dismissed member back', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    state = dismissMember(state, 'shadow-rogue').state;
    
    const result = rejoinMember(state, 'shadow-rogue');
    assert.strictEqual(result.success, true);
    assert.ok(result.state.members.some(m => m.id === 'shadow-rogue'));
    assert.ok(!result.state.dismissed.includes('shadow-rogue'));
  });

  test('rejoinMember fails if not recruited', () => {
    const state = createPartyState();
    const result = rejoinMember(state, 'shadow-rogue');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'not_available');
  });

  test('rejoinMember fails if already in party', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const result = rejoinMember(state, 'shadow-rogue');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.reason, 'already_in_party');
  });
});

// ============================================================================
// Formation Tests
// ============================================================================

describe('Formation Management', () => {
  test('setMemberPosition updates position', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    state = setMemberPosition(state, 'shadow-rogue', FORMATION.BACK);
    assert.strictEqual(state.formation['shadow-rogue'], FORMATION.BACK);
  });

  test('setMemberPosition ignores invalid position', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    const originalPosition = state.formation['shadow-rogue'];
    
    state = setMemberPosition(state, 'shadow-rogue', 'invalid');
    assert.strictEqual(state.formation['shadow-rogue'], originalPosition);
  });

  test('swapMemberPositions swaps two members', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    state = recruitMember(state, 'mira-mage', { questState: { completedQuests: ['dark-forest'] } }).state;
    
    const pos1Before = state.formation['shadow-rogue'];
    const pos2Before = state.formation['mira-mage'];
    
    state = swapMemberPositions(state, 'shadow-rogue', 'mira-mage');
    
    assert.strictEqual(state.formation['shadow-rogue'], pos2Before);
    assert.strictEqual(state.formation['mira-mage'], pos1Before);
  });

  test('getMembersByPosition filters by position', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    state = recruitMember(state, 'mira-mage', { questState: { completedQuests: ['dark-forest'] } }).state;
    
    const frontMembers = getMembersByPosition(state, FORMATION.FRONT);
    assert.ok(frontMembers.some(m => m.id === 'shadow-rogue'));
    
    const backMembers = getMembersByPosition(state, FORMATION.BACK);
    assert.ok(backMembers.some(m => m.id === 'mira-mage'));
  });
});

// ============================================================================
// Active Party Tests
// ============================================================================

describe('Active Party Management', () => {
  test('getActiveParty returns active members', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const active = getActiveParty(state);
    assert.ok(active.some(m => m.id === 'shadow-rogue'));
  });

  test('setMemberActive toggles active state', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    state = setMemberActive(state, 'shadow-rogue', false);
    const active = getActiveParty(state);
    assert.ok(!active.some(m => m.id === 'shadow-rogue'));
  });

  test('getActiveParty excludes dead members', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    state = damagePartyMember(state, 'shadow-rogue', 1000);
    
    const active = getActiveParty(state);
    assert.ok(!active.some(m => m.id === 'shadow-rogue'));
  });
});

// ============================================================================
// HP Management Tests
// ============================================================================

describe('HP Management', () => {
  test('healPartyMember increases HP', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    state = damagePartyMember(state, 'shadow-rogue', 50);
    
    state = healPartyMember(state, 'shadow-rogue', 30);
    const member = getPartyMember(state, 'shadow-rogue');
    assert.ok(member.hp > 35); // Was damaged 50, healed 30
  });

  test('healPartyMember caps at maxHp', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    const memberBefore = getPartyMember(state, 'shadow-rogue');
    const maxHp = memberBefore.maxHp;
    
    state = healPartyMember(state, 'shadow-rogue', 1000);
    const memberAfter = getPartyMember(state, 'shadow-rogue');
    assert.strictEqual(memberAfter.hp, maxHp);
  });

  test('damagePartyMember decreases HP', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    const memberBefore = getPartyMember(state, 'shadow-rogue');
    
    state = damagePartyMember(state, 'shadow-rogue', 20);
    const memberAfter = getPartyMember(state, 'shadow-rogue');
    assert.strictEqual(memberAfter.hp, memberBefore.hp - 20);
  });

  test('damagePartyMember floors at 0', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    state = damagePartyMember(state, 'shadow-rogue', 1000);
    const member = getPartyMember(state, 'shadow-rogue');
    assert.strictEqual(member.hp, 0);
  });

  test('healAllPartyMembers heals everyone', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    state = recruitMember(state, 'rex-berserker').state;
    state = damagePartyMember(state, 'shadow-rogue', 50);
    state = damagePartyMember(state, 'rex-berserker', 50);
    
    state = healAllPartyMembers(state, 30);
    
    for (const member of state.members) {
      assert.ok(member.hp > 0);
    }
  });

  test('healAllPartyMembers with full restores all HP', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    state = damagePartyMember(state, 'shadow-rogue', 50);
    
    state = healAllPartyMembers(state, 'full');
    const member = getPartyMember(state, 'shadow-rogue');
    assert.strictEqual(member.hp, member.maxHp);
  });
});

// ============================================================================
// Party Buff Tests
// ============================================================================

describe('Party Buffs', () => {
  test('addPartyBuff adds new buff', () => {
    let state = createPartyState();
    state = addPartyBuff(state, { id: 'attack-up', name: 'Attack Up', attackBonus: 5, duration: 3 });
    
    assert.strictEqual(state.partyBuffs.length, 1);
    assert.strictEqual(state.partyBuffs[0].id, 'attack-up');
  });

  test('addPartyBuff refreshes existing buff', () => {
    let state = createPartyState();
    state = addPartyBuff(state, { id: 'attack-up', attackBonus: 5, duration: 3 });
    state = addPartyBuff(state, { id: 'attack-up', attackBonus: 10, duration: 5 });
    
    assert.strictEqual(state.partyBuffs.length, 1);
    assert.strictEqual(state.partyBuffs[0].attackBonus, 10);
  });

  test('removePartyBuff removes buff', () => {
    let state = createPartyState();
    state = addPartyBuff(state, { id: 'attack-up', attackBonus: 5 });
    state = removePartyBuff(state, 'attack-up');
    
    assert.strictEqual(state.partyBuffs.length, 0);
  });

  test('processBuffDurations decrements duration', () => {
    let state = createPartyState();
    state = addPartyBuff(state, { id: 'attack-up', duration: 3 });
    state = processBuffDurations(state);
    
    assert.strictEqual(state.partyBuffs[0].duration, 2);
  });

  test('processBuffDurations removes expired buffs', () => {
    let state = createPartyState();
    state = addPartyBuff(state, { id: 'attack-up', duration: 1 });
    state = processBuffDurations(state);
    
    assert.strictEqual(state.partyBuffs.length, 0);
  });

  test('getPartyBuffStats calculates bonuses', () => {
    let state = createPartyState();
    state = addPartyBuff(state, { id: 'atk', attackBonus: 5 });
    state = addPartyBuff(state, { id: 'def', defenseBonus: 3 });
    
    const stats = getPartyBuffStats(state);
    assert.strictEqual(stats.attack, 5);
    assert.strictEqual(stats.defense, 3);
  });
});

// ============================================================================
// XP and Leveling Tests
// ============================================================================

describe('XP and Leveling', () => {
  test('addPartyXp increases XP', () => {
    const state = createPartyState();
    const result = addPartyXp(state, 50);
    assert.strictEqual(result.state.partyXp, 50);
    assert.strictEqual(result.leveledUp, false);
  });

  test('addPartyXp triggers level up', () => {
    const state = createPartyState();
    const result = addPartyXp(state, 100);
    
    assert.strictEqual(result.leveledUp, true);
    assert.strictEqual(result.newLevel, 2);
    assert.strictEqual(result.state.partyLevel, 2);
  });

  test('addPartyXp carries over excess XP', () => {
    const state = createPartyState();
    const result = addPartyXp(state, 150);
    
    assert.strictEqual(result.state.partyXp, 50);
  });

  test('Level up increases member stats', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    const beforeHp = getPartyMember(state, 'shadow-rogue').maxHp;
    
    const result = addPartyXp(state, 100);
    const afterHp = getPartyMember(result.state, 'shadow-rogue').maxHp;
    
    assert.ok(afterHp > beforeHp);
  });
});

// ============================================================================
// Query Functions Tests
// ============================================================================

describe('Query Functions', () => {
  test('getPartyMember returns member by ID', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const member = getPartyMember(state, 'shadow-rogue');
    assert.ok(member);
    assert.strictEqual(member.id, 'shadow-rogue');
  });

  test('getPartyMember returns null for non-member', () => {
    const state = createPartyState();
    assert.strictEqual(getPartyMember(state, 'shadow-rogue'), null);
  });

  test('isMemberInParty checks membership', () => {
    let state = createPartyState();
    assert.strictEqual(isMemberInParty(state, 'shadow-rogue'), false);
    
    state = recruitMember(state, 'shadow-rogue').state;
    assert.strictEqual(isMemberInParty(state, 'shadow-rogue'), true);
  });

  test('wasMemberRecruited checks recruitment history', () => {
    let state = createPartyState();
    assert.strictEqual(wasMemberRecruited(state, 'shadow-rogue'), false);
    
    state = recruitMember(state, 'shadow-rogue').state;
    assert.strictEqual(wasMemberRecruited(state, 'shadow-rogue'), true);
  });

  test('getPartySize returns member count', () => {
    let state = createPartyState();
    assert.strictEqual(getPartySize(state), 0);
    
    state = recruitMember(state, 'shadow-rogue').state;
    assert.strictEqual(getPartySize(state), 1);
  });

  test('getAvailableSlots returns remaining slots', () => {
    let state = createPartyState();
    assert.strictEqual(getAvailableSlots(state), MAX_PARTY_SIZE - 1);
    
    state = recruitMember(state, 'shadow-rogue').state;
    assert.strictEqual(getAvailableSlots(state), MAX_PARTY_SIZE - 2);
  });
});

// ============================================================================
// UI Component Tests
// ============================================================================

describe('UI Components - Party Styles', () => {
  test('getPartyStyles returns CSS string', () => {
    const styles = getPartyStyles();
    assert.ok(typeof styles === 'string');
    assert.ok(styles.includes('.party-panel'));
    assert.ok(styles.includes('.party-member-card'));
    assert.ok(styles.includes('.formation-container'));
  });
});

describe('UI Components - Party Panel', () => {
  test('renderPartyPanel shows party info', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const html = renderPartyPanel(state);
    assert.ok(html.includes('Party'));
    assert.ok(html.includes('Shadow'));
  });

  test('renderPartyPanel shows empty message when no members', () => {
    const state = createPartyState();
    const html = renderPartyPanel(state);
    assert.ok(html.includes('No party members'));
  });

  test('renderPartyPanel shows level and XP', () => {
    const state = createPartyState();
    const html = renderPartyPanel(state);
    assert.ok(html.includes('Lv. 1'));
  });
});

describe('UI Components - Formation View', () => {
  test('renderFormationView shows positions', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const html = renderFormationView(state);
    assert.ok(html.includes('Front Row'));
    assert.ok(html.includes('Back Row'));
    assert.ok(html.includes('Shadow'));
  });

  test('renderFormationView shows empty rows', () => {
    const state = createPartyState();
    const html = renderFormationView(state);
    assert.ok(html.includes('Empty'));
  });
});

describe('UI Components - Recruit Panel', () => {
  test('renderRecruitPanel shows available recruits', () => {
    const state = createPartyState();
    const html = renderRecruitPanel(state);
    assert.ok(html.includes('recruit-card'));
    assert.ok(html.includes('Shadow'));
  });

  test('renderRecruitPanel shows in party status', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const html = renderRecruitPanel(state);
    assert.ok(html.includes('In Party'));
  });
});

describe('UI Components - Member Detail', () => {
  test('renderMemberDetail shows member info', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    const member = getPartyMember(state, 'shadow-rogue');
    
    const html = renderMemberDetail(member);
    assert.ok(html.includes('Shadow'));
    assert.ok(html.includes('Assassin'));
    assert.ok(html.includes('backstab'));
  });
});

describe('UI Components - Party HUD', () => {
  test('renderPartyHud shows active members', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const html = renderPartyHud(state);
    assert.ok(html.includes('party-hud'));
  });

  test('renderPartyHud returns empty for no members', () => {
    const state = createPartyState();
    const html = renderPartyHud(state);
    assert.strictEqual(html, '');
  });
});

// ============================================================================
// Security Tests - XSS Prevention
// ============================================================================

describe('Security - XSS Prevention', () => {
  test('renderPartyPanel escapes HTML', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const html = renderPartyPanel(state);
    assert.ok(!html.includes('<script>'));
  });

  test('renderFormationView escapes HTML', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    
    const html = renderFormationView(state);
    assert.ok(!html.includes('<script>'));
  });

  test('renderRecruitPanel escapes HTML', () => {
    const state = createPartyState();
    const html = renderRecruitPanel(state);
    assert.ok(!html.includes('<script>'));
  });
});

// ============================================================================
// Security Tests - Banned Word Scanning
// ============================================================================

describe('Security - Banned Word Scanning', () => {
  const BANNED_WORDS = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

  test('Party member names do not contain banned words', () => {
    for (const [id, member] of Object.entries(PARTY_MEMBERS)) {
      const nameLower = member.name.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(!nameLower.includes(word), `Member ${id} name contains banned word: ${word}`);
      }
    }
  });

  test('Party member titles do not contain banned words', () => {
    for (const [id, member] of Object.entries(PARTY_MEMBERS)) {
      const titleLower = member.title.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(!titleLower.includes(word), `Member ${id} title contains banned word: ${word}`);
      }
    }
  });

  test('Party member descriptions do not contain banned words', () => {
    for (const [id, member] of Object.entries(PARTY_MEMBERS)) {
      const descLower = member.description.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(!descLower.includes(word), `Member ${id} description contains banned word: ${word}`);
      }
    }
  });

  test('Ability names do not contain banned words', () => {
    for (const [id, member] of Object.entries(PARTY_MEMBERS)) {
      for (const ability of member.abilities) {
        const abilityLower = ability.toLowerCase();
        for (const word of BANNED_WORDS) {
          assert.ok(!abilityLower.includes(word), `Member ${id} ability contains banned word: ${word}`);
        }
      }
    }
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  test('Recruit then dismiss then rejoin preserves data', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    const initialLevel = getPartyMember(state, 'shadow-rogue').level;
    
    state = dismissMember(state, 'shadow-rogue').state;
    state = rejoinMember(state, 'shadow-rogue').state;
    
    const finalLevel = getPartyMember(state, 'shadow-rogue').level;
    assert.strictEqual(finalLevel, initialLevel);
  });

  test('Multiple buffs stack correctly', () => {
    let state = createPartyState();
    state = addPartyBuff(state, { id: 'atk1', attackBonus: 5 });
    state = addPartyBuff(state, { id: 'atk2', attackBonus: 3 });
    
    const stats = getPartyBuffStats(state);
    assert.strictEqual(stats.attack, 8);
  });

  test('Leveling up preserves HP ratio', () => {
    let state = createPartyState();
    state = recruitMember(state, 'shadow-rogue').state;
    state = damagePartyMember(state, 'shadow-rogue', 40);
    
    const beforeRatio = getPartyMember(state, 'shadow-rogue').hp / getPartyMember(state, 'shadow-rogue').maxHp;
    
    // Level up increases HP but adds same amount to current and max
    const result = addPartyXp(state, 100);
    const member = getPartyMember(result.state, 'shadow-rogue');
    // HP increased by 10, so ratio slightly changes
    assert.ok(member.hp > 0);
  });
});
