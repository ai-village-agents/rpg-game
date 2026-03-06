import { saveToLocalStorage } from './state.js';
import { CLASS_DEFINITIONS } from './characters/classes.js';
import { DEFAULT_WORLD_DATA, getRoomExits } from './map.js';
import { getCategorizedInventory, getEquipmentDisplay, getItemDetails, INVENTORY_SCREENS, EQUIPMENT_SLOTS, getEquipmentBonuses } from './inventory.js';
import { getEffectiveCombatStats, getEquipmentBonusDisplay, hasEquipmentBonuses } from './combat/equipment-bonuses.js';
import { getCurrentLevelUp, getStatDiffs, formatStatName, xpForNextLevel } from './level-up.js';
import { getNPCsInRoom, getCurrentDialogLine, getDialogProgress } from './npc-dialog.js';
import { getActiveQuestsSummary, getAvailableQuestsInRoom } from './quest-integration.js';
import { getAbilityDisplayInfo } from './combat/abilities.js';
import { items as itemsData, rarityColors } from './data/items.js';
import { renderStatusEffectsRow, getStatusEffectStyles } from './status-effect-ui.js';
import { getMinimapStyles, renderMinimap } from './minimap.js';
import { renderStatsPanel, getStatsPanelStyles } from './stats-display.js';
import { renderSaveSlotsList, getSaveSlotsStyles } from './save-slots-ui.js';
import { renderSettingsPanel, getSettingsStyles, attachSettingsHandlers } from './settings-ui.js';
import { renderQuestRewardScreen, renderQuestRewardActions, attachQuestRewardHandlers, getQuestRewardStyles } from './quest-rewards-ui.js';
import { renderShopPanel, getShopStyles, attachShopHandlers } from './shop-ui.js';
import { renderCraftingPanel, getCraftingStyles, attachCraftingHandlers } from './crafting-ui.js';
import { renderTalentTree, getTalentTreeStyles, attachTalentHandlers } from './talents-ui.js';
import { renderWorldEventBanner } from './world-events-ui.js';
import { hasShop } from './shop.js';

function hpLine(entity) {
  const pct = Math.round((entity.hp / entity.maxHp) * 100);
  const status = entity.hp <= 0 ? 'bad' : (pct <= 25 ? 'bad' : (pct >= 75 ? 'good' : ''));
  return `<span class="${status}">${entity.hp}</span> / ${entity.maxHp}`;
}

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function inventorySummary(player) {
  const inv = player?.inventory || {};
  const entries = Object.entries(inv)
    .filter(([, count]) => count > 0)
    .map(([item, count]) => `<div>${esc(item)}</div><div><b>${count}</b></div>`)
    .join('');
  const gold = player?.gold ?? 0;
  return entries + `<div>Gold</div><div><b>${gold}</b></div>`;
}

function renderMapPanel(state, dispatch) {
  if (!state.world) return '';

  const { roomRow, roomCol } = state.world;
  const rooms = DEFAULT_WORLD_DATA.rooms;
  const exits = getRoomExits(state.world);
  const currentRoom = rooms[roomRow]?.[roomCol];
  const roomName = currentRoom?.name ?? 'Unknown';

  // Build 3x3 ASCII world overview grid
  const gridRows = rooms.map((row, r) =>
    row.map((room, c) => {
      const isCurrent = r === roomRow && c === roomCol;
      const label = room.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
      if (isCurrent) {
        return `<span class="map-cur" title="${esc(room.name)}">[${esc(label)}]</span>`;
      }
      return `<span class="map-room" title="${esc(room.name)}">&nbsp;${esc(label)}&nbsp;</span>`;
    }).join('<span class="map-sep">|</span>')
  ).map(row => `<div class="map-row">${row}</div>`).join('<div class="map-div">---+---+---</div>');

  const exitBtns = ['north', 'south', 'west', 'east']
    .filter(d => exits.includes(d))
    .map(d => {
      const label = { north: 'N', south: 'S', west: 'W', east: 'E' }[d];
      return `<button class="move-btn" data-dir="${d}">${label}</button>`;
    }).join('');

  const controlsHtml = state.phase === 'exploration'
    ? `<div class="map-controls">${exitBtns}</div>`
    : '';

  return `
    <div class="card map-panel">
      <h2>World Map</h2>
      <div class="map-grid">${gridRows}</div>
      <div class="map-info">
        <b>Location:</b> ${esc(roomName)}<br>
        <b>Exits:</b> ${exits.length ? exits.join(', ') : 'none'}
      </div>
      ${controlsHtml}
    </div>
  `;
}

const RENDER_ROOM_ID_MAP = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];

export function render(state, dispatch) {
  const hud = document.getElementById('hud');
  const actions = document.getElementById('actions');
  const log = document.getElementById('log');

  // Inject status effect styles once
  if (!document.getElementById('status-effect-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'status-effect-styles';
    styleEl.textContent = getStatusEffectStyles();
    document.head.appendChild(styleEl);
  }

  if (!document.getElementById('minimap-styles')) {
    const minimapStyleEl = document.createElement('style');
    minimapStyleEl.id = 'minimap-styles';
    minimapStyleEl.textContent = getMinimapStyles();
    document.head.appendChild(minimapStyleEl);
  }

  if (!document.getElementById('stats-panel-styles')) {
    const statsPanelStyleEl = document.createElement('style');
    statsPanelStyleEl.id = 'stats-panel-styles';
    statsPanelStyleEl.textContent = getStatsPanelStyles();
    document.head.appendChild(statsPanelStyleEl);
  }

  if (!document.getElementById('crafting-styles')) {
    const craftingStyleEl = document.createElement('style');
    craftingStyleEl.id = 'crafting-styles';
    craftingStyleEl.textContent = getCraftingStyles();
    document.head.appendChild(craftingStyleEl);
  }

  if (!document.getElementById('talent-tree-styles')) {
    const talentStyleEl = document.createElement('style');
    talentStyleEl.id = 'talent-tree-styles';
    talentStyleEl.textContent = getTalentTreeStyles();
    document.head.appendChild(talentStyleEl);
  }

  // --- Class Select Phase ---
  if (state.phase === 'class-select') {
    const order = ['warrior', 'mage', 'rogue', 'cleric'];
    const cards = order.map((classId) => {
      const def = CLASS_DEFINITIONS[classId];
      if (!def) return '';
      return `
        <div class="card">
          <h2>${esc(def.name)}</h2>
          <div>${esc(def.description)}</div>
          <div class="kv">
            <div>HP</div><div><b>${def.baseStats.hp}</b></div>
            <div>ATK</div><div><b>${def.baseStats.atk}</b></div>
            <div>DEF</div><div><b>${def.baseStats.def}</b></div>
            <div>SPD</div><div><b>${def.baseStats.spd}</b></div>
            <div>INT</div><div><b>${def.baseStats.int}</b></div>
          </div>
          <button data-class="${esc(def.id)}">Choose ${esc(def.name)}</button>
        </div>
      `;
    }).join('');

    hud.innerHTML = `<div class="row">${cards}</div>`;
    actions.innerHTML = '';

    hud.querySelectorAll('button[data-class]').forEach((button) => {
      button.onclick = () => dispatch({ type: 'SELECT_CLASS', classId: button.dataset.class });
    });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => `<div class="logLine">${esc(line)}</div>`)
      .join('');
    return;
  }

  // --- Exploration Phase ---
  if (state.phase === 'exploration') {
    const mapHtml = renderMapPanel(state, dispatch);
    const exploreRoomId = RENDER_ROOM_ID_MAP[state.world?.roomRow]?.[state.world?.roomCol] ?? null;
    const exploreNpcs = exploreRoomId ? getNPCsInRoom(exploreRoomId) : [];
    const npcListHtml = exploreNpcs.length > 0
      ? exploreNpcs.map(n => `<button class="npc-talk-btn" data-npcid="${esc(n.id)}">${esc(n.name)}</button>`).join('')
      : '<em>No one is here.</em>';
    hud.innerHTML = `
      ${renderWorldEventBanner(state.worldEvent || null)}
      <div class="row">
        <div class="card">
          <h2>${esc(state.player.name)}</h2>
          <div class="kv">
            <div>Class</div><div><b>${esc(state.player.classId ? state.player.classId[0].toUpperCase() + state.player.classId.slice(1) : 'Adventurer')}</b></div>
            <div>HP</div><div><b>${hpLine(state.player)}</b></div>
            <div>Level</div><div><b>${state.player.level ?? 1}</b></div>
            <div>XP</div><div><b>${state.player.xp ?? 0}</b></div>
          </div>
        </div>

        <div class="card">
          <h2>Inventory</h2>
          <div class="kv">
            ${inventorySummary(state.player)}
          </div>
        </div>

        ${mapHtml}

        ${renderMinimap(state.world, state.visitedRooms || [])}

        <div class="card">
          <h2>People Here</h2>
          <div class="npc-list">${npcListHtml}</div>
        </div>
      </div>
    `;

    // Attach map movement button listeners
    hud.querySelectorAll('.move-btn').forEach((btn) => {
      btn.onclick = () => dispatch({ type: 'EXPLORE', direction: btn.dataset.dir });
    });

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnNorth">North</button>
        <button id="btnSouth">South</button>
        <button id="btnWest">West</button>
        <button id="btnEast">East</button>
        <button id="btnSeek">Seek Battle</button>
        <button id="btnInventory">Inventory</button>
        <button id="btnQuests">Quests 📜</button>
        <button id="btnViewStats">Stats 📊</button>
        <button id="btnSaveSlots">Save/Load 💾</button>
        <button id="btnSettings">Settings ⚙️</button>
        <button id="btnCrafting">Crafting 🔨</button>
        <button id="btnTalents">Talents ⭐</button>
      </div>
    `;

    document.getElementById('btnNorth').onclick = () => dispatch({ type: 'EXPLORE', direction: 'north' });
    document.getElementById('btnSouth').onclick = () => dispatch({ type: 'EXPLORE', direction: 'south' });
    document.getElementById('btnWest').onclick = () => dispatch({ type: 'EXPLORE', direction: 'west' });
    document.getElementById('btnEast').onclick = () => dispatch({ type: 'EXPLORE', direction: 'east' });
    document.getElementById('btnSeek').onclick = () => dispatch({ type: 'SEEK_ENCOUNTER' });
    document.getElementById('btnInventory').onclick = () => dispatch({ type: 'VIEW_INVENTORY' });
    document.getElementById('btnQuests').onclick = () => dispatch({ type: 'VIEW_QUESTS' });
    document.getElementById('btnViewStats').onclick = () => dispatch({ type: 'VIEW_STATS' });
    document.getElementById('btnSaveSlots').onclick = () => dispatch({ type: 'SAVE_SLOTS' });
    document.getElementById('btnSettings').onclick = () => dispatch({ type: 'VIEW_SETTINGS' });
    document.getElementById('btnCrafting').onclick = () => dispatch({ type: 'VIEW_CRAFTING' });
    document.getElementById('btnTalents').onclick = () => dispatch({ type: 'VIEW_TALENTS' });

    hud.querySelectorAll('.npc-talk-btn').forEach((btn) => {
      btn.onclick = () => dispatch({ type: 'TALK_TO_NPC', npcId: btn.dataset.npcid });
    });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => `<div class="logLine">${esc(line)}</div>`)
      .join('');
    return;
  }

  // --- Combat Phases (player-turn, enemy-turn) ---
  if (state.phase === 'player-turn' || state.phase === 'enemy-turn') {
    hud.innerHTML = `
      <div class="row">
        <div class="card">
          <h2>Player</h2>
          <div class="kv">
            <div>HP</div><div><b>${hpLine(state.player)}</b></div>
            <div>MP</div><div><b>${state.player.mp ?? 0} / ${state.player.maxMp ?? 0}</b></div>
            <div>ATK / DEF</div><div><b>${(() => {
              const eqStats = getEffectiveCombatStats(state.player);
              const eqBon = getEquipmentBonusDisplay(state.player);
              const atkStr = eqBon.attack ? eqStats.atk + ' <span style="color:#4f4">(+' + eqBon.attack + ')</span>' : '' + state.player.atk;
              const defStr = eqBon.defense ? eqStats.def + ' <span style="color:#4f4">(+' + eqBon.defense + ')</span>' : '' + state.player.def;
              return atkStr + ' / ' + defStr;
            })()}</b></div>
            <div>Defending</div><div><b>${state.player.defending ? 'Yes' : 'No'}</b></div>
            ${renderStatusEffectsRow(state.player.statusEffects ?? [])}
            <div>Potions</div><div><b>${state.player.inventory.potion ?? 0}</b></div>
          </div>
        </div>

        <div class="card">
          <h2>Enemy</h2>
          <div class="kv">
            <div>Name</div><div><b>${esc(state.enemy.name)}</b></div>
            <div>HP</div><div><b>${hpLine(state.enemy)}</b></div>
            <div>ATK / DEF</div><div><b>${state.enemy.atk}</b> / <b>${state.enemy.def}</b></div>
            <div>Defending</div><div><b>${state.enemy.defending ? 'Yes' : 'No'}</b></div>
            ${renderStatusEffectsRow(state.enemy.statusEffects ?? [])}
          </div>
        </div>

        <div class="card">
          <h2>Combat</h2>
          <div class="kv">
            <div>Phase</div><div><b>${esc(state.phase)}</b></div>
            <div>Turn</div><div><b>${state.turn}</b></div>
          </div>
        </div>
      </div>
    `;

    const isPlayerTurn = state.phase === 'player-turn';

    // Build ability buttons
    const playerAbilities = state.player.abilities ?? [];
    const abilityInfos = getAbilityDisplayInfo(playerAbilities, state.player.mp ?? 0);
    const abilityBtns = abilityInfos.map(a =>
      `<button class="ability-btn" data-ability="${esc(a.id)}" ${(!isPlayerTurn || !a.canUse) ? 'disabled' : ''} title="${esc(a.description)}">${esc(a.name)} (${a.mpCost} MP)</button>`
    ).join('');

    // Build combat item buttons from real inventory consumables
    const playerInv = state.player.inventory || {};
    const combatItemBtns = Object.entries(playerInv)
      .filter(([id, count]) => count > 0 && itemsData[id] && itemsData[id].type === 'consumable')
      .map(([id, count]) => {
        const item = itemsData[id];
        return `<button class="item-btn" data-item="${esc(id)}" ${!isPlayerTurn ? 'disabled' : ''} title="${esc(item.description)}">${esc(item.name)} (${count})</button>`;
      }).join('');

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnAttack" ${!isPlayerTurn ? 'disabled' : ''}>Attack</button>
        <button id="btnDefend" ${!isPlayerTurn ? 'disabled' : ''}>Defend</button>
        <button id="btnPotion" ${!isPlayerTurn ? 'disabled' : ''}>Use Potion</button>
        ${abilityBtns}
      </div>
      ${combatItemBtns ? '<div class="buttons item-buttons"><b>Items:</b> ' + combatItemBtns + '</div>' : ''}
    `;

    document.getElementById('btnAttack').onclick = () => dispatch({ type: 'PLAYER_ATTACK' });
    document.getElementById('btnDefend').onclick = () => dispatch({ type: 'PLAYER_DEFEND' });
    document.getElementById('btnPotion').onclick = () => dispatch({ type: 'PLAYER_POTION' });

    // Wire ability buttons
    actions.querySelectorAll('.ability-btn').forEach(btn => {
      btn.onclick = () => dispatch({ type: 'PLAYER_ABILITY', abilityId: btn.dataset.ability });
    });

    // Wire combat item buttons
    actions.querySelectorAll('.item-btn').forEach(btn => {
      btn.onclick = () => dispatch({ type: 'PLAYER_ITEM', itemId: btn.dataset.item });
    });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => `<div class="logLine">${esc(line)}</div>`)
      .join('');
    return;
  }

  // --- Level-Up Phase ---
  if (state.phase === 'level-up' && state.levelUpState) {
    const current = getCurrentLevelUp(state.levelUpState);
    if (current) {
      const diffs = getStatDiffs(current.oldStats, current.newStats);
      const diffRows = diffs.map(d => {
        const sign = d.diff > 0 ? '+' : '';
        return '<div>' + esc(formatStatName(d.stat)) + '</div><div><b>' + d.oldValue + '</b> \u2192 <b class="good">' + d.newValue + '</b> <span class="good">(' + sign + d.diff + ')</span></div>';
      }).join('');

      const nextXp = xpForNextLevel(current.newLevel);
      const nextXpText = nextXp > 0 ? 'Next level at ' + nextXp + ' XP' : 'MAX LEVEL';
      const queueInfo = state.levelUpState.levelUps.length > 1
        ? ' (' + (state.levelUpState.currentIndex + 1) + '/' + state.levelUpState.levelUps.length + ')'
        : '';

      hud.innerHTML = '<div class="row">' +
        '<div class="card">' +
          '<h2 class="good">\u2B50 Level Up!' + esc(queueInfo) + '</h2>' +
          '<div class="kv">' +
            '<div>Character</div><div><b>' + esc(current.name) + '</b></div>' +
            '<div>Class</div><div><b>' + esc(current.classId ? current.classId[0].toUpperCase() + current.classId.slice(1) : '') + '</b></div>' +
            '<div>Level</div><div><b>' + current.oldLevel + '</b> \u2192 <b class="good">' + current.newLevel + '</b></div>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<h2>Stat Growth</h2>' +
          '<div class="kv">' + diffRows + '</div>' +
          '<div style="margin-top:8px;opacity:0.7">' + esc(nextXpText) + '</div>' +
        '</div>' +
      '</div>';

      const btnLabel = state.levelUpState.currentIndex < state.levelUpState.levelUps.length - 1
        ? 'Next Level Up' : 'Continue';

      actions.innerHTML = '<div class="buttons">' +
        '<button id="btnLevelUpContinue">' + esc(btnLabel) + '</button>' +
      '</div>';

      document.getElementById('btnLevelUpContinue').onclick = () => dispatch({ type: 'LEVEL_UP_CONTINUE' });

      log.innerHTML = state.log
        .slice()
        .reverse()
        .map(line => '<div class="logLine">' + esc(line) + '</div>')
        .join('');
      return;
    }
  }

  if (state.phase === 'battle-summary') {
    const bs = state.battleSummary ?? {};
    const hasLevelUps = bs.levelUps && bs.levelUps.length > 0;
    const lootedItems = bs.lootedItems ?? [];
    const levelUpLines = (bs.levelUps ?? []).map(lu => {
      const name = lu.memberName ?? lu.name ?? 'Unknown';
      return esc(name) + ' reached level ' + lu.newLevel + '! ⭐';
    });
    const lootHtml = lootedItems.length > 0
      ? lootedItems.map(item => {
          const n = typeof item === 'string' ? item : (item.name ?? item.id ?? 'Item');
          return '<div>📦 ' + esc(n) + '</div>';
        }).join('')
      : '<div><em>No items looted.</em></div>';
    const levelUpHtml = hasLevelUps
      ? levelUpLines.map(l => '<div class="good">⭐ ' + l + '</div>').join('')
      : '';
    hud.innerHTML = `
      <div class="row">
        <div class="card">
          <h2 class="good">⚔️ Battle Won!</h2>
          <div class="kv">
            <div>Defeated</div><div><b>${esc(bs.enemyName ?? 'Unknown')}</b></div>
            <div>XP Gained</div><div><b class="good">+${bs.xpGained ?? 0}</b></div>
            <div>Gold Earned</div><div><b class="good">+${bs.goldGained ?? 0}</b></div>
          </div>
        </div>
        <div class="card">
          <h2>Loot</h2>
          ${lootHtml}
          ${levelUpHtml ? '<h3 class="good">Level Up!</h3>' + levelUpHtml : ''}
        </div>
      </div>
    `;
    actions.innerHTML = '<div class="buttons"><button id="btnContinueAfterBattle">Continue →</button></div>';
    document.getElementById('btnContinueAfterBattle').onclick = () => dispatch({ type: 'CONTINUE_AFTER_BATTLE' });
    log.innerHTML = state.log.slice().reverse().map(line => '<div class="logLine">' + esc(line) + '</div>').join('');
    return;
  }

    // --- Victory Phase ---
  if (state.phase === 'victory') {
    const xpGained = state.xpGained ?? 0;
    const goldGained = state.goldGained ?? 0;

    hud.innerHTML = `
      <div class="row">
        <div class="card">
          <h2>Victory!</h2>
          <div class="kv">
            <div>XP Gained</div><div><b class="good">${xpGained}</b></div>
            <div>Gold Gained</div><div><b class="good">${goldGained}</b></div>
            <div>Total XP</div><div><b>${state.player.xp ?? 0}</b></div>
            <div>Total Gold</div><div><b>${state.player.gold ?? 0}</b></div>
          </div>
        </div>

        <div class="card">
          <h2>${esc(state.player.name)}</h2>
          <div class="kv">
            <div>HP</div><div><b>${hpLine(state.player)}</b></div>
            <div>Level</div><div><b>${state.player.level ?? 1}</b></div>
            <div>Potions</div><div><b>${state.player.inventory.potion ?? 0}</b></div>
          </div>
        </div>
      </div>
    `;

    const hasLevelUps = state.pendingLevelUps && state.pendingLevelUps.length > 0;
    const levelUpBtn = hasLevelUps
      ? '<button id="btnViewLevelUps" class="good">View Level Ups \u2B50</button>'
      : '';

    actions.innerHTML = `
      <div class="buttons">
        ${levelUpBtn}
        <button id="btnContinue">Continue Exploring</button>
        <button id="btnSave">Save</button>
      </div>
    `;

    if (hasLevelUps) {
      document.getElementById('btnViewLevelUps').onclick = () => dispatch({ type: 'VIEW_LEVEL_UPS' });
    }
    document.getElementById('btnContinue').onclick = () => dispatch({ type: 'CONTINUE_EXPLORING' });
    document.getElementById('btnSave').onclick = () => dispatch({ type: 'SAVE' });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => `<div class="logLine">${esc(line)}</div>`)
      .join('');
    return;
  }

  // --- Defeat Phase ---
  if (state.phase === 'defeat') {
    hud.innerHTML = `
      <div class="row">
        <div class="card">
          <h2 class="bad">Defeat</h2>
          <div class="kv">
            <div>HP</div><div><b class="bad">0 / ${state.player.maxHp}</b></div>
            <div>Slain by</div><div><b>${esc(state.enemy?.name ?? 'Unknown')}</b></div>
          </div>
        </div>
        ${renderStatsPanel(state.gameStats ?? {}, { title: 'Run Statistics' })}
      </div>
    `;

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnTryAgain">Try Again</button>
        <button id="btnLoad">Load Save</button>
      </div>
    `;

    document.getElementById('btnTryAgain').onclick = () => dispatch({ type: 'TRY_AGAIN' });
    document.getElementById('btnLoad').onclick = () => dispatch({ type: 'LOAD' });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => `<div class="logLine">${esc(line)}</div>`)
      .join('');
    return;
  }

  // --- Stats Phase ---
  if (state.phase === 'stats') {
    hud.innerHTML = `
      <div class="row">
        ${renderStatsPanel(state.gameStats ?? {}, { title: 'Adventure Statistics' })}
      </div>
    `;
    actions.innerHTML = '<div class="buttons"><button id="btnCloseStats">Close 📊</button></div>';
    document.getElementById('btnCloseStats').onclick = () => dispatch({ type: 'CLOSE_STATS' });
    log.innerHTML = state.log.slice().reverse().map(line => '<div class="logLine">' + esc(line) + '</div>').join('');
    return;
  }

  // --- Save Slots Phase ---

  // --- Quest Reward Phase ---
  if (state.phase === 'quest-reward') {
    const pendingRewards = state.pendingQuestRewards || [];
    hud.innerHTML = renderQuestRewardScreen(pendingRewards);
    actions.innerHTML = renderQuestRewardActions();

    // Inject styles if not already present
    if (!document.getElementById('quest-reward-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'quest-reward-styles';
      styleEl.textContent = getQuestRewardStyles();
      document.head.appendChild(styleEl);
    }

    attachQuestRewardHandlers(dispatch);
    log.innerHTML = state.log.slice().reverse().map(line => '<div class="logLine">' + esc(line) + '</div>').join('');
    return;
  }

  // --- Settings Phase ---
  if (state.phase === 'settings') {
    const settings = state.settings || {};
    hud.innerHTML = '<div class="row">' + renderSettingsPanel(settings) + '</div>';
    actions.innerHTML = '';
    
    // Style injection
    if (!document.getElementById('settings-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'settings-styles';
      styleEl.textContent = getSettingsStyles();
      document.head.appendChild(styleEl);
    }
    
    // Attach handlers
    attachSettingsHandlers(
      settings,
      (path, value) => dispatch({ type: 'UPDATE_SETTING', path, value }),
      () => dispatch({ type: 'RESET_SETTINGS' })
    );
    
    // Close button
    const btnClose = document.getElementById('btnCloseSettings');
    if (btnClose) btnClose.onclick = () => dispatch({ type: 'CLOSE_SETTINGS' });
    
    log.innerHTML = state.log.slice().reverse().map(line => '<div class="logLine">' + esc(line) + '</div>').join('');
    return;
  }
  if (state.phase === 'save-slots') {
    const mode = state.saveSlotMode || 'save';
    const slots = state.saveSlots || [];
    hud.innerHTML = '<div class="row">' + renderSaveSlotsList(slots, mode) + '</div>';
    actions.innerHTML = '';

    // Style injection
    if (!document.getElementById('save-slots-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'save-slots-styles';
      styleEl.textContent = getSaveSlotsStyles();
      document.head.appendChild(styleEl);
    }

    // Tab buttons
    const btnModeSave = document.getElementById('btnModeSave');
    const btnModeLoad = document.getElementById('btnModeLoad');
    if (btnModeSave) btnModeSave.onclick = () => dispatch({ type: 'SWITCH_SAVE_MODE', mode: 'save' });
    if (btnModeLoad) btnModeLoad.onclick = () => dispatch({ type: 'SWITCH_SAVE_MODE', mode: 'load' });

    // Close button
    const btnClose = document.getElementById('btnCloseSaveSlots');
    if (btnClose) btnClose.onclick = () => dispatch({ type: 'CLOSE_SAVE_SLOTS' });

    // Save/Load/Delete slot buttons
    hud.querySelectorAll('.btn-save-slot').forEach(btn => {
      btn.onclick = () => dispatch({ type: 'SAVE_TO_SLOT', slotIndex: parseInt(btn.dataset.slotIndex, 10) });
    });
    hud.querySelectorAll('.btn-load-slot').forEach(btn => {
      if (!btn.disabled) {
        btn.onclick = () => dispatch({ type: 'LOAD_FROM_SLOT', slotIndex: parseInt(btn.dataset.slotIndex, 10) });
      }
    });
    hud.querySelectorAll('.btn-delete-slot').forEach(btn => {
      btn.onclick = () => dispatch({ type: 'DELETE_SAVE_SLOT', slotIndex: parseInt(btn.dataset.slotIndex, 10) });
    });

    log.innerHTML = state.log.slice().reverse().map(line => '<div class="logLine">' + esc(line) + '</div>').join('');
    return;
  }


  // --- Quests Phase ---
  if (state.phase === 'quests') {
    const questState = state.questState || { activeQuests: {}, completedQuests: [] };
    const summary = getActiveQuestsSummary(questState);
    const currentRoomId = state.world?.roomRow !== undefined && state.world?.roomCol !== undefined
      ? [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']][state.world.roomRow]?.[state.world.roomCol]
      : null;
    const availableQuests = currentRoomId ? getAvailableQuestsInRoom(questState, currentRoomId) : [];

    // Build active quests HTML
    const activeQuestsHtml = summary.length === 0
      ? '<p><i>No active quests. Explore to find new adventures!</i></p>'
      : summary.map(q => {
          const progress = q.stageIndex !== undefined ? `Stage ${q.stageIndex + 1}/${q.totalStages}` : '';
          return `<div class="quest-item"><b>${esc(q.questName)}</b> <small>${progress}</small><br/><i>${esc(q.currentStage || '')}</i></div>`;
        }).join('');

    // Build available quests HTML
    const availableQuestsHtml = availableQuests.length === 0
      ? '<p><i>No quests available in this area.</i></p>'
      : availableQuests.map(q => `<div class="quest-item"><b>${esc(q.name)}</b> - Lv ${q.level}<br/><i>${esc(q.description || '')}</i><br/><button class="quest-accept-btn" data-quest-id="${esc(q.id)}">Accept Quest</button></div>`).join('');

    // Completed quests count
    const completedCount = questState.completedQuests?.length || 0;

    hud.innerHTML = `
      <div class="row">
        <div class="card">
          <h2>Active Quests</h2>
          ${activeQuestsHtml}
        </div>
        <div class="card">
          <h2>Available Quests</h2>
          ${availableQuestsHtml}
        </div>
        <div class="card">
          <h2>Quest Stats</h2>
          <div class="kv">
            <div>Active</div><div><b>${summary.length}</b></div>
            <div>Completed</div><div><b>${completedCount}</b></div>
          </div>
        </div>
      </div>
    `;

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnCloseQuests">Close Quests</button>
      </div>
    `;

    // Wire close button
    document.getElementById('btnCloseQuests').onclick = () => dispatch({ type: 'CLOSE_QUESTS' });

    // Wire accept quest buttons
    actions.querySelectorAll('.quest-accept-btn').forEach(btn => {
      const questId = btn.dataset.questId;
      btn.onclick = () => dispatch({ type: 'ACCEPT_QUEST', questId });
    });
    hud.querySelectorAll('.quest-accept-btn').forEach(btn => {
      const questId = btn.dataset.questId;
      btn.onclick = () => dispatch({ type: 'ACCEPT_QUEST', questId });
    });

    log.innerHTML = state.log.slice().reverse().map(line => `<div class="logLine">${esc(line)}</div>`).join('');
    return;
  }

  if (state.phase === 'inventory') {
    const invState = state.inventoryState || { screen: 'main', selectedItem: null, message: null };
    const player = state.player;
    const equipment = player?.equipment || { weapon: null, armor: null, accessory: null };
    const categorized = getCategorizedInventory(player?.inventory || {});
    const eqDisplay = getEquipmentDisplay(equipment);

    // Build equipment section HTML with per-slot stat bonuses
    const eqRows = Object.entries(EQUIPMENT_SLOTS).map(([slot, label]) => {
      const itemId = equipment[slot];
      const detail = itemId ? getItemDetails(itemId) : null;
      const itemName = detail ? detail.name : (itemId || '—');
      const statTags = detail && detail.stats
        ? Object.entries(detail.stats)
            .filter(([, v]) => typeof v === 'number' && v !== 0)
            .map(([k, v]) => `<span style="color:#4f4;font-size:0.85em;margin-left:4px;">${v > 0 ? '+' : ''}${v} ${esc(k.toUpperCase())}</span>`)
            .join('')
        : '';
      const unequipBtn = itemId ? `<button class="inv-btn" data-action="unequip" data-slot="${esc(slot)}">Unequip</button>` : '';
      return `<div>${esc(label)}</div><div><b>${esc(itemName)}</b>${statTags} ${unequipBtn}</div>`;
    }).join('');

    // Compute total equipment bonuses for stat summary
    const eqBonuses = getEquipmentBonuses(equipment);
    const hasBonuses = Object.values(eqBonuses).some(v => v !== 0);
    const bonusSummaryRows = hasBonuses
      ? Object.entries(eqBonuses)
          .filter(([, v]) => v !== 0)
          .map(([stat, v]) => `<div>${esc(stat.charAt(0).toUpperCase() + stat.slice(1))}</div><div style="color:#4f4;"><b>${v > 0 ? '+' : ''}${v}</b></div>`)
          .join('')
      : '<div><i>No bonuses</i></div><div></div>';

    // Build inventory items list HTML
    const allItems = [...categorized.consumables, ...categorized.weapons, ...categorized.armors, ...categorized.accessories, ...categorized.unknown];
    const itemRows = allItems.length === 0 ? '<div class="kv"><div><i>Empty</i></div><div></div></div>' :
      '<div class="kv">' + allItems.map(({ id, name, count, type, equippable, usable, rarity }) => {
        const useBtn = usable ? `<button class="inv-btn" data-action="use" data-item="${esc(id)}">Use</button>` : '';
        const eqBtn = equippable ? `<button class="inv-btn" data-action="equip" data-item="${esc(id)}">Equip</button>` : '';
        const detBtn = `<button class="inv-btn" data-action="details" data-item="${esc(id)}">Info</button>`;
        const rarityColor = rarityColors[rarity] || '#aaa';
        const rarityTag = rarity ? `<span style="color: ${rarityColor}; font-size: 0.85em; margin-left: 4px;">${esc(rarity)}</span>` : '';
        return `<div>${esc(name)} <small>(${esc(type)})</small>${rarityTag}</div><div><b>${count}</b> ${useBtn}${eqBtn}${detBtn}</div>`;
      }).join('') + '</div>';

    // Item details screen
    let detailsHtml = '';
    if (invState.screen === INVENTORY_SCREENS.DETAILS && invState.selectedItem) {
      const detail = getItemDetails(invState.selectedItem);
      if (detail) {
        const rarityColor = rarityColors[detail.rarity] || '#aaa';
        const rarityLabel = detail.rarity
          ? `<span style="color:${rarityColor}; font-weight:700;">${esc(detail.rarity)}</span>`
          : '<span style="color:#aaa;">Unknown</span>';
        const statsHtml = Object.entries(detail.stats || {}).map(([k, v]) => `<div>${esc(k)}</div><div><b>${v > 0 ? '+' : ''}${v}</b></div>`).join('');
        const effectHtml = Object.entries(detail.effect || {}).map(([k, v]) => `<div>${esc(k)}</div><div><b>${v}</b></div>`).join('');
        detailsHtml = `
          <div class="card">
            <h2>${esc(detail.name)}</h2>
            <div style="color:#aaa; font-size:0.9em; margin-bottom:6px;">Type: <b>${esc(detail.type || 'Unknown')}</b> · Rarity: ${rarityLabel}</div>
            <div>${esc(detail.description || '')}</div>
            <div class="kv">
              <div>Category</div><div>${esc(detail.type || 'Unknown')}</div>
              <div>Rarity</div><div>${rarityLabel}</div>
              ${statsHtml}${effectHtml}<div>Value</div><div><b>${detail.value}g</b></div>
            </div>
            <div class="buttons"><button id="btnInvBack">Back</button></div>
          </div>
        `;
      }
    }

    const messageHtml = invState.message ? `<div class="card"><p class="good">${esc(invState.message)}</p></div>` : '';

    // Compute effective stats (base + equipment)
    const baseAtk = player?.atk ?? 0;
    const baseDef = player?.def ?? 0;
    const baseSpd = player?.spd ?? 0;
    const effectiveStats = getEffectiveCombatStats(player || {});

    hud.innerHTML = `
      <div class="row">
        <div class="card">
          <h2>Equipment</h2>
          <div class="kv">${eqRows}</div>
          ${hasBonuses ? `<h3 style="margin-top:8px;color:#aaa;">Total Bonuses</h3><div class="kv">${bonusSummaryRows}</div>` : ''}
        </div>
        <div class="card">
          <h2>${esc(player?.name || 'Player')} — Lv ${player?.level || 1}</h2>
          <div class="kv">
            <div>HP</div><div><b>${hpLine(player)}</b></div>
            <div>MP</div><div><b>${player?.mp ?? 0}/${player?.maxMp ?? 0}</b></div>
            <div>ATK</div><div><b>${baseAtk}</b>${eqBonuses.attack ? ` <span style="color:#4f4;">+${eqBonuses.attack}</span> = <b>${effectiveStats.atk}</b>` : ''}</div>
            <div>DEF</div><div><b>${baseDef}</b>${eqBonuses.defense ? ` <span style="color:#4f4;">+${eqBonuses.defense}</span> = <b>${effectiveStats.def}</b>` : ''}</div>
            <div>SPD</div><div><b>${baseSpd}</b>${eqBonuses.speed ? ` <span style="color:#4f4;">+${eqBonuses.speed}</span> = <b>${effectiveStats.spd}</b>` : ''}</div>
            <div>Gold</div><div><b>${player?.gold ?? 0}</b></div>
          </div>
        </div>
      </div>
      ${detailsHtml || messageHtml}
    `;

    actions.innerHTML = `
      <div class="card">
        <h2>Items</h2>
        ${itemRows}
      </div>
      <div class="buttons">
        <button id="btnCloseInv">Close Inventory</button>
      </div>
    `;

    // Wire close button
    document.getElementById('btnCloseInv').onclick = () => dispatch({ type: 'CLOSE_INVENTORY' });

    // Wire back button if details shown
    const backBtn = document.getElementById('btnInvBack');
    if (backBtn) backBtn.onclick = () => dispatch({ type: 'INVENTORY_BACK' });

    // Wire item action buttons
    actions.querySelectorAll('.inv-btn').forEach(btn => {
      const action2 = btn.dataset.action;
      const itemId = btn.dataset.item;
      const slot = btn.dataset.slot;
      btn.onclick = () => {
        if (action2 === 'use') dispatch({ type: 'INVENTORY_USE', itemId });
        else if (action2 === 'equip') dispatch({ type: 'INVENTORY_EQUIP', itemId });
        else if (action2 === 'unequip') dispatch({ type: 'INVENTORY_UNEQUIP', slot });
        else if (action2 === 'details') dispatch({ type: 'INVENTORY_VIEW_DETAILS', itemId });
      };
    });

    log.innerHTML = state.log.slice().reverse().map(line => `<div class="logLine">${esc(line)}</div>`).join('');
    return;
  }

  if (state.phase === 'talents') {
    const talentRenderState = {
      ...state,
      player: { ...(state.player || {}), talents: state.talentState }
    };
    const talentHtml = renderTalentTree(talentRenderState);
    hud.innerHTML = talentHtml;
    actions.innerHTML = '<div class="buttons"><button id="btnCloseTalents">Close Talents</button></div>';
    attachTalentHandlers(hud, dispatch);
    document.getElementById('btnCloseTalents').onclick = () => dispatch({ type: 'CLOSE_TALENTS' });
    log.innerHTML = state.log.slice().reverse().map(line => '<div class="logLine">' + esc(line) + '</div>').join('');
    return;
  }

  if (state.phase === 'crafting') {
    const craftingHtml = renderCraftingPanel(state, state.craftingUI || {});

    hud.innerHTML = craftingHtml;

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnCloseCrafting">Close Crafting</button>
      </div>
    `;

    attachCraftingHandlers(hud, dispatch);
    document.getElementById('btnCloseCrafting').onclick = () => dispatch({ type: 'CLOSE_CRAFTING' });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => `<div class="logLine">${esc(line)}</div>`)
      .join('');
    return;
  }

  if (state.phase === 'shop' && state.shopState) {
    const shopHtml = renderShopPanel(state.shopState, state.player);

    hud.innerHTML = shopHtml;

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnCloseShop">Leave Shop</button>
      </div>
    `;

    attachShopHandlers(hud, dispatch);
    document.getElementById('btnCloseShop').onclick = () => dispatch({ type: 'CLOSE_SHOP' });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => `<div class="logLine">${esc(line)}</div>`)
      .join('');
    return;
  }

  if (state.phase === 'dialog' && state.dialogState) {
    const ds = state.dialogState;
    const currentLine = getCurrentDialogLine(ds);
    const progress = getDialogProgress(ds);
    const progressText = ds.lines.length > 0
      ? `(${progress.current}/${progress.total})`
      : '';

    hud.innerHTML = `
      <div class="card">
        <h2>💬 ${esc(ds.npcName)}</h2>
        <div class="dialog-greeting" style="color:#aaa;font-style:italic;margin-bottom:8px;">${esc(ds.greeting)}</div>
        ${currentLine
          ? `<div class="dialog-line" style="font-size:1.1em;margin-bottom:12px;">${esc(currentLine)} ${progressText}</div>`
          : `<div class="dialog-line" style="color:#aaa;font-style:italic;">... (End of conversation)</div>`
        }
      </div>
    `;

    actions.innerHTML = `
      <div class="buttons">
        ${currentLine ? `<button id="btnDialogNext">Next ▶</button>` : ''}
        <button id="btnDialogClose">Farewell</button>
      </div>
    `;

    if (currentLine) {
      document.getElementById('btnDialogNext').onclick = () => dispatch({ type: 'DIALOG_NEXT' });
    }
    document.getElementById('btnDialogClose').onclick = () => dispatch({ type: 'DIALOG_CLOSE' });
    if (npcHasShop) {
      document.getElementById('btnViewShop').onclick = () => dispatch({ type: 'VIEW_SHOP', npcId: ds.npcId });
    }

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => `<div class="logLine">${esc(line)}</div>`)
      .join('');
    return;
  }

  // --- Fallback (unknown phase) ---
  hud.innerHTML = `<div class="card"><h2>Unknown Phase: ${esc(state.phase)}</h2></div>`;
  actions.innerHTML = `
    <div class="buttons">
      <button id="btnNew">New Game</button>
      <button id="btnLoad">Load</button>
    </div>
  `;
  document.getElementById('btnNew').onclick = () => dispatch({ type: 'NEW' });
  document.getElementById('btnLoad').onclick = () => dispatch({ type: 'LOAD' });

  log.innerHTML = state.log
    .slice()
    .reverse()
    .map((line) => `<div class="logLine">${esc(line)}</div>`)
    .join('');
}
