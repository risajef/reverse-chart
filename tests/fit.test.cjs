const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('pure fitting handles linear, reversed, log, and offset pixels', () => {
  const {run} = app();
  assert.equal(run(`evaluateFit(fitCalibration([{axis:'x',x:0,value:0},{axis:'x',x:100,value:10}], 'x','linear'),50).value`), 5);
  assert.equal(run(`evaluateFit(fitCalibration([{axis:'y',y:0,value:20},{axis:'y',y:100,value:0}], 'y','linear'),25).value`), 15);
  assert.equal(run(`evaluateFit(fitCalibration([{axis:'x',x:0,value:1},{axis:'x',x:100,value:100}], 'x','log'),50).value`), 10);
  assert.equal(run(`evaluateFit(fitCalibration([{axis:'x',x:1e9,value:5},{axis:'x',x:1e9+1,value:6}], 'x','linear'),1e9+.5).value`), 5.5);
});

test('fit and evaluation failures are explicit, with residual diagnostics', () => {
  const {run} = app();
  assert.equal(run(`fitCalibration([], 'x','linear').status`), 'insufficient-points');
  assert.equal(run(`fitCalibration([{axis:'x',x:1,value:1},{axis:'x',x:1,value:2}], 'x','linear').status`), 'insufficient-pixel-span');
  assert.equal(run(`fitCalibration([{axis:'x',x:1,value:5},{axis:'x',x:2,value:5}], 'x','linear').status`), 'degenerate-value-range');
  assert.equal(run(`fitCalibration([{axis:'x',x:0,value:-1e308},{axis:'x',x:100,value:1e308}], 'x','linear').status`), 'nonfinite-fit');
  for (const pixel of [200, -200]) assert.equal(run(`evaluateFit(fitCalibration([{axis:'x',x:0,value:1},{axis:'x',x:1,value:100}], 'x','log'),${pixel}).status`), 'out-of-range');
  assert.ok(run(`fitCalibration([{axis:'x',x:0,value:0},{axis:'x',x:1,value:5},{axis:'x',x:2,value:2}], 'x','linear').maxResidual`) > 0);
  run(`state.calibration=[{axis:'x',x:1,value:1},{axis:'x',x:1,value:2}]; updateFitStatus();`);
  assert.match(run('fitStatus.textContent'), /distinct pixel/);
  assert.doesNotMatch(run('fitStatus.textContent'), /0 more/);
});
