// High-performance Stale-While-Revalidate Chat & Colab Cache Service
// Provides instant (< 50ms) synchronous loads from L1 (Memory) and L2 (SessionStorage),
// request deduplication, and prefetching on card hover.

const memoryCache = {
  userChats: new Map(),      // email -> { data, timestamp }
  chatsById: new Map(),      // chatId (string/num) -> chat
  messages: new Map(),       // chatId -> { data, timestamp }
  broadcasts: new Map(),     // chatId -> { data, timestamp }
  members: new Map(),        // chatId -> { data, timestamp }
  invitations: null,         // { data, timestamp }
  casboxMessages: new Map(), // email -> { data, timestamp }
  casboxThreads: new Map(),  // contactEmail -> { data, timestamp }
  casboxAliases: null,       // { data, timestamp }
  casboxSettings: null,      // { data, timestamp }
  casboxConnections: null,   // { data, timestamp }
  inFlight: new Map(),       // key -> Promise
};

const SS_PREFIX = 'bnx_colab_';
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes stale time for background revalidation

// Safe sessionStorage reader
const readSS = (key) => {
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

// Safe sessionStorage writer with quota protection
const writeSS = (key, data) => {
  try {
    // To prevent QuotaExceededError, sanitize large base64 attachments if any
    const serialized = JSON.stringify(data, (k, v) => {
      if (typeof v === 'string' && v.startsWith('data:') && v.length > 50000) {
        return '[data-url-omitted-from-storage]';
      }
      return v;
    });
    sessionStorage.setItem(SS_PREFIX + key, serialized);
  } catch (e) {
    // Gracefully handle storage errors
  }
};

// Initialize memory cache from sessionStorage for instant rehydration on reload
const rehydrateFromStorage = () => {
  try {
    const cachedChats = readSS('chats_list');
    if (Array.isArray(cachedChats)) {
      cachedChats.forEach(c => {
        if (c && c.id) {
          memoryCache.chatsById.set(String(c.id), c);
          memoryCache.chatsById.set(Number(c.id), c);
        }
      });
    }
  } catch (e) {
    // Ignore
  }
};

rehydrateFromStorage();

export const chatCache = {
  // Deduplicate inflight requests to prevent redundant simultaneous network calls
  dedupe(key, fetcher) {
    if (memoryCache.inFlight.has(key)) {
      return memoryCache.inFlight.get(key);
    }
    const promise = fetcher()
      .then(res => {
        memoryCache.inFlight.delete(key);
        return res;
      })
      .catch(err => {
        memoryCache.inFlight.delete(key);
        throw err;
      });
    memoryCache.inFlight.set(key, promise);
    return promise;
  },

  // User Chats (Colab list)
  getUserChats(email) {
    if (!email) return null;
    const mem = memoryCache.userChats.get(email);
    if (mem?.data) return mem.data;

    const stored = readSS(`user_chats_${email}`);
    if (stored && Array.isArray(stored)) {
      memoryCache.userChats.set(email, { data: stored, timestamp: Date.now() });
      stored.forEach(c => {
        if (c?.id) {
          memoryCache.chatsById.set(String(c.id), c);
          memoryCache.chatsById.set(Number(c.id), c);
        }
      });
      return stored;
    }
    return null;
  },

  setUserChats(email, chats) {
    if (!email || !Array.isArray(chats)) return;
    memoryCache.userChats.set(email, { data: chats, timestamp: Date.now() });
    chats.forEach(c => {
      if (c?.id) {
        memoryCache.chatsById.set(String(c.id), c);
        memoryCache.chatsById.set(Number(c.id), c);
      }
    });
    writeSS(`user_chats_${email}`, chats);
    writeSS('chats_list', chats);
  },

  hasUserChats(email) {
    return Boolean(this.getUserChats(email)?.length);
  },

  // Single Chat lookup
  getChat(chatId) {
    if (!chatId) return null;
    const fromMem = memoryCache.chatsById.get(String(chatId)) || memoryCache.chatsById.get(Number(chatId));
    if (fromMem) return fromMem;

    const fromSS = readSS(`chat_${chatId}`);
    if (fromSS) {
      memoryCache.chatsById.set(String(chatId), fromSS);
      return fromSS;
    }

    // Try finding in cached list
    const chatsList = readSS('chats_list');
    if (Array.isArray(chatsList)) {
      const found = chatsList.find(c => String(c.id) === String(chatId));
      if (found) {
        this.setChat(chatId, found);
        return found;
      }
    }
    return null;
  },

  setChat(chatId, chat) {
    if (!chatId || !chat) return;
    memoryCache.chatsById.set(String(chatId), chat);
    memoryCache.chatsById.set(Number(chatId), chat);
    writeSS(`chat_${chatId}`, chat);
  },

  // Messages
  getMessages(chatId) {
    if (!chatId) return null;
    const mem = memoryCache.messages.get(String(chatId));
    if (mem?.data) return mem.data;

    const stored = readSS(`messages_${chatId}`);
    if (stored && Array.isArray(stored)) {
      memoryCache.messages.set(String(chatId), { data: stored, timestamp: Date.now() });
      return stored;
    }
    return null;
  },

  setMessages(chatId, messages) {
    if (!chatId || !Array.isArray(messages)) return;
    memoryCache.messages.set(String(chatId), { data: messages, timestamp: Date.now() });
    writeSS(`messages_${chatId}`, messages);
  },

  hasMessages(chatId) {
    const list = this.getMessages(chatId);
    return Array.isArray(list) && list.length > 0;
  },

  // Broadcasts
  getBroadcasts(chatId) {
    if (!chatId) return null;
    const mem = memoryCache.broadcasts.get(String(chatId));
    if (mem?.data) return mem.data;

    const stored = readSS(`broadcasts_${chatId}`);
    if (stored && Array.isArray(stored)) {
      memoryCache.broadcasts.set(String(chatId), { data: stored, timestamp: Date.now() });
      return stored;
    }
    return null;
  },

  setBroadcasts(chatId, broadcasts) {
    if (!chatId || !Array.isArray(broadcasts)) return;
    memoryCache.broadcasts.set(String(chatId), { data: broadcasts, timestamp: Date.now() });
    writeSS(`broadcasts_${chatId}`, broadcasts);
  },

  hasBroadcasts(chatId) {
    const list = this.getBroadcasts(chatId);
    return Array.isArray(list);
  },

  // Members
  getMembers(chatId) {
    if (!chatId) return null;
    const mem = memoryCache.members.get(String(chatId));
    if (mem?.data) return mem.data;

    const stored = readSS(`members_${chatId}`);
    if (stored && Array.isArray(stored)) {
      memoryCache.members.set(String(chatId), { data: stored, timestamp: Date.now() });
      return stored;
    }
    return null;
  },

  setMembers(chatId, members) {
    if (!chatId || !Array.isArray(members)) return;
    memoryCache.members.set(String(chatId), { data: members, timestamp: Date.now() });
    writeSS(`members_${chatId}`, members);
  },

  // Pending Invitations
  getInvitations() {
    if (memoryCache.invitations?.data) return memoryCache.invitations.data;
    const stored = readSS('invitations');
    if (stored && Array.isArray(stored)) {
      memoryCache.invitations = { data: stored, timestamp: Date.now() };
      return stored;
    }
    return null;
  },

  setInvitations(invitations) {
    if (!Array.isArray(invitations)) return;
    memoryCache.invitations = { data: invitations, timestamp: Date.now() };
    writeSS('invitations', invitations);
  },

  // Prefetch Chat Room Data (called on hover over a Colab item)
  prefetchChat(chatId, chatAPI) {
    if (!chatId || !chatAPI) return;
    const idStr = String(chatId);

    // If already in memory and fresh, skip
    const existingMsgs = memoryCache.messages.get(idStr);
    if (!existingMsgs || Date.now() - existingMsgs.timestamp > CACHE_TTL_MS) {
      this.dedupe(`messages_${idStr}`, () => chatAPI.getMessageHistory(chatId))
        .then(res => {
          if (res?.data) {
            const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
            this.setMessages(idStr, list);
          }
        })
        .catch(() => {});
    }

    const existingBroadcasts = memoryCache.broadcasts.get(idStr);
    if (!existingBroadcasts || Date.now() - existingBroadcasts.timestamp > CACHE_TTL_MS) {
      this.dedupe(`broadcasts_${idStr}`, () => chatAPI.getBroadcasts(chatId))
        .then(res => {
          if (res?.data) {
            const list = Array.isArray(res.data) ? res.data : [];
            this.setBroadcasts(idStr, list);
          }
        })
        .catch(() => {});
    }

    const existingMembers = memoryCache.members.get(idStr);
    if (!existingMembers || Date.now() - existingMembers.timestamp > CACHE_TTL_MS) {
      this.dedupe(`members_${idStr}`, () => chatAPI.getMembers(chatId))
        .then(res => {
          if (res?.data) {
            const list = Array.isArray(res.data) ? res.data : [];
            this.setMembers(idStr, list);
          }
        })
        .catch(() => {});
    }
  },

  // Casbox Messages
  getCasboxMessages(email) {
    if (!email) return null;
    const mem = memoryCache.casboxMessages.get(email);
    if (mem?.data) return mem.data;

    const stored = readSS(`casbox_messages_${email}`);
    if (stored && Array.isArray(stored)) {
      memoryCache.casboxMessages.set(email, { data: stored, timestamp: Date.now() });
      return stored;
    }
    return null;
  },

  setCasboxMessages(email, msgs) {
    if (!email || !Array.isArray(msgs)) return;
    memoryCache.casboxMessages.set(email, { data: msgs, timestamp: Date.now() });
    writeSS(`casbox_messages_${email}`, msgs);
  },

  hasCasboxMessages(email) {
    const list = this.getCasboxMessages(email);
    return Boolean(list && list.length > 0);
  },

  // Casbox Threads
  getCasboxThread(contactEmail) {
    if (!contactEmail) return null;
    const mem = memoryCache.casboxThreads.get(contactEmail.toLowerCase());
    if (mem?.data) return mem.data;

    const stored = readSS(`casbox_thread_${contactEmail.toLowerCase()}`);
    if (stored && Array.isArray(stored)) {
      memoryCache.casboxThreads.set(contactEmail.toLowerCase(), { data: stored, timestamp: Date.now() });
      return stored;
    }
    return null;
  },

  setCasboxThread(contactEmail, thread) {
    if (!contactEmail || !Array.isArray(thread)) return;
    memoryCache.casboxThreads.set(contactEmail.toLowerCase(), { data: thread, timestamp: Date.now() });
    writeSS(`casbox_thread_${contactEmail.toLowerCase()}`, thread);
  },

  // Casbox Settings (accepted & blocked contacts)
  getCasboxSettings() {
    if (memoryCache.casboxSettings?.data) return memoryCache.casboxSettings.data;
    const stored = readSS('casbox_settings');
    if (stored && typeof stored === 'object') {
      memoryCache.casboxSettings = { data: stored, timestamp: Date.now() };
      return stored;
    }
    return null;
  },

  setCasboxSettings(settings) {
    if (!settings || typeof settings !== 'object') return;
    memoryCache.casboxSettings = { data: settings, timestamp: Date.now() };
    writeSS('casbox_settings', settings);
  },

  // Casbox Aliases
  getCasboxAliases() {
    if (memoryCache.casboxAliases?.data) return memoryCache.casboxAliases.data;
    const stored = readSS('casbox_aliases');
    if (stored && typeof stored === 'object') {
      memoryCache.casboxAliases = { data: stored, timestamp: Date.now() };
      return stored;
    }
    return null;
  },

  setCasboxAliases(aliases) {
    if (!aliases || typeof aliases !== 'object') return;
    memoryCache.casboxAliases = { data: aliases, timestamp: Date.now() };
    writeSS('casbox_aliases', aliases);
  },

  // Casbox Connections
  getCasboxConnections() {
    if (memoryCache.casboxConnections?.data) return memoryCache.casboxConnections.data;
    const stored = readSS('casbox_connections');
    if (stored && Array.isArray(stored)) {
      memoryCache.casboxConnections = { data: stored, timestamp: Date.now() };
      return stored;
    }
    return null;
  },

  setCasboxConnections(connections) {
    if (!Array.isArray(connections)) return;
    memoryCache.casboxConnections = { data: connections, timestamp: Date.now() };
    writeSS('casbox_connections', connections);
  }
};

export default chatCache;
