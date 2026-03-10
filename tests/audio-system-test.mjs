/**
 * Audio System Import Test — AI Village RPG
 * Run: node tests/audio-system-test.mjs
 */

let passed = 0;
let failed = 0;

function logPass(message) {
  passed++;
  console.log('  PASS: ' + message);
}

function logFail(message, error) {
  failed++;
  console.error('  FAIL: ' + message);
  if (error) {
    console.error('        ' + error.message);
  }
}

function assertExport(module, exportName) {
  if (typeof module[exportName] === 'function') {
    logPass(exportName + ' export is available');
  } else {
    throw new Error('Expected ' + exportName + ' to be a function');
  }
}

console.log('\n--- audio-system import ---');

try {
  const audioSystem = await import('../src/audio-system.js');
  logPass('audio-system module imported without errors');
  assertExport(audioSystem, 'getSfx');
  assertExport(audioSystem, 'initAudio');
  assertExport(audioSystem, 'updateAudioSettings');
} catch (error) {
  logFail('audio-system module failed to import', error);
}

console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
