import fs from 'node:fs/promises';
import path from 'node:path';
import { InMemoryStore } from './in-memory.js';

export class FileMemoryStore extends InMemoryStore {
  constructor(filePath) {
    super();
    this.filePath = filePath;
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    try {
      const data = JSON.parse(await fs.readFile(this.filePath, 'utf8'));
      this.users = new Map(data.users ?? []);
      this.routes = new Map(data.routes ?? []);
      this.global = data.global ?? this.global;
      this.fingerprints = new Map(data.fingerprints ?? []);
      this.chaosCountdown = Number.isInteger(data.chaosCountdown) ? data.chaosCountdown : null;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    this.loaded = true;
  }

  async persist() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const payload = {
      users: [...this.users],
      routes: [...this.routes],
      global: this.global,
      fingerprints: [...this.fingerprints],
      chaosCountdown: this.chaosCountdown,
    };
    const temp = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temp, JSON.stringify(payload), 'utf8');
    await fs.rename(temp, this.filePath);
  }

  async getSnapshot(userHash, routeKey) {
    await this.load();
    return super.getSnapshot(userHash, routeKey);
  }

  async recordSelection(event) {
    await this.load();
    await super.recordSelection(event);
    await this.persist();
  }

  async getInquiryFingerprint(userHash, fingerprint) {
    await this.load();
    return super.getInquiryFingerprint(userHash, fingerprint);
  }

  async recordInquiryFingerprint(userHash, fingerprint, ttlSeconds) {
    await this.load();
    await super.recordInquiryFingerprint(userHash, fingerprint, ttlSeconds);
    await this.persist();
  }

  async health() {
    try {
      await this.load();
      return { ready: true, degraded: false, persistent: true, distributed: false, adapter: 'file' };
    } catch {
      return { ready: false, degraded: true, persistent: false, distributed: false, adapter: 'file' };
    }
  }
}
