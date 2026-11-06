const {test} = require('node:test');
const assert = require('node:assert/strict');
const {app} = require('./harness.cjs');

test('small finite values retain magnitude instead of displaying zero', () => {
  const {run} = app();
  for (const value of ['1e-13', '-1e-13', '5e-324', '1e300']) {
    const text = run(`formatValue(${value},'x')`);
    assert.notEqual(text, '0');
    assert.match(text, /E/);
  }
  assert.equal(run('formatValue(0)'), '0');
  assert.equal(run('formatValue(12.5)'), '12.5');
});
