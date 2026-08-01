class MemoryStore {
  constructor({ maxUsers = 1000, maxLane = 20, maxGlobal = 80 } = {}) {
    this.maxUsers = maxUsers;
    this.maxLane = maxLane;
    this.maxGlobal = maxGlobal;
    this.users = new Map();
    this.global = [];
    this.window = [];
  }

  userKey(user) {
    return String(user || 'anon').toLowerCase().replace(/[^a-z0-9_:-]/g, '').slice(0, 80) || 'anon';
  }

  getUser(user) {
    const key = this.userKey(user);
    let record = this.users.get(key);
    if (!record) {
      record = { lanes: {}, recent: [], lastQuestions: [] };
      this.users.set(key, record);
      if (this.users.size > this.maxUsers) this.users.delete(this.users.keys().next().value);
    }
    return record;
  }

  recentFor(user, lane) {
    const record = this.getUser(user);
    return {
      userRecent: record.recent.slice(),
      laneRecent: (record.lanes[lane] || []).slice(),
      globalRecent: this.global.slice(),
      window: this.window.slice(),
      lastQuestions: record.lastQuestions.slice()
    };
  }

  remember({ user, lane, response, questionKey, usedEmote }) {
    const record = this.getUser(user);
    record.recent.unshift(response);
    record.recent = record.recent.slice(0, 18);
    record.lanes[lane] = [response, ...(record.lanes[lane] || [])].slice(0, this.maxLane);
    if (questionKey) record.lastQuestions = [questionKey, ...record.lastQuestions.filter(q => q !== questionKey)].slice(0, 8);
    this.global.unshift(response);
    this.global = this.global.slice(0, this.maxGlobal);
    this.window.unshift({ lane, usedEmote: !!usedEmote, at: Date.now() });
    this.window = this.window.slice(0, 20);
  }
}

module.exports = { MemoryStore };
