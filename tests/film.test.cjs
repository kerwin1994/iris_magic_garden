const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(new URL('../src/film.js', `file://${__filename}`), 'utf8');
function load(supports, hasCanvas = true) {
    const Recorder = supports && { isTypeSupported: supports };
    const context = vm.createContext({ window: { MediaRecorder: Recorder }, MediaRecorder: Recorder, HTMLCanvasElement: { prototype: hasCanvas ? { captureStream() {} } : {} } });
    vm.runInContext(source, context);
    return context.window.GardenFilm;
}
test('a colors-only session excludes unplayed fruit and animal scenes', () => {
    const scenes = load().scenesFor(['red', 'yellow', 'blue']);
    assert.equal(scenes.length, 3);
    assert.deepEqual(Array.from(scenes[1].items), ['red', 'yellow', 'blue']);
    assert.match(scenes.at(-1).subtitle, /^3 little words/);
});
test('a complete session includes all learned word groups', () => {
    const scenes = load().scenesFor(['apple', 'banana', 'orange', 'bunny', 'cat', 'dog', 'red', 'yellow', 'blue']);
    assert.equal(scenes.length, 5);
    assert.equal(scenes.slice(1, -1).flatMap(scene => Array.from(scene.items)).length, 9);
    assert.match(scenes.at(-1).subtitle, /^9 little words/);
});
test('only completed words appear within an activity scene', () => {
    assert.deepEqual(Array.from(load().scenesFor(['banana'])[1].items), ['banana']);
});
test('prefers MP4 when the browser supports it', () => {
    assert.equal(load(type => type === 'video/mp4' || type === 'video/webm').supportedType(), 'video/mp4');
});
test('falls back to WebM without pretending it is MP4', () => {
    assert.equal(load(type => type === 'video/webm;codecs=vp8,opus').supportedType(), 'video/webm;codecs=vp8,opus');
});
test('disables export if recording or canvas capture is unavailable', () => {
    assert.equal(load().supportedType(), '');
    assert.equal(load(() => false).supportedType(), '');
    assert.equal(load(() => true, false).supportedType(), '');
});
