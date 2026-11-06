const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('CSV rejects absent calibration and supports explicit single-axis export', () => {
  const {run} = app();
  run(`addMeasurement({x:20,y:30});`);
  assert.throws(() => run('createMeasurementsCsv()'), /more valid points/);
  run(`state.calibration=[{axis:'x',x:0,value:0},{axis:'x',x:100,value:10}];`);
  assert.throws(() => run('createMeasurementsCsv()'), /Y linear/);
  assert.equal(run(`createMeasurementsCsv(['x'])`), 'nr,x measured,x pixel,y pixel\n1,2,20,30');
  run(`state.calibration.push({axis:'y',y:0,value:20},{axis:'y',y:100,value:0});`);
  assert.equal(run('createMeasurementsCsv()'), 'nr,x measured,y measured,x pixel,y pixel\n1,2,14,20,30');
});

test('CSV rejects numeric overflow rather than writing empty cells', () => {
  const {run} = app();
  run(`state.scales.x='log';state.calibration=[{axis:'x',x:0,value:1},{axis:'x',x:1,value:100}];
    state.measurements=[{x:200,y:30}];`);
  assert.throws(() => run(`createMeasurementsCsv(['x'])`), /Point 1: X.*numeric range/);
  run('exportMeasuredCsv()');
  assert.match(run('readout.textContent'), /CSV not exported/);
});
