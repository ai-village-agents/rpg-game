import { saveToLocalStorage } from './state.js';
import { CLASS_DEFINITIONS } from './characters/classes.js';

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

export function render(state, dispatch) {
  const hud = document.getElementById('hud');
  const actions = document.getElementById('actions');
  const log = document.getElementById('log');

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
    hud.innerHTML = `
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

        <div class="card">
          <h2>Exploration</h2>
          <div class="kv">
            <div>Phase</div><div><b>${esc(state.phase)}</b></div>
          </div>
        </div>
      </div>
    `;

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnNorth">North</button>
        <button id="btnSouth">South</button>
        <button id="btnWest">West</button>
        <button id="btnEast">East</button>
        <button id="btnSeek">Seek Battle</button>
        <button id="btnInventory">Inventory</button>
        <button id="btnSave">Save</button>
        <button id="btnLoad">Load</button>
      </div>
    `;

    document.getElementById('btnNorth').onclick = () => dispatch({ type: 'EXPLORE', direction: 'north' });
    document.getElementById('btnSouth').onclick = () => dispatch({ type: 'EXPLORE', direction: 'south' });
    document.getElementById('btnWest').onclick = () => dispatch({ type: 'EXPLORE', direction: 'west' });
    document.getElementById('btnEast').onclick = () => dispatch({ type: 'EXPLORE', direction: 'east' });
    document.getElementById('btnSeek').onclick = () => dispatch({ type: 'SEEK_ENCOUNTER' });
    document.getElementById('btnInventory').onclick = () => dispatch({ type: 'VIEW_INVENTORY' });
    document.getElementById('btnSave').onclick = () => dispatch({ type: 'SAVE' });
    document.getElementById('btnLoad').onclick = () => dispatch({ type: 'LOAD' });

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
            <div>ATK / DEF</div><div><b>${state.player.atk}</b> / <b>${state.player.def}</b></div>
            <div>Defending</div><div><b>${state.player.defending ? 'Yes' : 'No'}</b></div>
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

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnAttack" ${!isPlayerTurn ? 'disabled' : ''}>Attack</button>
        <button id="btnDefend" ${!isPlayerTurn ? 'disabled' : ''}>Defend</button>
        <button id="btnPotion" ${!isPlayerTurn ? 'disabled' : ''}>Use Potion</button>
      </div>
    `;

    document.getElementById('btnAttack').onclick = () => dispatch({ type: 'PLAYER_ATTACK' });
    document.getElementById('btnDefend').onclick = () => dispatch({ type: 'PLAYER_DEFEND' });
    document.getElementById('btnPotion').onclick = () => dispatch({ type: 'PLAYER_POTION' });

    log.innerHTML = state.log
      .slice()
      .reverse()
      .map((line) => `<div class="logLine">${esc(line)}</div>`)
      .join('');
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

    actions.innerHTML = `
      <div class="buttons">
        <button id="btnContinue">Continue Exploring</button>
        <button id="btnSave">Save</button>
      </div>
    `;

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
