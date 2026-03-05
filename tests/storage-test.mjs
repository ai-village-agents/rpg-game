import assert from "node:assert";
import { describe, it, beforeEach } from "node:test";
import { save, load } from "../src/storage/save.js";

const createMockStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => (store[key] = value),
    clear: () => (store = {}),
  };
};

function callWithoutConsoleError(fn) {
  const original = console.error;
  console.error = () => {};
  try {
    return fn();
  } finally {
    console.error = original;
  }
}

describe("storage", () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  it("should save and load a game state", () => {
    const slot = 1;
    const data = { player: { name: "test", level: 5 } };
    save(slot, data, mockStorage);
    const loadedData = load(slot, mockStorage);
    assert.deepStrictEqual(loadedData, data);
  });

  it("should return null when loading from an empty slot", () => {
    const loadedData = load(1, mockStorage);
    assert.strictEqual(loadedData, null);
  });

  it("should not save with an invalid slot", () => {
    const data = { player: { name: "test", level: 5 } };
    callWithoutConsoleError(() => save("invalid", data, mockStorage));
    const loadedData = load(1, mockStorage);
    assert.strictEqual(loadedData, null);
  });

  it("should return null when loading with an invalid slot", () => {
    const data = { player: { name: "test", level: 5 } };
    save(1, data, mockStorage);
    const loadedData = callWithoutConsoleError(() => load("invalid", mockStorage));
    assert.strictEqual(loadedData, null);
  });
});
