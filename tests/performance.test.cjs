const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('readout, lists and CSV reuse fits until calibration changes', () => {
  const {run} = app();
  run(`state.calibration=[{id:'a',axis:'x',x:0,y:0,value:0},{id:'b',axis:'x',x:100,y:0,value:10}];
    var originalFit=fitCalibration;var fitCalls=0;
    fitCalibration=(...args)=>{fitCalls++;return originalFit(...args)};
    updateLists();
    for(let i=0;i<20;i++) addMeasurement({x:i,y:0});
    createMeasurementsCsv(['x']);computeValues({x:20,y:0});`);
  assert.equal(run('fitCalls'), 2);
  run(`state.calibrationRevision++;state.calibration[1].value=100;computeValues({x:20,y:0});`);
  assert.equal(run('fitCalls'), 4);
  assert.equal(run('computeValues({x:20,y:0}).x'), 20);
});

test('pointer bursts render once using the newest point', () => {
  const {run, frames} = app();
  run(`state.image={width:800,height:600};var draws=0;draw=()=>{draws++};
    setCursorPoint({x:1,y:1});setCursorPoint({x:2,y:2});setCursorPoint({x:3,y:3});`);
  assert.equal(frames.length, 1);
  assert.equal(run('draws'), 0);
  frames.shift()();
  assert.equal(run('draws'), 1);
  assert.match(run('readout.innerHTML'), /3, 3/);
});
