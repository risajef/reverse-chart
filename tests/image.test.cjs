const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('only newest image completion can reset a session; URLs release once', () => {
  const {run, images, revoked} = app();
  run(`loadImage('blob:a','older',true); loadImage('blob:b','newer',true);`);
  Object.assign(images[0], {width: 100, height: 100});
  Object.assign(images[1], {width: 200, height: 100});
  images[1].onload();
  run(`state.calibration.push({axis:'x',x:1,y:1,value:1});`);
  images[0].onload();
  assert.equal(run('state.imageName'), 'newer');
  assert.equal(run('state.calibration.length'), 1);
  assert.deepEqual(revoked.sort(), ['blob:a', 'blob:b']);
});

test('a failed replacement retains the active chart and points', () => {
  const {run, images, revoked} = app();
  run(`state.image={width:100,height:100};state.imageName='active';
    state.measurements=[{x:2,y:3}];loadImage('blob:broken','broken',true);`);
  images[0].onerror();
  assert.equal(run('state.imageName'), 'active');
  assert.equal(run('state.measurements.length'), 1);
  assert.match(run('readout.textContent'), /Could not load/);
  assert.deepEqual(revoked, ['blob:broken']);
});
