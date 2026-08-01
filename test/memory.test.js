import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { FileMemoryStore, InMemoryStore, ResilientMemoryStore, UpstashRestMemoryStore } from '../src/memory/index.js';

const event = { userHash: 'user', responseId: 'r1', semanticFamily: 'sem', openingFamily: 'yes', syntaxFamily: 'single', conceptFamilies: ['game'], deliveryMode: 'direct', emote: null };

test('in-memory store records user and global history', async () => {
  const store = new InMemoryStore();
  await store.recordSelection(event);
  const snapshot = await store.getSnapshot('user');
  assert.deepEqual(snapshot.userResponseIds, ['r1']);
  assert.deepEqual(snapshot.globalResponseIds, ['r1']);
});

test('file store survives separate adapter instances', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sro8-'));
  const file = path.join(dir, 'memory.json');
  const first = new FileMemoryStore(file);
  await first.recordSelection(event);
  await first.recordInquiryFingerprint('user', 'q1', 60);
  const second = new FileMemoryStore(file);
  const snapshot = await second.getSnapshot('user');
  assert.deepEqual(snapshot.userResponseIds, ['r1']);
  assert.equal(await second.getInquiryFingerprint('user', 'q1'), true);
});


test('Upstash route lock serializes competing operations and releases by token', async () => {
  class FakeUpstashStore extends UpstashRestMemoryStore {
    constructor() {
      super({ url: 'https://example.invalid', token: 'test' });
      this.lock = null;
      this.commands = [];
    }

    async command(...args) {
      this.commands.push(args);
      if (args[0] === 'SET' && args.includes('NX')) {
        if (this.lock !== null) return null;
        this.lock = args[2];
        return 'OK';
      }
      if (args[0] === 'EVAL') {
        const token = args.at(-1);
        if (this.lock === token) {
          this.lock = null;
          return 1;
        }
        return 0;
      }
      throw new Error(`Unexpected command: ${args.join(' ')}`);
    }
  }

  const store = new FakeUpstashStore();
  let active = 0;
  let maxActive = 0;
  const order = [];
  const operation = (id) => store.withRouteLock('same-route', async () => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    order.push(`start-${id}`);
    await new Promise((resolve) => setTimeout(resolve, 30));
    order.push(`end-${id}`);
    active -= 1;
  });

  await Promise.all([operation(1), operation(2)]);
  assert.equal(maxActive, 1);
  assert.deepEqual(order, ['start-1', 'end-1', 'start-2', 'end-2']);
  assert.equal(store.lock, null);
  assert.ok(store.commands.some((args) => args[0] === 'SET' && args.includes('PX') && args.includes('NX')));
  assert.ok(store.commands.some((args) => args[0] === 'EVAL'));
});

test('resilient store keeps serving and reports degraded mode during an Upstash outage', async () => {
  const primary = {
    async withRouteLock() { throw new Error('redis offline'); },
    async getSnapshot() { throw new Error('redis offline'); },
    async recordSelection() { throw new Error('redis offline'); },
    async getInquiryFingerprint() { throw new Error('redis offline'); },
    async recordInquiryFingerprint() { throw new Error('redis offline'); },
    async health() { return { ready: false, degraded: true, persistent: false, distributed: false, adapter: 'upstash_rest' }; },
  };
  const store = new ResilientMemoryStore(primary);
  const value = await store.withRouteLock('route', async () => {
    await store.recordSelection({ ...event, routeKey: 'route', chaosCountdown: 7 });
    return store.getSnapshot('user', 'route');
  });
  assert.deepEqual(value.userResponseIds, ['r1']);
  assert.equal(value.chaosCountdown, 7);
  const health = await store.health();
  assert.equal(health.ready, true);
  assert.equal(health.degraded, true);
  assert.equal(health.adapter, 'upstash_rest_with_memory_failover');
});

test('Upstash selection history and chaos countdown survive adapter restarts', async () => {
  const shared = new Map();
  class FakePersistentUpstash extends UpstashRestMemoryStore {
    async command(...args) {
      const [command, key, value] = args;
      if (command === 'GET') return shared.get(key) ?? null;
      if (command === 'EXISTS') return shared.has(key) ? 1 : 0;
      if (command === 'SETEX') { shared.set(key, args[3]); return 'OK'; }
      throw new Error(`Unexpected command: ${command} ${key} ${value ?? ''}`);
    }
  }
  const first = new FakePersistentUpstash({ url: 'https://example.invalid', token: 'test' });
  await first.recordSelection({ ...event, routeKey: 'route', chaosCountdown: 11 });
  const second = new FakePersistentUpstash({ url: 'https://example.invalid', token: 'test' });
  const snapshot = await second.getSnapshot('user', 'route');
  assert.deepEqual(snapshot.userResponseIds, ['r1']);
  assert.deepEqual(snapshot.pathResponseIds, ['r1']);
  assert.equal(snapshot.chaosCountdown, 11);
});
