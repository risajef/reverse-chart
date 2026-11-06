const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('hover retains pinned measurement markers outside the lens', () => {
  const {run} = app();
  run(`state.image={width:800,height:600};state.hover={x:1,y:1};
    state.measurements=[{x:400,y:300},{x:500,y:300}];var labels=[];
    drawMarker=(point,color,label)=>labels.push(label);draw();`);
  assert.equal(run(`labels.join(',')`), '1,2');
});
