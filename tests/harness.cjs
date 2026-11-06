const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function app() {
  const elements = new Map();
  const images = [];
  const revoked = [];
  const frames = [];
  const context = new Proxy({measureText: () => ({width: 10})}, {
    get: (target, key) => target[key] || (() => {}),
  });
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: '', valueAsNumber: NaN, validity: {valid: true}, style: {}, children: [], listeners: {},
      classList: {add() {}, remove() {}, toggle() {}},
      setAttribute(key, value) { this[key] = value; },
      addEventListener(type, callback) { this.listeners[type] = callback; },
      append(...children) { this.children.push(...children); }, focus() {}, click() {},
      width: 800, height: 600, clientWidth: 1000,
      getContext: () => context,
      getBoundingClientRect: () => ({left: 0, top: 0, width: 800, height: 600}),
    });
    return elements.get(id);
  }
  const sandbox = {
    console, Intl, Blob, setTimeout, structuredClone,
    URL: {createObjectURL: () => `blob:${images.length}`, revokeObjectURL: url => revoked.push(url)},
    Image: function() { images.push(this); },
    requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
    getComputedStyle: () => ({getPropertyValue: () => '#123456'}),
    document: {querySelector: element, createElement: () => element(Symbol()),
      addEventListener() {}, documentElement: {}},
    window: {innerHeight: 900, addEventListener() {}},
  };
  vm.createContext(sandbox);
  for (const file of ['core.js', 'project.js', 'app.js']) {
    const filename = path.join(__dirname, '..', file);
    if (fs.existsSync(filename)) vm.runInContext(fs.readFileSync(filename, 'utf8'), sandbox);
  }
  const run = code => vm.runInContext(code, sandbox);
  return {run, element, images, revoked, frames};
}
module.exports = {app};
