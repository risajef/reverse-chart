const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('saved/restored project reproduces values and CSV with original pixels', () => {
  const {run, images} = app();
  run(`state.image={width:100,height:100};state.imageName='example';
    state.calibration=[{id:'a',axis:'x',x:0,y:0,value:0},{id:'b',axis:'x',x:100,y:0,value:10}];
    state.measurements=[{id:'c',x:20,y:30}];
    var originalCsv=createMeasurementsCsv(['x']);
    var saved=validateProject(JSON.parse(JSON.stringify(createProject('data:image/png;base64,AAAA'))));
    state.calibration=[];state.measurements=[];
    loadImage(saved.image.data,saved.image.name,false,saved);`);
  Object.assign(images[0], {width:100,height:100});images[0].onload();
  assert.equal(run(`createMeasurementsCsv(['x'])`), run('originalCsv'));
  run(`state.calibrationRevision++; state.calibration[1].value=100; updateFitStatus();`);
  assert.match(run(`createMeasurementsCsv(['x'])`), /1,20,20,30/);
  assert.match(run('fitStatus.textContent'), /revision 1.*current calibration/);
});

test('project validation rejects unknown schema, external images, invalid points and duplicate IDs', () => {
  const {run} = app();
  run(`state.image={width:100,height:100}; var saved=createProject('data:image/png;base64,AAAA');`);
  for (const mutation of ["p.schemaVersion=2", "p.image.data='https://example.com/a.png'",
    "p.scales.x='bad'", "p.measurements=[{id:'a',x:101,y:1}]",
    "p.measurements=[{id:'a',x:1,y:1},{id:'a',x:2,y:2}]"]) {
    assert.throws(() => run(`{const p=structuredClone(saved);${mutation};validateProject(p)}`), /Invalid or unsupported/);
  }
});

test('project save applies import validation and byte limits', () => {
  const {run} = app();
  run(`state.image={width:100,height:100};var saved=createProject('data:image/png;base64,AAAA');`);
  assert.equal(run('validateProject(JSON.parse(serializeProject(saved))).schemaVersion'), 1);
  assert.throws(() => run(`serializeProject({...saved,schemaVersion:2})`), /Invalid or unsupported/);
  run(`Blob=class {size=64*1024*1024+1}`);
  assert.throws(() => run('serializeProject(saved)'), /64 MiB/);
});

test('capture cannot exceed project point limits', () => {
  const {run} = app();
  run(`state.calibration=Array.from({length:MAX_POINTS},()=>({}));
    state.measurements=Array.from({length:MAX_POINTS},()=>({}));
    addCalibration({x:1,y:1});addMeasurement({x:1,y:1});`);
  assert.equal(run('state.calibration.length'), 10000);
  assert.equal(run('state.measurements.length'), 10000);
  assert.equal(run('undoHistory.length'), 0);
});
