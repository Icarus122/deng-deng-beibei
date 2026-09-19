import test from 'node:test';
import assert from 'node:assert/strict';

import { AUDIO_EVENT_NAMES, createGameAudio } from '../audio.js';

class FakeAudioParam {
  constructor() {
    this.events = [];
  }

  setValueAtTime(value, time) {
    this.events.push({ type: 'set', value, time });
  }

  exponentialRampToValueAtTime(value, time) {
    this.events.push({ type: 'ramp', value, time });
  }
}

class FakeOscillator {
  constructor() {
    this.frequency = new FakeAudioParam();
    this.connections = [];
    this.startTime = null;
    this.stopTime = null;
  }

  connect(node) {
    this.connections.push(node);
  }

  disconnect() {}

  start(time) {
    this.startTime = time;
  }

  stop(time) {
    this.stopTime = time;
  }
}

class FakeGain {
  constructor() {
    this.gain = new FakeAudioParam();
    this.connections = [];
  }

  connect(node) {
    this.connections.push(node);
  }

  disconnect() {}
}

class FakeAudioContext {
  static instances = [];

  constructor() {
    this.state = 'suspended';
    this.currentTime = 3;
    this.destination = {};
    this.oscillators = [];
    this.gains = [];
    FakeAudioContext.instances.push(this);
  }

  createOscillator() {
    const oscillator = new FakeOscillator();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    const gain = new FakeGain();
    this.gains.push(gain);
    return gain;
  }

  async resume() {
    this.state = 'running';
  }

  async close() {
    this.state = 'closed';
  }
}

test('audio can be unlocked from a user gesture and schedules a synthesized tone', async () => {
  const audio = createGameAudio({ AudioContextCtor: FakeAudioContext });

  assert.equal(audio.supported, true);
  assert.equal(await audio.resume(), true);
  assert.equal(audio.play('jump'), true);

  const [oscillator] = FakeAudioContext.instances.at(-1).oscillators;
  assert.equal(oscillator.type, 'sine');
  assert.equal(oscillator.frequency.events[0].value, 420);
  assert.equal(oscillator.startTime, 3);
  assert.equal(oscillator.stopTime, 3.16);
  audio.dispose();
});

test('all gameplay sound events schedule oscillator voices', () => {
  const audio = createGameAudio({ AudioContextCtor: FakeAudioContext });
  const context = FakeAudioContext.instances.at(-1);

  for (const eventName of AUDIO_EVENT_NAMES) {
    const countBefore = context.oscillators.length;
    assert.equal(audio.play(eventName), true, eventName);
    assert.ok(context.oscillators.length > countBefore, eventName);
  }

  assert.deepEqual(AUDIO_EVENT_NAMES, [
    'jump', 'land', 'pickup', 'sprint', 'hit', 'caught', 'lost', 'checkpoint',
  ]);
  audio.dispose();
});

test('sprint pitch responds gently to the player speed', () => {
  const audio = createGameAudio({ AudioContextCtor: FakeAudioContext });
  const context = FakeAudioContext.instances.at(-1);

  audio.play('sprint', { speed: 100 });
  audio.play('sprint', { speed: 240 });

  const [slowSprint, fastSprint] = context.oscillators;
  const slowPitch = slowSprint.frequency.events[0].value;
  const fastPitch = fastSprint.frequency.events[0].value;
  assert.ok(fastPitch > slowPitch);
  assert.ok(fastPitch / slowPitch < 1.25);
  audio.dispose();
});

test('audio degrades silently when AudioContext is unavailable', async () => {
  const audio = createGameAudio({ AudioContextCtor: null });

  assert.equal(audio.supported, false);
  assert.equal(await audio.resume(), false);
  assert.equal(audio.play('jump'), false);
  assert.equal(audio.play('unknown'), false);
  audio.dispose();
});
