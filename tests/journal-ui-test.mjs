import test from 'node:test';

test('journal ui module can be imported', async () => {
  const module = await import('../src/journal-ui.js');
  if (!module) {
    throw new Error('Expected journal-ui module to load');
  }
});
