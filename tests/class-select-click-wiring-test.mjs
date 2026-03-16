import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/render.js';

class ElementMock {
  constructor(id, document) {
    this.id = id || null;
    this.document = document;
    this._innerHTML = '';
    this.value = '';
    this.dataset = {};
    this.onclick = null;
    this._classButtons = [];
    this._nameInput = null;
    this._difficultySelect = null;
    this.classList = { add: () => {} };
  }

  set innerHTML(html) {
    this._innerHTML = html || '';
    this._classButtons = [];
    this._nameInput = null;
    this._difficultySelect = null;

    const classMatches = [...this._innerHTML.matchAll(/<button[^>]*data-class="([^"]+)"[^>]*>/g)];
    this._classButtons = classMatches.map(([, classId]) => {
      const btn = new ElementMock(null, this.document);
      btn.dataset = { class: classId };
      return btn;
    });

    if (this._innerHTML.includes('id="class-select-name"')) {
      this._nameInput = new ElementMock('class-select-name', this.document);
      this._nameInput.value = '';
      this.document.registerElement(this._nameInput);
    }

    if (this._innerHTML.includes('id="difficulty-select"')) {
      this._difficultySelect = new ElementMock('difficulty-select', this.document);
      this._difficultySelect.value = 'normal';
      this.document.registerElement(this._difficultySelect);
    }

    if (this.id && this.document) {
      this.document.registerElement(this);
    }
  }

  get innerHTML() {
    return this._innerHTML;
  }

  insertAdjacentHTML(position, html) {
    // Preserve existing node references/handlers while appending markup text.
    this._innerHTML = (this._innerHTML || '') + (html || '');
  }

  appendChild(el) {
    if (el?.id) this.document.registerElement(el);
    return el;
  }

  querySelector(selector) {
    if (selector === '#class-select-name') return this._nameInput;
    if (selector === '#difficulty-select') return this._difficultySelect;
    return null;
  }

  querySelectorAll(selector) {
    if (selector === 'button[data-class]') return this._classButtons;
    return [];
  }

  focus() {
    // no-op
  }
}

class DocumentMock {
  constructor() {
    this.elements = {};
    this.head = new ElementMock('head', this);
    this.body = new ElementMock('body', this);
    this.registerElement(this.head);
    this.registerElement(this.body);
    this.registerElement(new ElementMock('hud', this));
    this.registerElement(new ElementMock('actions', this));
    this.registerElement(new ElementMock('log', this));
  }

  registerElement(el) {
    if (el?.id) this.elements[el.id] = el;
  }

  createElement() {
    return new ElementMock(null, this);
  }

  getElementById(id) {
    return this.elements[id] || null;
  }
}

test('class select buttons remain wired when tutorial hint is visible', () => {
  const originalDocument = globalThis.document;
  const originalLocalStorage = globalThis.localStorage;
  const mockDocument = new DocumentMock();
  globalThis.document = mockDocument;
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };

  const dispatches = [];
  const dispatch = (action) => dispatches.push(action);

  const state = {
    phase: 'class-select',
    log: ['Welcome to AI Village RPG! Select your class.'],
    tutorialState: {
      completedSteps: [],
      currentHint: {
        id: 'welcome',
        trigger: 'class-select',
        title: 'Welcome, Adventurer!',
        message: 'Choose a class to begin your journey.',
        position: 'center',
      },
      hintsEnabled: true,
    },
  };

  try {
    render(state, dispatch);
    const hud = mockDocument.getElementById('hud');
    const classButtons = hud.querySelectorAll('button[data-class]');
    assert.ok(classButtons.length > 0, 'expected class buttons to render');
    assert.equal(typeof classButtons[0].onclick, 'function', 'class button should be wired');

    classButtons[0].onclick();
    assert.equal(dispatches.length, 1, 'click should dispatch an action');
    assert.equal(dispatches[0].type, 'SELECT_CLASS');
  } finally {
    if (originalDocument === undefined) {
      delete globalThis.document;
    } else {
      globalThis.document = originalDocument;
    }

    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
  }
});
