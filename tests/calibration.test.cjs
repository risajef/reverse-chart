const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('blank and malformed calibration do not add points; explicit linear zero does', () => {
  const {run} = app();
  run(`axisInput.value = 'x'; valueInput.value = ''; valueInput.valueAsNumber = NaN;
    addCalibration({x: 10, y: 20});`);
  assert.equal(run('state.calibration.length'), 0);
  run(`valueInput.value = '1e'; valueInput.validity.valid = false;
    addCalibration({x: 10, y: 20});`);
  assert.equal(run('state.calibration.length'), 0);
  run(`valueInput.value = '0'; valueInput.valueAsNumber = 0; valueInput.validity.valid = true;
    addCalibration({x: 10, y: 20});`);
  assert.equal(run('state.calibration[0].value'), 0);
  run(`state.scales.x = 'log'; addCalibration({x: 20, y: 20});`);
  assert.equal(run('state.calibration.length'), 1);
});
