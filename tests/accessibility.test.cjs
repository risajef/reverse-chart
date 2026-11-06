const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('selected mode is available through pressed state', () => {
  const {run, element} = app();
  run(`setMode('measure')`);
  assert.equal(element('#measureMode')['aria-pressed'], 'true');
  assert.equal(element('#calibrateMode')['aria-pressed'], 'false');
  run(`setMode('calibrate')`);
  assert.equal(element('#measureMode')['aria-pressed'], 'false');
  assert.equal(element('#calibrateMode')['aria-pressed'], 'true');
});
