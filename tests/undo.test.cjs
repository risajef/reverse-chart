const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('remove, clear, and scale changes can be undone without losing other points', () => {
  const {run, element} = app();
  run(`state.calibration=[{id:'a',axis:'x',x:0,y:0,value:0},{id:'b',axis:'x',x:100,y:0,value:10}];
    state.measurements=[{id:'c',x:20,y:30}]; removePoint('calibration','a');`);
  assert.equal(run('state.calibration.length'), 1);
  assert.equal(run('state.measurements.length'), 1);
  run('undo()');assert.equal(run('state.calibration.length'), 2);
  element('#clearMeasurements').listeners.click();
  assert.equal(run('state.measurements.length'), 0);
  run('undo()');assert.equal(run('state.measurements.length'), 1);
  element('#xScaleInput').value = 'log';element('#xScaleInput').listeners.change();
  run('undo()');assert.equal(run('state.scales.x'), 'linear');
});

test('image replacement is recoverable and undo cancels pending loads', () => {
  const {run, images} = app();
  run(`state.image={width:100,height:100};state.imageName='original';
    state.measurements=[{id:'a',x:1,y:1}];loadImage('new','new');`);
  Object.assign(images[0], {width:200,height:100});images[0].onload();
  assert.equal(run('state.measurements.length'), 0);
  run(`loadImage('pending','pending');undo();`);
  Object.assign(images[1], {width:100,height:100});images[1].onload();
  assert.equal(run('state.imageName'), 'original');
  assert.equal(run('state.measurements.length'), 1);
});
