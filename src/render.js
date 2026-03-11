import { renderTavernDicePanel } from './tavern-dice-ui.js';
import { saveToLocalStorage } from './state.js';
import { CLASS_DEFINITIONS } from './characters/classes.js';
import { DEFAULT_WORLD_DATA, getRoomExits } from './map.js';
import { getCategorizedInventory, getEquipmentDisplay, getItemDetails, getEquipmentComparison, INVENTORY_SCREENS, EQUIPMENT_SLOTS, getEquipmentBonuses } from './inventory.js';
import { getEffectiveCombatStats, getEquipmentBonusDisplay, hasEquipmentBonuses } from './combat/equipment-bonuses.js';
import { getCurrentLevelUp, getStatDiffs, formatStatName, xpForNextLevel } from './level-up.js';
import { formatAbilityName } from './specialization-ui.js';
import { getNPCsInRoom, getCurrentDialogLine, getDialogProgress } from './npc-dialog.js';
import { getActiveQuestsSummary, getCompletedQuestsSummary, getAvailableQuestsInRoom } from './quest-integration.js';
import { getAbilityDisplayInfo } from './combat/abilities.js';
import { items as itemsData } from './data/items.js';
import { getRarityMeta } from './ui/rarity-util.js';
import { renderStatusEffectsRow, getStatusEffectStyles } from './status-effect-ui.js';
import { getMinimapStyles, renderMinimap } from './minimap.js';
import { renderStatsPanel, getStatsPanelStyles } from './stats-display.js';
import { renderSaveSlotsList, getSaveSlotsStyles } from './save-slots-ui.js';
import { renderSettingsPanel, getSettingsStyles, attachSettingsHandlers } from './settings-ui.js';
import { renderQuestRewardScreen, renderQuestRewardActions, attachQuestRewardHandlers, getQuestRewardStyles } from './quest-rewards-ui.js';
import { renderShopPanel, getShopStyles, attachShopHandlers } from './shop-ui.js';
import { renderCraftingPanel, getCraftingStyles, attachCraftingHandlers } from './crafting-ui.js';
import { renderTalentTree, getTalentTreeStyles, attachTalentHandlers } from './talents-ui.js';
import { renderHelpModal, getHelpStyles, attachHelpHandlers } from './help-ui.js';
import { renderAchievementsPanel, attachAchievementsHandlers } from './achievements-ui.js';
import { renderWorldEventBanner } from './world-events-ui.js';
import { isMinimapHidden } from './world-events.js';
import { hasShop } from './shop.js';
import { renderBestiaryPanel } from './bestiary-ui.js';
import { renderJournalPanel, renderJournalBadge } from './journal-ui.js';
import { renderCompanionPanel, renderCompanionHUD, renderCompanionBadge } from './companions-ui.js';
import { renderDungeonPanel, renderDungeonActions, attachDungeonHandlers, getDungeonStyles, shouldShowDungeonEntrance } from './dungeon-ui.js';
import { renderProvisionsPanel, renderProvisionBuffs, attachProvisionsHandlers, getProvisionsStyles } from './provisions-ui.js';
import { renderShieldBreakHUD } from './shield-break-ui.js';
import { renderCombatStatsHtml } from './battle-summary.js';
import { formatLogEntryHtml, getLogStyles } from './combat-log-formatter.js';
import { triggerFloatingTextFromLog, getFloatingTextStyles } from './floating-text.js';
import { renderBattleLogPanel, getBattleLogStyles } from './battle-log-ui.js';
import { getBattleLogEntries } from './combat-battle-log-integration.js';
import { filterAndSortItems, renderSortFilterControls, SORT_MODES, FILTER_MODES } from './inventory-sort-filter.js';
import { renderTutorialHint, attachTutorialHandlers, getTutorialStyles } from './tutorial-ui.js';
import { getTutorialHint } from './tutorial.js';
import { renderEquipmentSetsPanel, getEquipmentSetsPanelStyles } from './equipment-sets-ui.js';
import { BACKGROUND_ORDER, BACKGROUNDS } from './data/backgrounds.js';

/** Track previous log for floating text diff */
let _previousLog = [];

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

function renderAchievementToasts(state, dispatch) {
  const notifications = state.achievementNotifications || [];
  if (notifications.length === 0) return;

  let container = document.getElementById('achievement-toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'achievement-toasts';
    document.body.appendChild(container);
  }

  notifications.forEach((notif) => {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    if (notif?.id != null) toast.dataset.id = String(notif.id);
    const name = notif?.name ?? 'Achievement';
    toast.innerHTML = `🏆 Achievement Unlocked! <strong>${esc(name)}</strong>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('achievement-toast-hide'), 3500);
    setTimeout(() => toast.remove(), 4000);
  });
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

function summarizeBonuses(bonuses) {
  if (!bonuses) return 'No bonuses';
  const parts = [];
  const add = (label, value) => {
    if (typeof value === 'number' && value !== 0) {
      const sign = value > 0 ? '+' : '';
      parts.push(`${sign}${value} ${label}`);
    }
  };

  add('HP', bonuses.hp);
  add('Max HP', bonuses.maxHp);
  add('MP', bonuses.mp);
  add('Max MP', bonuses.maxMp);
  add('ATK', bonuses.atk);
  add('DEF', bonuses.def);
  add('SPD', bonuses.spd);
  add('gold', bonuses.gold);

  if (bonuses.inventory && typeof bonuses.inventory === 'object') {
    for (const [item, count] of Object.entries(bonuses.inventory)) {
      if (typeof count === 'number' && count !== 0) {
        const sign = count > 0 ? '+' : '';
        parts.push(`${sign}${count} ${item}`);
      }
    }
  }

  return parts.length ? parts.join(', ') : 'No bonuses';
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

  if (!document.getElementById('provisions-styles')) {
    const provisionsStyleEl = document.createElement('style');
    provisionsStyleEl.id = 'provisions-styles';
    provisionsStyleEl.textContent = getProvisionsStyles();
    document.head.appendChild(provisionsStyleEl);
  }

  if (!document.getElementById('talent-tree-styles')) {
    const talentStyleEl = document.createElement('style');
    talentStyleEl.id = 'talent-tree-styles';
    talentStyleEl.textContent = getTalentTreeStyles();
    document.head.appendChild(talentStyleEl);
  }

  if (!document.getElementById('help-styles')) {
    const s = document.createElement('style');
    s.id = 'help-styles';
    s.textContent = getHelpStyles();
    document.head.appendChild(s);
  }

  if (!document.getElementById('shield-break-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'shield-break-styles';
    styleEl.textContent = `
      .shield-break-hud { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; padding: 4px 0; }
      .shield-display { font-size: 1.1em; letter-spacing: 2px; }
      .weakness-icon { font-size: 1em; }
      .break-state-display { color: #ff4444; font-weight: bold; font-size: 0.9em; padding: 2px 6px; border: 1px solid #ff4444; border-radius: 3px; }
      .break-active { background: rgba(255,68,68,0.15); }
    `;
    document.head.appendChild(styleEl);
  }

  if (!document.getElementById('achievement-toast-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'achievement-toast-styles';
    styleEl.textContent = `
      #achievement-toasts {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }
      .achievement-toast {
        background: linear-gradient(135deg, #2a1a4e, #1a0a3e);
        border: 2px solid #a335ee;
        border-radius: 8px;
        color: #e0c8ff;
        font-size: 14px;
        padding: 12px 18px;
        min-width: 280px;
        box-shadow: 0 4px 20px rgba(163, 53, 238, 0.4);
        animation: toastSlideIn 0.3s ease-out;
        transition: opacity 0.5s ease;
      }
      .achievement-toast-hide {
        opacity: 0;
      }
      @keyframes toastSlideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
  }

  if (!document.getElementById('floating-text-styles')) {
    const ftStyleEl = document.createElement('style');
    ftStyleEl.id = 'floating-text-styles';
    ftStyleEl.textContent = getFloatingTextStyles();
    document.head.appendChild(ftStyleEl);
  }

  if (!document.getElementById('battle-log-styles')) {
    const blStyleEl = document.createElement('style');
    blStyleEl.id = 'battle-log-styles';
    blStyleEl.textContent = getBattleLogStyles();
    document.head.appendChild(blStyleEl);
  }
  if (!document.getElementById('tutorial-styles')) {
    const tutStyleEl = document.createElement('style');
    tutStyleEl.id = 'tutorial-styles';
    tutStyleEl.textContent = getTutorialStyles();
    document.head.appendChild(tutStyleEl);
  }

  const finalizeRender = () => {
    if (state.showHelp) {
      hud.innerHTML += renderHelpModal();
      attachHelpHandlers(dispatch);
    }

    if ((state.achievementNotifications || []).length > 0) {
      renderAchievementToasts(state, dispatch);
      setTimeout(() => dispatch({ type: 'CONSUME_ACHIEVEMENT_NOTIFICATIONS' }), 0);
    }
    // Trigger floating damage/heal text for combat phases
    const combatPhases = ['player-turn', 'enemy-turn', 'dungeon-combat', 'dungeon-boss'];
    if (combatPhases.includes(state.phase) && state.log) {
      triggerFloatingTextFromLog(state.log, _previousLog);
    }
    _previousLog = state.log ? [...state.log] : [];

    // Tutorial hint triggers
    if (state.tutorialState && state.tutorialState.hintsEnabled) {
      let triggerEvent = null;
      if (state.phase === 'class-select' && !state.tutorialState.completedSteps.includes('welcome')) triggerEvent = 'class-select';
      else if (state.phase === 'exploration' && !state.tutorialState.completedSteps.includes('exploration-basics')) triggerEvent = 'first-exploration';
      else if ((state.phase === 'player-turn' || state.phase === 'enemy-turn') && !state.tutorialState.completedSteps.includes('combat-intro')) triggerEvent = 'first-combat';
      else if (state.phase === 'inventory' && !state.tutorialState.completedSteps.includes('inventory-intro')) triggerEvent = 'first-inventory';
      else if (state.phase === 'shop' && !state.tutorialState.completedSteps.includes('shop-intro')) triggerEvent = 'first-shop';
      else if (state.phase === 'dungeon' && !state.tutorialState.completedSteps.includes('dungeon-intro')) triggerEvent = 'first-dungeon';
      else if (state.phase === 'level-up' && !state.tutorialState.completedSteps.includes('level-up-intro')) triggerEvent = 'first-level-up';
      else if (state.phase === 'quests' && !state.tutorialState.completedSteps.includes('quest-intro')) triggerEvent = 'first-quest';
      else if (state.phase === 'crafting' && !state.tutorialState.completedSteps.includes('crafting-intro')) triggerEvent = 'first-crafting';
      else if (state.phase === 'companions' && !state.tutorialState.completedSteps.includes('companion-intro')) triggerEvent = 'first-companion';

      if (triggerEvent) {
        const hint = getTutorialHint(state.tutorialState, triggerEvent);
        if (hint && state.tutorialState.currentHint?.id !== hint.id) {
          dispatch({ type: 'TUTORIAL_SHOW', stepId: hint.id });
        }
      }
    }

    // Render tutorial overlay
    const tutorialHtml = renderTutorialHint(state.tutorialState);
    if (tutorialHtml) {
      hud.innerHTML += tutorialHtml;
      attachTutorialHandlers(dispatch);
    }
  };

  // --- Class Select Phase ---
  if (state.phase === 'class-select') {
    const order = ['warrior', 'mage', 'rogue', 'cleric'];
    const cards = order.map((classId) => {
      const def = CLASS_DEFINITIONS[classId];
      if (!def) return '';
      return `
        <div class="card">
          <h2>${({ warrior: '⚔️', mage: '🔮', rogue: '🗡️', cleric: '⛪' }[def.id] ?? '')} ${esc(def.name)}</h2>
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

    hud.innerHTML = `
      <div class="row">
        <div class="card" style="flex: 2;">
          <h2>Quests Log</h2>
          ${filterControlsHtml}
          <div class="quest-list-container" style="max-height: 400px; overflow-y: auto;">
            ${questsHtml}
          </div>
        </div>
        <div class="card" style="flex: 1;">
          <h2>Quest Stats</h2>
          <div class="kv">
            <div>Active</div><div><b>${summary.length}</b></div>
            <div>Completed</div><div><b>${completedCount}</b></div>
            <div>Available Here</div><div><b>${availableQuests.length}</b></div>
          </div>
        </div>
      </div>
    `;
    actions.innerHTML = '';

    const nameInput = hud.querySelector('#class-select-name');
    if (nameInput) {
      nameInput.focus();
    }

    hud.querySelectorAll('button[data-class]').forEach((button) => {
      button.onclick = () => dispatch({
        type: 'SELECT_CLASS',
        classId: button.dataset.class,
        name: nameInput?.value ?? '',
      });
    });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
    return;
  }

  // --- Background Select Phase ---
  if (state.phase === 'background-select') {
    const cards = BACKGROUND_ORDER.map((backgroundId) => {
      const bg = BACKGROUNDS[backgroundId];
      if (!bg) return '';
      const bonusSummary = summarizeBonuses(bg.bonuses);
      return `
        <div class="card">
          <h2>${esc(bg.name)}</h2>
          <div>${esc(bg.description)}</div>
          <div class="bonus-summary"><b>Bonuses:</b> ${esc(bonusSummary)}</div>
          <button data-background="${esc(bg.id)}">Choose ${esc(bg.name)}</button>
        </div>
      `;
    }).join('');

    hud.innerHTML = `<div class="row">${cards}</div>`;
    actions.innerHTML = '';

    hud.querySelectorAll('button[data-background]').forEach((button) => {
      button.onclick = () => dispatch({ type: 'SELECT_BACKGROUND', backgroundId: button.dataset.background });
    });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
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

        ${isMinimapHidden(state.worldEvent)
          ? '<div class="card">The fog obscures your map...</div>'
          : renderMinimap(state.world, state.visitedRooms || [])}

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
        ${shouldShowDungeonEntrance(state) ? '<button id="btnEnterDungeon" class="dungeon-enter-btn">Enter Dungeon \u26CF\uFE0F</button>' : ''}
        <button id="btnInventory">Inventory</button>
        <button id="btnQuests">Quests 📜</button>
        <button id="btnViewStats">Stats 📊</button>
        <button id="btnSaveSlots">Save/Load 💾</button>
        <button id="btnSettings">Settings ⚙️</button>
        <button id="btnCrafting">Crafting 🔨</button>
        <button id="btnHelp">Help ❓</button>
        <button id="btnTalents">Talents ⭐</button>
        <button id="btnTavern">Tavern 🍺</button>
        <button id="btnJournal">Journal 📔${renderJournalBadge(state)}</button>
        <button id="btnCompanions">Companions 🤝${renderCompanionBadge(state)}</button>
        <button id="btnProvisions">Provisions 🍖</button>
      </div>
    `;

    document.getElementById('btnNorth').onclick = () => dispatch({ type: 'EXPLORE', direction: 'north' });
    document.getElementById('btnSouth').onclick = () => dispatch({ type: 'EXPLORE', direction: 'south' });
    document.getElementById('btnWest').onclick = () => dispatch({ type: 'EXPLORE', direction: 'west' });
    document.getElementById('btnEast').onclick = () => dispatch({ type: 'EXPLORE', direction: 'east' });
    document.getElementById('btnSeek').onclick = () => dispatch({ type: 'SEEK_ENCOUNTER' });
    const dungeonBtn = document.getElementById('btnEnterDungeon');
    if (dungeonBtn) dungeonBtn.onclick = () => dispatch({ type: 'ENTER_DUNGEON' });
    document.getElementById('btnInventory').onclick = () => dispatch({ type: 'VIEW_INVENTORY' });
    document.getElementById('btnQuests').onclick = () => dispatch({ type: 'VIEW_QUESTS' });
    document.getElementById('btnViewStats').onclick = () => dispatch({ type: 'VIEW_STATS' });
    document.getElementById('btnSaveSlots').onclick = () => dispatch({ type: 'SAVE_SLOTS' });
    document.getElementById('btnSettings').onclick = () => dispatch({ type: 'VIEW_SETTINGS' });
    document.getElementById('btnCrafting').onclick = () => dispatch({ type: 'VIEW_CRAFTING' });
    document.getElementById('btnTalents').onclick = () => dispatch({ type: 'VIEW_TALENTS' });
    document.getElementById('btnHelp').onclick = () => dispatch({ type: 'TOGGLE_HELP' });
    document.getElementById('btnTavern').onclick = () => dispatch({ type: 'VIEW_TAVERN' });
    document.getElementById('btnJournal').onclick = () => dispatch({ type: 'OPEN_JOURNAL' });
    document.getElementById('btnCompanions').onclick = () => dispatch({ type: 'OPEN_COMPANIONS' });
    document.getElementById('btnProvisions').onclick = () => dispatch({ type: 'OPEN_PROVISIONS' });

    hud.querySelectorAll('.npc-talk-btn').forEach((btn) => {
      btn.onclick = () => dispatch({ type: 'TALK_TO_NPC', npcId: btn.dataset.npcid });
    });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
    return;
  }

  // --- Combat Phases (player-turn, enemy-turn) ---
  if (state.phase === 'player-turn' || state.phase === 'enemy-turn') {
    const provisionBuffBar = renderProvisionBuffs(state);
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
            ${state.enemy?.maxShields > 0 ? `<div style="grid-column: 1 / -1">${renderShieldBreakHUD(state.enemy)}</div>` : ''}
          </div>
        </div>

        <div class="card">
          <h2>Combat</h2>
          <div class="kv">
            <div>Phase</div><div><b>${esc(state.phase)}</b></div>
            <div>Turn</div><div><b>${state.turn}</b></div>
          </div>
        </div>

        ${renderCompanionHUD(state)}
      </div>
      ${provisionBuffBar}
      ${renderBattleLogPanel(getBattleLogEntries(), 8)}
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
        <button id="btnFlee" ${!isPlayerTurn ? 'disabled' : ''}>Flee</button>
        ${abilityBtns}
      </div>
      ${combatItemBtns ? '<div class="buttons item-buttons"><b>Items:</b> ' + combatItemBtns + '</div>' : ''}
    `;

    document.getElementById('btnAttack').onclick = () => dispatch({ type: 'PLAYER_ATTACK' });
    document.getElementById('btnDefend').onclick = () => dispatch({ type: 'PLAYER_DEFEND' });
    document.getElementById('btnPotion').onclick = () => dispatch({ type: 'PLAYER_POTION' });
    document.getElementById('btnFlee').onclick = () => dispatch({ type: 'PLAYER_FLEE' });

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
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
    return;
  }


  // --- Specialization Phase ---
  if (state.phase === 'specialization' && state.specializationState) {
    const specState = state.specializationState;
    const choices = specState.choices || [];
    const playerName = esc(specState.playerName || 'Hero');
    const classId = specState.classId || '';
    const className = classId.charAt(0).toUpperCase() + classId.slice(1);

    const choiceCards = choices.map((choice, idx) => {
      const statLines = choice.statBonuses.map(sb => {
        const color = sb.value > 0 ? '#4f4' : '#f44';
        return '<div style="color:' + color + ';">' + esc(sb.formatted) + '</div>';
      }).join('');
      const abilityLines = choice.abilities.map(a =>
        '<div>\u2694\uFE0F ' + esc(a.name) + '</div>'
      ).join('');
      const passiveHtml = choice.passive
        ? '<div style="margin-top:6px;"><b>\u2728 ' + esc(choice.passive.name) + '</b></div>'
          + '<div style="font-size:0.85em;opacity:0.8;">' + esc(choice.passive.description) + '</div>'
        : '';
      return '<div class="card" style="flex:1;min-width:220px;cursor:pointer;border:2px solid #555;" '
        + 'id="specChoice' + idx + '">'
        + '<h3 style="color:#ffd700;">' + esc(choice.name) + '</h3>'
        + '<div style="font-size:0.9em;opacity:0.85;margin-bottom:8px;">' + esc(choice.description) + '</div>'
        + '<div style="margin-bottom:6px;"><b>Stat Bonuses:</b></div>' + statLines
        + '<div style="margin-top:6px;margin-bottom:6px;"><b>New Abilities:</b></div>' + abilityLines
        + passiveHtml
        + '</div>';
    }).join('');

    hud.innerHTML = '<div class="row">'
      + '<div class="card" style="width:100%;text-align:center;">'
      + '<h2 style="color:#ffd700;">\u2B50 Specialization Unlocked!</h2>'
      + '<div>' + playerName + ' the ' + esc(className) + ' has reached Level 5!</div>'
      + '<div style="margin-top:4px;">Choose your path wisely — this choice is permanent.</div>'
      + '</div></div>'
      + '<div class="row" style="gap:12px;">' + choiceCards + '</div>';

    actions.innerHTML = '';

    // Wire up click handlers
    choices.forEach((choice, idx) => {
      const el = document.getElementById('specChoice' + idx);
      if (el) {
        el.onmouseenter = () => { el.style.borderColor = '#ffd700'; };
        el.onmouseleave = () => { el.style.borderColor = '#555'; };
        el.onclick = () => dispatch({ type: 'CHOOSE_SPECIALIZATION', specId: choice.id, specName: choice.name });
      }
    });

    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
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
        .map(line => formatLogEntryHtml(line))
        .join('');
      finalizeRender();
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
          const isString = typeof item === 'string';
          const name = isString ? item : (item.name ?? item.itemId ?? 'Item');
          const rarity = isString ? null : (item.rarity ?? null);
          const rarityKey = typeof rarity === 'string' ? rarity : null;
          const color = getRarityMeta(rarityKey).color;
          const badge = rarityKey ? '[' + rarityKey + ']' : '';
          const emoji = (() => {
            switch (rarityKey) {
              case 'Common': return '📦';
              case 'Uncommon': return '💚';
              case 'Rare': return '💎';
              case 'Epic': return '💜';
              case 'Legendary': return '🔥';
              default: return '📦';
            }
          })();
          const isBold = rarityKey === 'Rare' || rarityKey === 'Epic' || rarityKey === 'Legendary';
          const nameStyle = 'color: ' + color + ';' + (isBold ? ' font-weight: bold;' : '');
          const badgeStyle = 'color: ' + color + '; font-size: 0.8em; opacity: 0.85;';
          return '<div>' + emoji + ' '
            + '<span style="' + nameStyle + '">' + esc(name) + '</span>'
            + (badge ? ' <span style="' + badgeStyle + '">' + esc(badge) + '</span>' : '')
            + '</div>';
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
        ${bs.combatStatsDisplay ? '<div class="card">' + renderCombatStatsHtml(bs.combatStatsDisplay) + '</div>' : ''}
      </div>
    `;
    actions.innerHTML = '<div class="buttons"><button id="btnContinueAfterBattle">Continue →</button></div>';
    document.getElementById('btnContinueAfterBattle').onclick = () => dispatch({ type: 'CONTINUE_AFTER_BATTLE' });
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
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
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
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
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
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
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
    return;
  }

if (state.phase === 'achievements') {
    hud.innerHTML = renderAchievementsPanel(state);
    attachAchievementsHandlers(hud, dispatch);
    actions.innerHTML = '';
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
    return;
  }

  // --- Journal Phase ---
  if (state.phase === 'journal') {
    hud.innerHTML = renderJournalPanel(state);
    actions.innerHTML = '<div class="buttons"><button id="btnCloseJournal">Close 📔</button></div>';
    document.getElementById('btnCloseJournal').onclick = () => dispatch({ type: 'CLOSE_JOURNAL' });
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
    return;
  }

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
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
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
    
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
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

    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
    return;
  }


  // --- Quests Phase ---
  if (state.phase === 'quests') {
    const questState = state.questState || { activeQuests: {}, completedQuests: [] };
    const questUiState = state.questUiState || { sortBy: 'name', sortOrder: 'asc', filter: 'active' };
    const summary = getActiveQuestsSummary(questState);
    const currentRoomId = state.world?.roomRow !== undefined && state.world?.roomCol !== undefined
      ? [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']][state.world.roomRow]?.[state.world.roomCol]
      : null;
    const availableQuests = currentRoomId ? getAvailableQuestsInRoom(questState, currentRoomId) : [];

    
    const completedQuests = getCompletedQuestsSummary(questState);
    let displayedQuests = [];
    
    if (questUiState.filter === 'active') {
      displayedQuests = summary;
    } else if (questUiState.filter === 'completed') {
      displayedQuests = completedQuests;
    } else if (questUiState.filter === 'available') {
      displayedQuests = availableQuests;
    } else { // 'all'
      displayedQuests = [
        ...summary.map(q => ({...q, status: 'active'})), 
        ...completedQuests.map(q => ({...q, status: 'completed'})),
        ...availableQuests.map(q => ({...q, status: 'available', questName: q.name}))
      ];
    }
    
    // Sorting
    displayedQuests.sort((a, b) => {
      let valA, valB;
      if (questUiState.sortBy === 'name') {
        valA = (a.questName || a.name || '').toLowerCase();
        valB = (b.questName || b.name || '').toLowerCase();
      } else if (questUiState.sortBy === 'level') {
        valA = a.level || 0;
        valB = b.level || 0;
      }
      
      if (valA < valB) return questUiState.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return questUiState.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const questsHtml = displayedQuests.length === 0
      ? '<p><i>No quests found matching your criteria.</i></p>'
      : displayedQuests.map(q => {
          let extraInfo = '';
          let actionBtn = '';
          const status = q.status || questUiState.filter;
          
          if (status === 'active') {
             const progress = q.stageIndex !== undefined ? `Stage ${q.stageIndex + 1}/${q.totalStages}` : '';
             extraInfo = `<small>${progress}</small><br/><i>${esc(q.currentStage || '')}</i>`;
          } else if (status === 'available') {
             extraInfo = `- Lv ${q.level}<br/><i>${esc(q.description || '')}</i>`;
             actionBtn = `<br/><button class="quest-accept-btn" data-quest-id="${esc(q.id || q.questId)}">Accept Quest</button>`;
          } else if (status === 'completed') {
             extraInfo = `<small>Completed</small><br/><i>${esc(q.description || '')}</i>`;
          }
          
          return `<div class="quest-item"><b>${esc(q.questName || q.name)}</b> ${extraInfo}${actionBtn}</div>`;
        }).join('');

    const filterControlsHtml = `
      <div class="quest-controls" style="margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px;">
        <select id="quest-filter" style="margin-right: 5px; padding: 5px;">
          <option value="active" ${questUiState.filter === 'active' ? 'selected' : ''}>Active Quests</option>
          <option value="available" ${questUiState.filter === 'available' ? 'selected' : ''}>Available Quests</option>
          <option value="completed" ${questUiState.filter === 'completed' ? 'selected' : ''}>Completed Quests</option>
          <option value="all" ${questUiState.filter === 'all' ? 'selected' : ''}>All Quests</option>
        </select>
        <select id="quest-sort" style="margin-right: 5px; padding: 5px;">
          <option value="name" ${questUiState.sortBy === 'name' ? 'selected' : ''}>Sort by Name</option>
          <option value="level" ${questUiState.sortBy === 'level' ? 'selected' : ''}>Sort by Level</option>
        </select>
        <button id="quest-sort-dir" style="padding: 5px 10px;">
          ${questUiState.sortOrder === 'asc' ? '⬆️ Asc' : '⬇️ Desc'}
        </button>
      </div>
    `;

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

    
    // Wire filter/sort controls
    document.getElementById('quest-filter').onchange = (e) => {
      dispatch({ type: 'UPDATE_QUEST_UI_STATE', payload: { filter: e.target.value } });
    };
    document.getElementById('quest-sort').onchange = (e) => {
      dispatch({ type: 'UPDATE_QUEST_UI_STATE', payload: { sortBy: e.target.value } });
    };
    document.getElementById('quest-sort-dir').onclick = () => {
      dispatch({ type: 'UPDATE_QUEST_UI_STATE', payload: { sortOrder: questUiState.sortOrder === 'asc' ? 'desc' : 'asc' } });
    };

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

    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
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
      const rarityKey = detail && typeof detail.rarity === 'string' ? detail.rarity : null;
      const rarityColor = getRarityMeta(rarityKey).color;
      const rarityEmoji = (() => {
        switch (rarityKey) {
          case 'Common': return '📦';
          case 'Uncommon': return '💚';
          case 'Rare': return '💎';
          case 'Epic': return '💜';
          case 'Legendary': return '🔥';
          default: return '📦';
        }
      })();
      const isBold = rarityKey === 'Rare' || rarityKey === 'Epic' || rarityKey === 'Legendary';
      const statTags = detail && detail.stats
        ? Object.entries(detail.stats)
            .filter(([, v]) => typeof v === 'number' && v !== 0)
            .map(([k, v]) => `<span style="color:#4f4;font-size:0.85em;margin-left:4px;">${v > 0 ? '+' : ''}${v} ${esc(k.toUpperCase())}</span>`)
            .join('')
        : '';
      const unequipBtn = itemId ? `<button class="inv-btn" data-action="unequip" data-slot="${esc(slot)}">Unequip</button>` : '';
      const nameHtml = itemId
        ? (rarityKey
            ? `${rarityEmoji} <span style="color: ${rarityColor};${isBold ? ' font-weight: bold;' : ''}">${esc(itemName)}</span>`
            : esc(itemName))
        : '—';
      return `<div>${esc(label)}</div><div>${nameHtml}${statTags} ${unequipBtn}</div>`;
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

    // Build inventory items list HTML with sort & filter
    const allItemsRaw = [...categorized.consumables, ...categorized.weapons, ...categorized.armors, ...categorized.accessories, ...categorized.unknown];
    const currentSort = invState.sortBy || SORT_MODES.TYPE;
    const currentFilter = invState.filterBy || FILTER_MODES.ALL;
    const allItems = filterAndSortItems(allItemsRaw, currentFilter, currentSort);
    const sortFilterHtml = renderSortFilterControls(currentSort, currentFilter, allItemsRaw.length, allItems.length);
    const itemRows = allItems.length === 0 ? '<div class="kv"><div><i>No items match filter</i></div><div></div></div>' :
      '<div class="kv">' + allItems.map(({ id, name, count, type, rarity }) => {
        const usable = type === 'consumable';
        const equippable = type === 'weapon' || type === 'armor' || type === 'accessory';
        const useBtn = usable ? `<button class="inv-btn" data-action="use" data-item="${esc(id)}">Use</button>` : '';
        let eqBtn = '';
        let comparisonHtml = '';
        if (equippable) {
          eqBtn = `<button class="inv-btn" data-action="equip" data-item="${esc(id)}">Equip</button>`;
          const comp = getEquipmentComparison(equipment, id);
          if (comp && comp.comparisons.length > 0) {
            const deltas = comp.comparisons
              .filter(c => c.diff !== 0)
              .map(c => {
                const sign = c.diff > 0 ? '+' : '';
                const color = c.diff > 0 ? '#4f4' : '#f44';
                const arrow = c.diff > 0 ? '\u2191' : '\u2193';
                const label = c.stat.charAt(0).toUpperCase() + c.stat.slice(1);
                return `<span style="color:${color};font-size:0.8em;margin-left:4px;" title="${label}: ${c.current} → ${c.candidate}">${sign}${c.diff} ${label} ${arrow}</span>`;
              }).join(' ');
            comparisonHtml = deltas || '<span style="color:#aaa;font-size:0.8em;margin-left:4px;">= same stats</span>';
          }
        }
        const detBtn = `<button class="inv-btn" data-action="details" data-item="${esc(id)}">Info</button>`;
        const rarityKey = typeof rarity === 'string' ? rarity : null;
        const rarityColor = getRarityMeta(rarityKey).color;
        const rarityBadge = rarityKey ? '[' + rarityKey + ']' : '';
        const rarityEmoji = (() => {
          switch (rarityKey) {
            case 'Common': return '📦';
            case 'Uncommon': return '💚';
            case 'Rare': return '💎';
            case 'Epic': return '💜';
            case 'Legendary': return '🔥';
            default: return '📦';
          }
        })();
        const isBold = rarityKey === 'Rare' || rarityKey === 'Epic' || rarityKey === 'Legendary';
        const nameStyle = 'color: ' + rarityColor + ';' + (isBold ? ' font-weight: bold;' : '');
        const badgeStyle = 'color: ' + rarityColor + '; font-size: 0.8em; opacity: 0.85; margin-left: 4px;';
        const rarityTag = rarityBadge ? ` <span style="${badgeStyle}">${esc(rarityBadge)}</span>` : '';
        return `<div>${rarityEmoji} <span style="${nameStyle}">${esc(name)}</span> <small style="color:#aaa;">(${esc(type)})</small>${rarityTag}</div><div><b>${count}</b> ${useBtn}${eqBtn}${detBtn}${comparisonHtml}</div>`;
      }).join('') + '</div>';

    // Item details screen
    let detailsHtml = '';
    if (invState.screen === INVENTORY_SCREENS.DETAILS && invState.selectedItem) {
      const detail = getItemDetails(invState.selectedItem);
      if (detail) {
        const rarityColor = getRarityMeta(detail?.rarity).color;
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
        // Add equipment comparison in details view
        const detailComp = getEquipmentComparison(equipment, invState.selectedItem);
        if (detailComp && detailComp.comparisons.length > 0) {
          const vsName = detailComp.currentItemName ? esc(detailComp.currentItemName) : '<i>nothing</i>';
          const compRows = detailComp.comparisons.map(c => {
            const sign = c.diff > 0 ? '+' : '';
            const color = c.diff > 0 ? '#4f4' : c.diff < 0 ? '#f44' : '#aaa';
            const arrow = c.diff > 0 ? ' \u2191' : c.diff < 0 ? ' \u2193' : '';
            const label = c.stat.charAt(0).toUpperCase() + c.stat.slice(1);
            return `<div>${esc(label)}</div><div style="color:${color};"><b>${sign}${c.diff}${arrow}</b> <small>(${c.current} → ${c.candidate})</small></div>`;
          }).join('');
          detailsHtml += `
            <div class="card" style="margin-top:8px;">
              <h3 style="color:#ccc;">Compared to: ${vsName} <small style="color:#888;">(${esc(detailComp.slot)})</small></h3>
              <div class="kv">${compRows}</div>
            </div>
          `;
        }
      }
    }

    const messageHtml = invState.message ? `<div class="card"><p class="good">${esc(invState.message)}</p></div>` : '';

    // Compute effective stats (base + equipment)
    const baseAtk = player?.atk ?? 0;
    const baseDef = player?.def ?? 0;
    const baseSpd = player?.spd ?? 0;
    const effectiveStats = getEffectiveCombatStats(player || {});
    const equipSetsHtml = renderEquipmentSetsPanel(equipment, { showInactive: true });

    // Equipment sets panel styles
    if (!document.getElementById('equipment-sets-panel-styles')) {
      const setsStyle = document.createElement('style');
      setsStyle.id = 'equipment-sets-panel-styles';
      setsStyle.textContent = getEquipmentSetsPanelStyles();
      document.head.appendChild(setsStyle);
    }

    hud.innerHTML = `
      <div class="row">
        <div class="card">
          <h2>Equipment</h2>
          <div class="kv">${eqRows}</div>
          ${hasBonuses ? `<h3 style="margin-top:8px;color:#aaa;">Total Bonuses</h3><div class="kv">${bonusSummaryRows}</div>` : ''}
        </div>
        <div class="card">
          <h2>Equipment Sets <button id="toggleSetsBtn" style="float:right;font-size:0.8em;">Show/Hide</button></h2>
          <div id="equipSetsContainer">${equipSetsHtml}</div>
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
        ${sortFilterHtml}
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

    // Wire sort select
    const sortSelect = document.getElementById('invSortSelect');
    if (sortSelect) {
      sortSelect.onchange = () => dispatch({ type: 'INVENTORY_SET_SORT', sortBy: sortSelect.value });
    }

    // Wire filter buttons
    actions.querySelectorAll('.inv-filter-btn').forEach(btn => {
      btn.onclick = () => dispatch({ type: 'INVENTORY_SET_FILTER', filterBy: btn.dataset.filter });
    });

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

    const toggleSetsBtn = document.getElementById('toggleSetsBtn');
    if (toggleSetsBtn) {
      const setsContainer = document.getElementById('equipSetsContainer');
      toggleSetsBtn.onclick = () => {
        if (!setsContainer) return;
        const isHidden = setsContainer.style.display === 'none';
        setsContainer.style.display = isHidden ? '' : 'none';
      };
    }

    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
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
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
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
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
    return;
  }

  if (state.phase === 'shop' && state.shopState) {
    const shopHtml = renderShopPanel(state.shopState, state.player, state.worldEvent || null);

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
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
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
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
    return;
  }

  if (state.phase === 'fled') {
    hud.innerHTML = `
      <div class="row">
        <div class="card">
          <h2>Escaped!</h2>
          <div>You successfully fled the battle.</div>
        </div>
      </div>
    `;
    actions.innerHTML = '<div class="buttons"><button id="btnContinueAfterFlee">Continue Exploring</button></div>';
    document.getElementById('btnContinueAfterFlee').onclick = () => dispatch({ type: 'CONTINUE_AFTER_FLEE' });
    log.innerHTML = state.log.slice().reverse().map((line) => formatLogEntryHtml(line)).join('');
    finalizeRender();
    return;
  }

  if (state.phase === 'companions') {
    hud.innerHTML = renderCompanionPanel(state);
    actions.innerHTML = '<div class="buttons"><button id="btnCloseCompanions">Close</button></div>';
    const closeBtn = document.getElementById('btnCloseCompanions');
    if (closeBtn) closeBtn.onclick = () => dispatch({ type: 'CLOSE_COMPANIONS' });
    // Wire recruit buttons
    hud.querySelectorAll('[data-action="RECRUIT_COMPANION"]').forEach(btn => {
      btn.onclick = () => dispatch({ type: 'RECRUIT_COMPANION', companionId: btn.dataset.companionId });
    });
    // Wire dismiss buttons
    hud.querySelectorAll('[data-action="DISMISS_COMPANION"]').forEach(btn => {
      btn.onclick = () => dispatch({ type: 'DISMISS_COMPANION', companionId: btn.dataset.companionId });
    });
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
    return;
  }

    if (state.phase === 'bestiary') {
    hud.innerHTML = renderBestiaryPanel(state);
    actions.innerHTML = '<div class="buttons"><button id="btnCloseBestiary">Close Bestiary</button></div>';
    // Wire close button
    const closeBtn = document.getElementById('btnCloseBestiary');
    if (closeBtn) closeBtn.onclick = () => dispatch({ type: 'CLOSE_BESTIARY' });
    // Also wire data-action close button from bestiary-ui
    const dataCloseBtn = hud.querySelector('[data-action="CLOSE_BESTIARY"]');
    if (dataCloseBtn) dataCloseBtn.onclick = () => dispatch({ type: 'CLOSE_BESTIARY' });
    const bestiarySort = document.getElementById('bestiarySort');
    if (bestiarySort) {
      bestiarySort.onchange = () => dispatch({ type: 'SORT_BESTIARY', sort: bestiarySort.value });
    }
    const bestiaryFilter = document.getElementById('bestiaryFilter');
    if (bestiaryFilter) {
      bestiaryFilter.onchange = () => dispatch({ type: 'FILTER_BESTIARY', filter: bestiaryFilter.value });
    }
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
    return;
  }

  if (state.phase === 'dungeon') {
    const dungeonHtml = renderDungeonPanel(state);
    hud.innerHTML = `
      <div class="row">
        <div class="card">
          <h2>${esc(state.player.name)}</h2>
          <div class="kv">
            <div>Class</div><div><b>${esc(state.player.classId ? state.player.classId[0].toUpperCase() + state.player.classId.slice(1) : 'Adventurer')}</b></div>
            <div>HP</div><div><b>${hpLine(state.player)}</b></div>
            <div>MP</div><div><b>${state.player.mp ?? 0} / ${state.player.maxMp ?? 0}</b></div>
            <div>Level</div><div><b>${state.player.level ?? 1}</b></div>
          </div>
        </div>
        ${dungeonHtml}
      </div>
    `;
    actions.innerHTML = renderDungeonActions(state);
    attachDungeonHandlers(dispatch);
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
    return;
  }

  if (state.phase === 'provisions') {
    const provisionsHtml = renderProvisionsPanel(state);
    hud.innerHTML = provisionsHtml;

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnCloseProvisions">Close Provisions</button>
      </div>
    `;

    attachProvisionsHandlers(dispatch);
    document.getElementById('btnCloseProvisions').onclick = () => dispatch({ type: 'CLOSE_PROVISIONS' });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => formatLogEntryHtml(line))
      .join('');
    finalizeRender();
    return;
  }

    if (state.phase === 'tavern-dice') {
    hud.innerHTML = renderTavernDicePanel(state);
    actions.innerHTML = '<div class="buttons"><button id="btnCloseTavern">Leave Tavern</button></div>';
    
    const closeBtn = document.getElementById('btnCloseTavern');
    if (closeBtn) closeBtn.onclick = () => dispatch({ type: 'CLOSE_TAVERN' });

    const btnEls = hud.querySelectorAll('button[data-action]');
    for (const btn of btnEls) {
      btn.onclick = () => {
        dispatch({
          type: btn.getAttribute('data-action'),
          wager: btn.getAttribute('data-wager'),
          guess: btn.getAttribute('data-guess')
        });
      };
    }
    log.innerHTML = state.log.slice().reverse().map(line => formatLogEntryHtml(line)).join('');
    finalizeRender();
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
    .map((line) => formatLogEntryHtml(line))
    .join('');
  finalizeRender();
}
