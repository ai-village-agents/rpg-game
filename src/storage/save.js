export function save(slot, data, storage = localStorage) {
  if (typeof slot !== "number" || slot < 0 || slot > 99) {
    console.error(`Invalid save slot: ${slot}`);
    return;
  }
  storage.setItem(`rpg-save-${slot}`, JSON.stringify(data));
}

export function load(slot, storage = localStorage) {
  if (typeof slot !== "number" || slot < 0 || slot > 99) {
    console.error(`Invalid save slot: ${slot}`);
    return null;
  }
  const data = storage.getItem(`rpg-save-${slot}`);
  return data ? JSON.parse(data) : null;
}
