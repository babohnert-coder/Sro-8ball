import { InMemoryStore } from './in-memory.js';

export class ResilientMemoryStore {
  constructor(primary, fallback = new InMemoryStore()) {
    this.primary = primary;
    this.fallback = fallback;
    this.lastPrimaryError = null;
  }

  async tryPrimary(operation, fallbackOperation) {
    try {
      const result = await operation();
      this.lastPrimaryError = null;
      return result;
    } catch (error) {
      this.lastPrimaryError = error;
      return fallbackOperation();
    }
  }

  async withRouteLock(routeKey, operation) {
    let operationStarted = false;
    try {
      const result = await this.primary.withRouteLock(routeKey, async () => {
        operationStarted = true;
        return operation();
      });
      this.lastPrimaryError = null;
      return result;
    } catch (error) {
      // Only retry through the local lock when the distributed lock itself
      // failed. Never execute a selection twice because its body threw.
      if (operationStarted) throw error;
      this.lastPrimaryError = error;
      return this.fallback.withRouteLock(routeKey, operation);
    }
  }

  async getSnapshot(userHash, routeKey) {
    return this.tryPrimary(
      () => this.primary.getSnapshot(userHash, routeKey),
      () => this.fallback.getSnapshot(userHash, routeKey),
    );
  }

  async recordSelection(event) {
    // Keep the process-local copy warm so a Redis outage does not restart
    // variety from an empty history in the middle of a stream.
    await this.fallback.recordSelection(event);
    return this.tryPrimary(
      () => this.primary.recordSelection(event),
      async () => undefined,
    );
  }

  async getInquiryFingerprint(userHash, fingerprint) {
    return this.tryPrimary(
      () => this.primary.getInquiryFingerprint(userHash, fingerprint),
      () => this.fallback.getInquiryFingerprint(userHash, fingerprint),
    );
  }

  async recordInquiryFingerprint(userHash, fingerprint, ttlSeconds) {
    await this.fallback.recordInquiryFingerprint(userHash, fingerprint, ttlSeconds);
    return this.tryPrimary(
      () => this.primary.recordInquiryFingerprint(userHash, fingerprint, ttlSeconds),
      async () => undefined,
    );
  }

  async health() {
    const primaryHealth = await this.primary.health();
    if (primaryHealth.ready && !primaryHealth.degraded) {
      this.lastPrimaryError = null;
      return { ...primaryHealth, failover: 'armed' };
    }
    const fallbackHealth = await this.fallback.health();
    return {
      ...fallbackHealth,
      ready: true,
      degraded: true,
      persistent: false,
      distributed: false,
      adapter: 'upstash_rest_with_memory_failover',
      upstream: primaryHealth,
      error: this.lastPrimaryError?.message ?? 'Upstash is unavailable; using process-local history.',
    };
  }
}
