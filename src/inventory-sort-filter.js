// Inventory Sort & Filter Module
// Provides sorting and filtering for the inventory item list
// Created by Claude Opus 4.6 (Day 344)

/**
 * Sort mode constants
 */
export const SORT_MODES = {
  NAME_ASC: 'name-asc',
  NAME_DESC: 'name-desc',
  TYPE: 'type',
  RARITY_ASC: 'rarity-asc',
  RARITY_DESC: 'rarity-desc',
  VALUE_ASC: 'value-asc',
  VALUE_DESC: 'value-desc',
  STAT_TOTAL_DESC: 'stat-total-desc',
};

/**
 * Filter mode constants
 */
export const FILTER_MODES = {
  ALL: 'all',
  CONSUMABLE: 'consumable',
  WEAPON: 'weapon',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
  EQUIPPABLE: 'equippable',
};

/**
 * Human-readable labels for sort modes
 */
export const SORT_LABELS = {
  [SORT_MODES.NAME_ASC]: 'Name (A→Z)',
  [SORT_MODES.NAME_DESC]: 'Name (Z→A)',
  [SORT_MODES.TYPE]: 'Type',
  [SORT_MODES.RARITY_ASC]: 'Rarity ↑',
  [SORT_MODES.RARITY_DESC]: 'Rarity ↓',
  [SORT_MODES.VALUE_ASC]: 'Value ↑',
  [SORT_MODES.VALUE_DESC]: 'Value ↓',
  [SORT_MODES.STAT_TOTAL_DESC]: 'Stats ↓',
};

/**
 * Human-readable labels for filter modes
 */
export const FILTER_LABELS = {
  [FILTER_MODES.ALL]: 'All',
  [FILTER_MODES.CONSUMABLE]: 'Consumables',
  [FILTER_MODES.WEAPON]: 'Weapons',
  [FILTER_MODES.ARMOR]: 'Armor',
  [FILTER_MODES.ACCESSORY]: 'Accessories',
  [FILTER_MODES.EQUIPPABLE]: 'Equippable',
};

/** Rarity tier ordering (higher = rarer) */
const RARITY_ORDER = {
  'Common': 0,
  'Uncommon': 1,
  'Rare': 2,
  'Epic': 3,
  'Legendary': 4,
};

/** Type ordering for type-based sort */
const TYPE_ORDER = {
  'consumable': 0,
  'weapon': 1,
  'armor': 2,
  'accessory': 3,
};

/**
 * Get the total stat value of an item (sum of all numeric stat values).
 * @param {object} item - Item entry with .stats
 * @returns {number}
 */
function getStatTotal(item) {
  if (!item || !item.stats) return 0;
  return Object.values(item.stats).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
}

/**
 * Get the rarity order number for an item.
 * @param {object} item
 * @returns {number}
 */
function getRarityOrder(item) {
  if (!item || !item.rarity) return -1;
  return RARITY_ORDER[item.rarity] !== undefined ? RARITY_ORDER[item.rarity] : -1;
}

/**
 * Get the type order number for an item.
 * @param {object} item
 * @returns {number}
 */
function getTypeOrder(item) {
  if (!item || !item.type) return 99;
  return TYPE_ORDER[item.type] !== undefined ? TYPE_ORDER[item.type] : 99;
}

/**
 * Filter an array of inventory item entries by the given filter mode.
 * Each item entry should have at least { id, name, type, count }.
 * @param {Array} itemList - Array of inventory item entries
 * @param {string} filterMode - One of FILTER_MODES values
 * @returns {Array} Filtered array
 */
export function filterItems(itemList, filterMode) {
  if (!Array.isArray(itemList)) return [];
  if (!filterMode || filterMode === FILTER_MODES.ALL) return [...itemList];

  return itemList.filter(item => {
    switch (filterMode) {
      case FILTER_MODES.CONSUMABLE:
        return item.type === 'consumable';
      case FILTER_MODES.WEAPON:
        return item.type === 'weapon';
      case FILTER_MODES.ARMOR:
        return item.type === 'armor';
      case FILTER_MODES.ACCESSORY:
        return item.type === 'accessory';
      case FILTER_MODES.EQUIPPABLE:
        return item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory';
      default:
        return true;
    }
  });
}

/**
 * Sort an array of inventory item entries by the given sort mode.
 * Returns a new sorted array (does not mutate original).
 * @param {Array} itemList - Array of inventory item entries
 * @param {string} sortMode - One of SORT_MODES values
 * @returns {Array} Sorted array
 */
export function sortItems(itemList, sortMode) {
  if (!Array.isArray(itemList)) return [];
  const sorted = [...itemList];

  switch (sortMode) {
    case SORT_MODES.NAME_ASC:
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      break;
    case SORT_MODES.NAME_DESC:
      sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      break;
    case SORT_MODES.TYPE:
      sorted.sort((a, b) => {
        const typeDiff = getTypeOrder(a) - getTypeOrder(b);
        if (typeDiff !== 0) return typeDiff;
        return (a.name || '').localeCompare(b.name || '');
      });
      break;
    case SORT_MODES.RARITY_ASC:
      sorted.sort((a, b) => {
        const rarDiff = getRarityOrder(a) - getRarityOrder(b);
        if (rarDiff !== 0) return rarDiff;
        return (a.name || '').localeCompare(b.name || '');
      });
      break;
    case SORT_MODES.RARITY_DESC:
      sorted.sort((a, b) => {
        const rarDiff = getRarityOrder(b) - getRarityOrder(a);
        if (rarDiff !== 0) return rarDiff;
        return (a.name || '').localeCompare(b.name || '');
      });
      break;
    case SORT_MODES.VALUE_ASC:
      sorted.sort((a, b) => {
        const valDiff = (a.value || 0) - (b.value || 0);
        if (valDiff !== 0) return valDiff;
        return (a.name || '').localeCompare(b.name || '');
      });
      break;
    case SORT_MODES.VALUE_DESC:
      sorted.sort((a, b) => {
        const valDiff = (b.value || 0) - (a.value || 0);
        if (valDiff !== 0) return valDiff;
        return (a.name || '').localeCompare(b.name || '');
      });
      break;
    case SORT_MODES.STAT_TOTAL_DESC:
      sorted.sort((a, b) => {
        const statDiff = getStatTotal(b) - getStatTotal(a);
        if (statDiff !== 0) return statDiff;
        return (a.name || '').localeCompare(b.name || '');
      });
      break;
    default:
      // No sort — keep original order
      break;
  }

  return sorted;
}

/**
 * Apply both filter and sort to an item list.
 * @param {Array} itemList
 * @param {string} filterMode
 * @param {string} sortMode
 * @returns {Array}
 */
export function filterAndSortItems(itemList, filterMode, sortMode) {
  const filtered = filterItems(itemList, filterMode);
  return sortItems(filtered, sortMode);
}

/**
 * Render the sort/filter control bar HTML.
 * @param {string} currentSort - Current sort mode
 * @param {string} currentFilter - Current filter mode
 * @param {number} totalCount - Total items before filter
 * @param {number} filteredCount - Items after filter
 * @returns {string} HTML string
 */
export function renderSortFilterControls(currentSort, currentFilter, totalCount, filteredCount) {
  const sortOptions = Object.entries(SORT_LABELS)
    .map(([val, label]) => {
      const selected = val === currentSort ? ' selected' : '';
      return `<option value="${val}"${selected}>${label}</option>`;
    })
    .join('');

  const filterButtons = Object.entries(FILTER_LABELS)
    .map(([val, label]) => {
      const active = val === currentFilter ? ' style="background:#4a9eff;color:#fff;border-color:#4a9eff;"' : '';
      return `<button class="inv-filter-btn" data-filter="${val}"${active}>${label}</button>`;
    })
    .join(' ');

  const countText = totalCount !== filteredCount
    ? `<span style="color:#aaa;font-size:0.85em;margin-left:8px;">Showing ${filteredCount} of ${totalCount}</span>`
    : `<span style="color:#aaa;font-size:0.85em;margin-left:8px;">${totalCount} items</span>`;

  return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px;padding:4px 0;">
    <label style="color:#ccc;font-size:0.9em;">Sort:</label>
    <select id="invSortSelect" style="background:#1a1a2e;color:#ccc;border:1px solid #444;border-radius:4px;padding:2px 6px;font-size:0.9em;">
      ${sortOptions}
    </select>
    <span style="color:#555;margin:0 4px;">|</span>
    <label style="color:#ccc;font-size:0.9em;">Filter:</label>
    ${filterButtons}
    ${countText}
  </div>`;
}
