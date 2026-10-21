'use strict';
(() => {
  var Ve = Object.defineProperty;
  var Fe = (e, t, s) =>
    t in e ? Ve(e, t, { enumerable: !0, configurable: !0, writable: !0, value: s }) : (e[t] = s);
  var i = (e, t, s) => Fe(e, typeof t != 'symbol' ? t + '' : t, s);
  var y = {
      googleAnalytics: 'googleAnalytics',
      precache: 'precache-v2',
      prefix: 'serwist',
      runtime: 'runtime',
      suffix: typeof registration < 'u' ? registration.scope : '',
    },
    L = (e) => [y.prefix, e, y.suffix].filter((t) => t && t.length > 0).join('-'),
    Be = (e) => {
      for (let t of Object.keys(y)) e(t);
    },
    E = {
      updateDetails: (e) => {
        Be((t) => {
          let s = e[t];
          typeof s == 'string' && (y[t] = s);
        });
      },
      getGoogleAnalyticsName: (e) => e || L(y.googleAnalytics),
      getPrecacheName: (e) => e || L(y.precache),
      getPrefix: () => y.prefix,
      getRuntimeName: (e) => e || L(y.runtime),
      getSuffix: () => y.suffix,
    },
    D;
  function ee() {
    if (D === void 0) {
      let e = new Response('');
      if ('body' in e)
        try {
          new Response(e.body), (D = !0);
        } catch {
          D = !1;
        }
      D = !1;
    }
    return D;
  }
  var Me = (e, ...t) => {
    let s = e;
    return t.length > 0 && (s += ` :: ${JSON.stringify(t)}`), s;
  };
  var We = Me,
    h = class extends Error {
      constructor(t, s) {
        let r = We(t, s);
        super(r);
        i(this, 'details');
        (this.name = t), (this.details = s);
      }
    };
  var te = (e) =>
    new URL(String(e), location.href).href.replace(new RegExp(`^${location.origin}`), '');
  function S(e) {
    return new Promise((t) => setTimeout(t, e));
  }
  var V = new Set();
  function Z(e, t) {
    let s = new URL(e);
    for (let r of t) s.searchParams.delete(r);
    return s.href;
  }
  async function se(e, t, s, r) {
    let a = Z(t.url, s);
    if (t.url === a) return e.match(t, r);
    let n = { ...r, ignoreSearch: !0 },
      o = await e.keys(t, n);
    for (let c of o) if (a === Z(c.url, s)) return e.match(c, r);
  }
  var re = class {
      constructor() {
        i(this, 'promise');
        i(this, 'resolve');
        i(this, 'reject');
        this.promise = new Promise((e, t) => {
          (this.resolve = e), (this.reject = t);
        });
      }
    },
    ae = async () => {
      for (let e of V) await e();
    },
    Ke = '-precache-',
    He = async (e, t = Ke) => {
      let s = (await self.caches.keys()).filter(
        (r) => r.includes(t) && r.includes(self.registration.scope) && r !== e,
      );
      return await Promise.all(s.map((r) => self.caches.delete(r))), s;
    },
    ne = (e) => {
      self.addEventListener('activate', (t) => {
        t.waitUntil(He(E.getPrecacheName(e)).then((s) => {}));
      });
    },
    oe = () => {
      self.addEventListener('activate', () => self.clients.claim());
    },
    F = (e, t) => {
      let s = t();
      return e.waitUntil(s), s;
    };
  var W = (e, t) => t.some((s) => e instanceof s),
    ie,
    ce;
  function Ge() {
    return ie || (ie = [IDBDatabase, IDBObjectStore, IDBIndex, IDBCursor, IDBTransaction]);
  }
  function je() {
    return (
      ce ||
      (ce = [
        IDBCursor.prototype.advance,
        IDBCursor.prototype.continue,
        IDBCursor.prototype.continuePrimaryKey,
      ])
    );
  }
  var K = new WeakMap(),
    B = new WeakMap(),
    A = new WeakMap();
  function Qe(e) {
    let t = new Promise((s, r) => {
      let a = () => {
          e.removeEventListener('success', n), e.removeEventListener('error', o);
        },
        n = () => {
          s(b(e.result)), a();
        },
        o = () => {
          r(e.error), a();
        };
      e.addEventListener('success', n), e.addEventListener('error', o);
    });
    return A.set(t, e), t;
  }
  function ze(e) {
    if (K.has(e)) return;
    let t = new Promise((s, r) => {
      let a = () => {
          e.removeEventListener('complete', n),
            e.removeEventListener('error', o),
            e.removeEventListener('abort', o);
        },
        n = () => {
          s(), a();
        },
        o = () => {
          r(e.error || new DOMException('AbortError', 'AbortError')), a();
        };
      e.addEventListener('complete', n),
        e.addEventListener('error', o),
        e.addEventListener('abort', o);
    });
    K.set(e, t);
  }
  var H = {
    get(e, t, s) {
      if (e instanceof IDBTransaction) {
        if (t === 'done') return K.get(e);
        if (t === 'store')
          return s.objectStoreNames[1] ? void 0 : s.objectStore(s.objectStoreNames[0]);
      }
      return b(e[t]);
    },
    set(e, t, s) {
      return (e[t] = s), !0;
    },
    has(e, t) {
      return e instanceof IDBTransaction && (t === 'done' || t === 'store') ? !0 : t in e;
    },
  };
  function de(e) {
    H = e(H);
  }
  function Je(e) {
    return je().includes(e)
      ? function (...t) {
          return e.apply(G(this), t), b(this.request);
        }
      : function (...t) {
          return b(e.apply(G(this), t));
        };
  }
  function Ye(e) {
    return typeof e == 'function'
      ? Je(e)
      : (e instanceof IDBTransaction && ze(e), W(e, Ge()) ? new Proxy(e, H) : e);
  }
  function b(e) {
    if (e instanceof IDBRequest) return Qe(e);
    if (B.has(e)) return B.get(e);
    let t = Ye(e);
    return t !== e && (B.set(e, t), A.set(t, e)), t;
  }
  var G = (e) => A.get(e);
  function O(e, t, { blocked: s, upgrade: r, blocking: a, terminated: n } = {}) {
    let o = indexedDB.open(e, t),
      c = b(o);
    return (
      r &&
        o.addEventListener('upgradeneeded', (l) => {
          r(b(o.result), l.oldVersion, l.newVersion, b(o.transaction), l);
        }),
      s && o.addEventListener('blocked', (l) => s(l.oldVersion, l.newVersion, l)),
      c
        .then((l) => {
          n && l.addEventListener('close', () => n()),
            a && l.addEventListener('versionchange', (u) => a(u.oldVersion, u.newVersion, u));
        })
        .catch(() => {}),
      c
    );
  }
  function pe(e, { blocked: t } = {}) {
    let s = indexedDB.deleteDatabase(e);
    return t && s.addEventListener('blocked', (r) => t(r.oldVersion, r)), b(s).then(() => {});
  }
  var Xe = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'],
    Ze = ['put', 'add', 'delete', 'clear'],
    M = new Map();
  function le(e, t) {
    if (!(e instanceof IDBDatabase && !(t in e) && typeof t == 'string')) return;
    if (M.get(t)) return M.get(t);
    let s = t.replace(/FromIndex$/, ''),
      r = t !== s,
      a = Ze.includes(s);
    if (!(s in (r ? IDBIndex : IDBObjectStore).prototype) || !(a || Xe.includes(s))) return;
    let n = async function (o, ...c) {
      let l = this.transaction(o, a ? 'readwrite' : 'readonly'),
        u = l.store;
      return r && (u = u.index(c.shift())), (await Promise.all([u[s](...c), a && l.done]))[0];
    };
    return M.set(t, n), n;
  }
  de((e) => ({
    ...e,
    get: (t, s, r) => le(t, s) || e.get(t, s, r),
    has: (t, s) => !!le(t, s) || e.has(t, s),
  }));
  var et = ['continue', 'continuePrimaryKey', 'advance'],
    ue = {},
    j = new WeakMap(),
    ge = new WeakMap(),
    tt = {
      get(e, t) {
        if (!et.includes(t)) return e[t];
        let s = ue[t];
        return (
          s ||
            (s = ue[t] =
              function (...r) {
                j.set(this, ge.get(this)[t](...r));
              }),
          s
        );
      },
    };
  async function* st(...e) {
    let t = this;
    if ((t instanceof IDBCursor || (t = await t.openCursor(...e)), !t)) return;
    t = t;
    let s = new Proxy(t, tt);
    for (ge.set(s, t), A.set(s, G(t)); t; )
      yield s, (t = await (j.get(s) || t.continue())), j.delete(s);
  }
  function he(e, t) {
    return (
      (t === Symbol.asyncIterator && W(e, [IDBIndex, IDBObjectStore, IDBCursor])) ||
      (t === 'iterate' && W(e, [IDBIndex, IDBObjectStore]))
    );
  }
  de((e) => ({
    ...e,
    get(t, s, r) {
      return he(t, s) ? st : e.get(t, s, r);
    },
    has(t, s) {
      return he(t, s) || e.has(t, s);
    },
  }));
  var ye = async (e, t) => {
      let s = null;
      if ((e.url && (s = new URL(e.url).origin), s !== self.location.origin))
        throw new h('cross-origin-copy-response', { origin: s });
      let r = e.clone(),
        a = { headers: new Headers(r.headers), status: r.status, statusText: r.statusText },
        n = t ? t(a) : a,
        o = ee() ? r.body : await r.blob();
      return new Response(o, n);
    },
    Ee = () => {
      self.__WB_DISABLE_DEV_LOGS = !0;
    },
    fe = 3,
    rt = 'serwist-background-sync',
    N = 'requests',
    T = 'queueName',
    at = class {
      constructor() {
        i(this, '_db', null);
      }
      async addEntry(e) {
        let t = (await this.getDb()).transaction(N, 'readwrite', { durability: 'relaxed' });
        await t.store.add(e), await t.done;
      }
      async getFirstEntryId() {
        return (await (await this.getDb()).transaction(N).store.openCursor())?.value.id;
      }
      async getAllEntriesByQueueName(e) {
        let t = await (await this.getDb()).getAllFromIndex(N, T, IDBKeyRange.only(e));
        return t || [];
      }
      async getEntryCountByQueueName(e) {
        return (await this.getDb()).countFromIndex(N, T, IDBKeyRange.only(e));
      }
      async deleteEntry(e) {
        await (await this.getDb()).delete(N, e);
      }
      async getFirstEntryByQueueName(e) {
        return await this.getEndEntryFromIndex(IDBKeyRange.only(e), 'next');
      }
      async getLastEntryByQueueName(e) {
        return await this.getEndEntryFromIndex(IDBKeyRange.only(e), 'prev');
      }
      async getEndEntryFromIndex(e, t) {
        return (await (await this.getDb()).transaction(N).store.index(T).openCursor(e, t))?.value;
      }
      async getDb() {
        return this._db || (this._db = await O(rt, fe, { upgrade: this._upgradeDb })), this._db;
      }
      _upgradeDb(e, t) {
        t > 0 && t < fe && e.objectStoreNames.contains(N) && e.deleteObjectStore(N),
          e
            .createObjectStore(N, { autoIncrement: !0, keyPath: 'id' })
            .createIndex(T, T, { unique: !1 });
      }
    },
    U = class {
      constructor(e) {
        i(this, '_queueName');
        i(this, '_queueDb');
        (this._queueName = e), (this._queueDb = new at());
      }
      async pushEntry(e) {
        delete e.id, (e.queueName = this._queueName), await this._queueDb.addEntry(e);
      }
      async unshiftEntry(e) {
        let t = await this._queueDb.getFirstEntryId();
        t ? (e.id = t - 1) : delete e.id,
          (e.queueName = this._queueName),
          await this._queueDb.addEntry(e);
      }
      async popEntry() {
        return this._removeEntry(await this._queueDb.getLastEntryByQueueName(this._queueName));
      }
      async shiftEntry() {
        return this._removeEntry(await this._queueDb.getFirstEntryByQueueName(this._queueName));
      }
      async getAll() {
        return await this._queueDb.getAllEntriesByQueueName(this._queueName);
      }
      async size() {
        return await this._queueDb.getEntryCountByQueueName(this._queueName);
      }
      async deleteEntry(e) {
        await this._queueDb.deleteEntry(e);
      }
      async _removeEntry(e) {
        return e && (await this.deleteEntry(e.id)), e;
      }
    },
    nt = [
      'method',
      'referrer',
      'referrerPolicy',
      'mode',
      'credentials',
      'cache',
      'redirect',
      'integrity',
      'keepalive',
    ],
    J = class z {
      constructor(t) {
        i(this, '_requestData');
        t.mode === 'navigate' && (t.mode = 'same-origin'), (this._requestData = t);
      }
      static async fromRequest(t) {
        let s = { url: t.url, headers: {} };
        t.method !== 'GET' && (s.body = await t.clone().arrayBuffer()),
          t.headers.forEach((r, a) => {
            s.headers[a] = r;
          });
        for (let r of nt) t[r] !== void 0 && (s[r] = t[r]);
        return new z(s);
      }
      toObject() {
        let t = Object.assign({}, this._requestData);
        return (
          (t.headers = Object.assign({}, this._requestData.headers)),
          t.body && (t.body = t.body.slice(0)),
          t
        );
      }
      toRequest() {
        return new Request(this._requestData.url, this._requestData);
      }
      clone() {
        return new z(this.toObject());
      }
    },
    me = 'serwist-background-sync',
    ot = 1440 * 7,
    Q = new Set(),
    we = (e) => {
      let t = { request: new J(e.requestData).toRequest(), timestamp: e.timestamp };
      return e.metadata && (t.metadata = e.metadata), t;
    },
    Ne = class {
      constructor(e, { forceSyncFallback: t, onSync: s, maxRetentionTime: r } = {}) {
        i(this, '_name');
        i(this, '_onSync');
        i(this, '_maxRetentionTime');
        i(this, '_queueStore');
        i(this, '_forceSyncFallback');
        i(this, '_syncInProgress', !1);
        i(this, '_requestsAddedDuringSync', !1);
        if (Q.has(e)) throw new h('duplicate-queue-name', { name: e });
        Q.add(e),
          (this._name = e),
          (this._onSync = s || this.replayRequests),
          (this._maxRetentionTime = r || ot),
          (this._forceSyncFallback = !!t),
          (this._queueStore = new U(this._name)),
          this._addSyncListener();
      }
      get name() {
        return this._name;
      }
      async pushRequest(e) {
        await this._addRequest(e, 'push');
      }
      async unshiftRequest(e) {
        await this._addRequest(e, 'unshift');
      }
      async popRequest() {
        return this._removeRequest('pop');
      }
      async shiftRequest() {
        return this._removeRequest('shift');
      }
      async getAll() {
        let e = await this._queueStore.getAll(),
          t = Date.now(),
          s = [];
        for (let r of e) {
          let a = this._maxRetentionTime * 60 * 1e3;
          t - r.timestamp > a ? await this._queueStore.deleteEntry(r.id) : s.push(we(r));
        }
        return s;
      }
      async size() {
        return await this._queueStore.size();
      }
      async _addRequest({ request: e, metadata: t, timestamp: s = Date.now() }, r) {
        let a = { requestData: (await J.fromRequest(e.clone())).toObject(), timestamp: s };
        switch ((t && (a.metadata = t), r)) {
          case 'push':
            await this._queueStore.pushEntry(a);
            break;
          case 'unshift':
            await this._queueStore.unshiftEntry(a);
            break;
        }
        this._syncInProgress ? (this._requestsAddedDuringSync = !0) : await this.registerSync();
      }
      async _removeRequest(e) {
        let t = Date.now(),
          s;
        switch (e) {
          case 'pop':
            s = await this._queueStore.popEntry();
            break;
          case 'shift':
            s = await this._queueStore.shiftEntry();
            break;
        }
        if (s) {
          let r = this._maxRetentionTime * 60 * 1e3;
          return t - s.timestamp > r ? this._removeRequest(e) : we(s);
        }
      }
      async replayRequests() {
        let e;
        for (; (e = await this.shiftRequest()); )
          try {
            await fetch(e.request.clone());
          } catch {
            throw (
              (await this.unshiftRequest(e), new h('queue-replay-failed', { name: this._name }))
            );
          }
      }
      async registerSync() {
        if ('sync' in self.registration && !this._forceSyncFallback)
          try {
            await self.registration.sync.register(`${me}:${this._name}`);
          } catch {}
      }
      _addSyncListener() {
        'sync' in self.registration && !this._forceSyncFallback
          ? self.addEventListener('sync', (e) => {
              if (e.tag === `${me}:${this._name}`) {
                let t = async () => {
                  this._syncInProgress = !0;
                  let s;
                  try {
                    await this._onSync({ queue: this });
                  } catch (r) {
                    if (r instanceof Error) throw ((s = r), s);
                  } finally {
                    this._requestsAddedDuringSync &&
                      !(s && !e.lastChance) &&
                      (await this.registerSync()),
                      (this._syncInProgress = !1),
                      (this._requestsAddedDuringSync = !1);
                  }
                };
                e.waitUntil(t());
              }
            })
          : this._onSync({ queue: this });
      }
      static get _queueNames() {
        return Q;
      }
    },
    _e = class {
      constructor(e, t) {
        i(this, '_queue');
        this._queue = new Ne(e, t);
      }
      async fetchDidFail({ request: e }) {
        await this._queue.pushRequest({ request: e });
      }
    },
    Y = {
      cacheWillUpdate: async ({ response: e }) => (e.status === 200 || e.status === 0 ? e : null),
    };
  function k(e) {
    return typeof e == 'string' ? new Request(e) : e;
  }
  var Re = class {
      constructor(e, t) {
        i(this, 'event');
        i(this, 'request');
        i(this, 'url');
        i(this, 'params');
        i(this, '_cacheKeys', {});
        i(this, '_strategy');
        i(this, '_handlerDeferred');
        i(this, '_extendLifetimePromises');
        i(this, '_plugins');
        i(this, '_pluginStateMap');
        (this.event = t.event),
          (this.request = t.request),
          t.url && ((this.url = t.url), (this.params = t.params)),
          (this._strategy = e),
          (this._handlerDeferred = new re()),
          (this._extendLifetimePromises = []),
          (this._plugins = [...e.plugins]),
          (this._pluginStateMap = new Map());
        for (let s of this._plugins) this._pluginStateMap.set(s, {});
        this.event.waitUntil(this._handlerDeferred.promise);
      }
      async fetch(e) {
        let { event: t } = this,
          s = k(e),
          r = await this.getPreloadResponse();
        if (r) return r;
        let a = this.hasCallback('fetchDidFail') ? s.clone() : null;
        try {
          for (let o of this.iterateCallbacks('requestWillFetch'))
            s = await o({ request: s.clone(), event: t });
        } catch (o) {
          if (o instanceof Error)
            throw new h('plugin-error-request-will-fetch', { thrownErrorMessage: o.message });
        }
        let n = s.clone();
        try {
          let o;
          o = await fetch(s, s.mode === 'navigate' ? void 0 : this._strategy.fetchOptions);
          for (let c of this.iterateCallbacks('fetchDidSucceed'))
            o = await c({ event: t, request: n, response: o });
          return o;
        } catch (o) {
          throw (
            (a &&
              (await this.runCallbacks('fetchDidFail', {
                error: o,
                event: t,
                originalRequest: a.clone(),
                request: n.clone(),
              })),
            o)
          );
        }
      }
      async fetchAndCachePut(e) {
        let t = await this.fetch(e),
          s = t.clone();
        return this.waitUntil(this.cachePut(e, s)), t;
      }
      async cacheMatch(e) {
        let t = k(e),
          s,
          { cacheName: r, matchOptions: a } = this._strategy,
          n = await this.getCacheKey(t, 'read'),
          o = { ...a, cacheName: r };
        s = await caches.match(n, o);
        for (let c of this.iterateCallbacks('cachedResponseWillBeUsed'))
          s =
            (await c({
              cacheName: r,
              matchOptions: a,
              cachedResponse: s,
              request: n,
              event: this.event,
            })) || void 0;
        return s;
      }
      async cachePut(e, t) {
        let s = k(e);
        await S(0);
        let r = await this.getCacheKey(s, 'write');
        if (!t) throw new h('cache-put-with-no-response', { url: te(r.url) });
        let a = await this._ensureResponseSafeToCache(t);
        if (!a) return !1;
        let { cacheName: n, matchOptions: o } = this._strategy,
          c = await self.caches.open(n),
          l = this.hasCallback('cacheDidUpdate'),
          u = l ? await se(c, r.clone(), ['__WB_REVISION__'], o) : null;
        try {
          await c.put(r, l ? a.clone() : a);
        } catch (d) {
          if (d instanceof Error) throw (d.name === 'QuotaExceededError' && (await ae()), d);
        }
        for (let d of this.iterateCallbacks('cacheDidUpdate'))
          await d({
            cacheName: n,
            oldResponse: u,
            newResponse: a.clone(),
            request: r,
            event: this.event,
          });
        return !0;
      }
      async getCacheKey(e, t) {
        let s = `${e.url} | ${t}`;
        if (!this._cacheKeys[s]) {
          let r = e;
          for (let a of this.iterateCallbacks('cacheKeyWillBeUsed'))
            r = k(await a({ mode: t, request: r, event: this.event, params: this.params }));
          this._cacheKeys[s] = r;
        }
        return this._cacheKeys[s];
      }
      hasCallback(e) {
        for (let t of this._strategy.plugins) if (e in t) return !0;
        return !1;
      }
      async runCallbacks(e, t) {
        for (let s of this.iterateCallbacks(e)) await s(t);
      }
      *iterateCallbacks(e) {
        for (let t of this._strategy.plugins)
          if (typeof t[e] == 'function') {
            let s = this._pluginStateMap.get(t);
            yield (a) => {
              let n = { ...a, state: s };
              return t[e](n);
            };
          }
      }
      waitUntil(e) {
        return this._extendLifetimePromises.push(e), e;
      }
      async doneWaiting() {
        let e;
        for (; (e = this._extendLifetimePromises.shift()); ) await e;
      }
      destroy() {
        this._handlerDeferred.resolve(null);
      }
      async getPreloadResponse() {
        if (
          this.event instanceof FetchEvent &&
          this.event.request.mode === 'navigate' &&
          'preloadResponse' in this.event
        )
          try {
            let e = await this.event.preloadResponse;
            if (e) return e;
          } catch {
            return;
          }
      }
      async _ensureResponseSafeToCache(e) {
        let t = e,
          s = !1;
        for (let r of this.iterateCallbacks('cacheWillUpdate'))
          if (
            ((t = (await r({ request: this.request, response: t, event: this.event })) || void 0),
            (s = !0),
            !t)
          )
            break;
        return s || (t && t.status !== 200 && (t = void 0)), t;
      }
    },
    x = class {
      constructor(e = {}) {
        i(this, 'cacheName');
        i(this, 'plugins');
        i(this, 'fetchOptions');
        i(this, 'matchOptions');
        (this.cacheName = E.getRuntimeName(e.cacheName)),
          (this.plugins = e.plugins || []),
          (this.fetchOptions = e.fetchOptions),
          (this.matchOptions = e.matchOptions);
      }
      handle(e) {
        let [t] = this.handleAll(e);
        return t;
      }
      handleAll(e) {
        e instanceof FetchEvent && (e = { event: e, request: e.request });
        let t = e.event,
          s = typeof e.request == 'string' ? new Request(e.request) : e.request,
          r = new Re(
            this,
            e.url
              ? { event: t, request: s, url: e.url, params: e.params }
              : { event: t, request: s },
          ),
          a = this._getResponse(r, s, t);
        return [a, this._awaitComplete(a, r, s, t)];
      }
      async _getResponse(e, t, s) {
        await e.runCallbacks('handlerWillStart', { event: s, request: t });
        let r;
        try {
          if (((r = await this._handle(t, e)), r === void 0 || r.type === 'error'))
            throw new h('no-response', { url: t.url });
        } catch (a) {
          if (a instanceof Error) {
            for (let n of e.iterateCallbacks('handlerDidError'))
              if (((r = await n({ error: a, event: s, request: t })), r !== void 0)) break;
          }
          if (!r) throw a;
        }
        for (let a of e.iterateCallbacks('handlerWillRespond'))
          r = await a({ event: s, request: t, response: r });
        return r;
      }
      async _awaitComplete(e, t, s, r) {
        let a, n;
        try {
          a = await e;
        } catch {}
        try {
          await t.runCallbacks('handlerDidRespond', { event: r, request: s, response: a }),
            await t.doneWaiting();
        } catch (o) {
          o instanceof Error && (n = o);
        }
        if (
          (await t.runCallbacks('handlerDidComplete', {
            event: r,
            request: s,
            response: a,
            error: n,
          }),
          t.destroy(),
          n)
        )
          throw n;
      }
    };
  var _ = class extends x {
      constructor(t = {}) {
        super(t);
        i(this, '_networkTimeoutSeconds');
        this.plugins.some((s) => 'cacheWillUpdate' in s) || this.plugins.unshift(Y),
          (this._networkTimeoutSeconds = t.networkTimeoutSeconds || 0);
      }
      async _handle(t, s) {
        let r = [],
          a = [],
          n;
        if (this._networkTimeoutSeconds) {
          let { id: l, promise: u } = this._getTimeoutPromise({ request: t, logs: r, handler: s });
          (n = l), a.push(u);
        }
        let o = this._getNetworkPromise({ timeoutId: n, request: t, logs: r, handler: s });
        a.push(o);
        let c = await s.waitUntil(
          (async () => (await s.waitUntil(Promise.race(a))) || (await o))(),
        );
        if (!c) throw new h('no-response', { url: t.url });
        return c;
      }
      _getTimeoutPromise({ request: t, logs: s, handler: r }) {
        let a;
        return {
          promise: new Promise((n) => {
            a = setTimeout(async () => {
              n(await r.cacheMatch(t));
            }, this._networkTimeoutSeconds * 1e3);
          }),
          id: a,
        };
      }
      async _getNetworkPromise({ timeoutId: t, request: s, logs: r, handler: a }) {
        let n, o;
        try {
          o = await a.fetchAndCachePut(s);
        } catch (c) {
          c instanceof Error && (n = c);
        }
        return t && clearTimeout(t), (n || !o) && (o = await a.cacheMatch(s)), o;
      }
    },
    be = class extends x {
      constructor(t = {}) {
        super(t);
        i(this, '_networkTimeoutSeconds');
        this._networkTimeoutSeconds = t.networkTimeoutSeconds || 0;
      }
      async _handle(t, s) {
        let r, a;
        try {
          let n = [s.fetch(t)];
          if (this._networkTimeoutSeconds) {
            let o = S(this._networkTimeoutSeconds * 1e3);
            n.push(o);
          }
          if (((a = await Promise.race(n)), !a))
            throw new Error(
              `Timed out the network response after ${this._networkTimeoutSeconds} seconds.`,
            );
        } catch (n) {
          n instanceof Error && (r = n);
        }
        if (!a) throw new h('no-response', { url: t.url, error: r });
        return a;
      }
    };
  var q = (e) => (e && typeof e == 'object' ? e : { handle: e }),
    p = class {
      constructor(e, t, s = 'GET') {
        i(this, 'handler');
        i(this, 'match');
        i(this, 'method');
        i(this, 'catchHandler');
        (this.handler = q(t)), (this.match = e), (this.method = s);
      }
      setCatchHandler(e) {
        this.catchHandler = q(e);
      }
    },
    g,
    ve =
      ((g = class extends x {
        constructor(s = {}) {
          s.cacheName = E.getPrecacheName(s.cacheName);
          super(s);
          i(this, '_fallbackToNetwork');
          (this._fallbackToNetwork = s.fallbackToNetwork !== !1),
            this.plugins.push(g.copyRedirectedCacheableResponsesPlugin);
        }
        async _handle(s, r) {
          let a = await r.getPreloadResponse();
          if (a) return a;
          let n = await r.cacheMatch(s);
          return (
            n ||
            (r.event && r.event.type === 'install'
              ? await this._handleInstall(s, r)
              : await this._handleFetch(s, r))
          );
        }
        async _handleFetch(s, r) {
          let a,
            n = r.params || {};
          if (this._fallbackToNetwork) {
            let o = n.integrity,
              c = s.integrity,
              l = !c || c === o;
            if (
              ((a = await r.fetch(
                new Request(s, { integrity: s.mode !== 'no-cors' ? c || o : void 0 }),
              )),
              o && l && s.mode !== 'no-cors')
            ) {
              this._useDefaultCacheabilityPluginIfNeeded();
              let u = await r.cachePut(s, a.clone());
            }
          } else throw new h('missing-precache-entry', { cacheName: this.cacheName, url: s.url });
          return a;
        }
        async _handleInstall(s, r) {
          this._useDefaultCacheabilityPluginIfNeeded();
          let a = await r.fetch(s);
          if (!(await r.cachePut(s, a.clone())))
            throw new h('bad-precaching-response', { url: s.url, status: a.status });
          return a;
        }
        _useDefaultCacheabilityPluginIfNeeded() {
          let s = null,
            r = 0;
          for (let [a, n] of this.plugins.entries())
            n !== g.copyRedirectedCacheableResponsesPlugin &&
              (n === g.defaultPrecacheCacheabilityPlugin && (s = a), n.cacheWillUpdate && r++);
          r === 0
            ? this.plugins.push(g.defaultPrecacheCacheabilityPlugin)
            : r > 1 && s !== null && this.plugins.splice(s, 1);
        }
      }),
      i(g, 'defaultPrecacheCacheabilityPlugin', {
        async cacheWillUpdate({ response: s }) {
          return !s || s.status >= 400 ? null : s;
        },
      }),
      i(g, 'copyRedirectedCacheableResponsesPlugin', {
        async cacheWillUpdate({ response: s }) {
          return s.redirected ? await ye(s) : s;
        },
      }),
      g),
    xe = class extends p {
      constructor(t, { allowlist: s = [/./], denylist: r = [] } = {}) {
        super((a) => this._match(a), t);
        i(this, '_allowlist');
        i(this, '_denylist');
        (this._allowlist = s), (this._denylist = r);
      }
      _match({ url: t, request: s }) {
        if (s && s.mode !== 'navigate') return !1;
        let r = t.pathname + t.search;
        for (let a of this._denylist) if (a.test(r)) return !1;
        return !!this._allowlist.some((a) => a.test(r));
      }
    },
    De = () => !!self.registration?.navigationPreload,
    Se = (e) => {
      De() &&
        self.addEventListener('activate', (t) => {
          t.waitUntil(
            self.registration.navigationPreload.enable().then(() => {
              e && self.registration.navigationPreload.setHeaderValue(e);
            }),
          );
        });
    };
  var it = (e, t = []) => {
    for (let s of [...e.searchParams.keys()]) t.some((r) => r.test(s)) && e.searchParams.delete(s);
    return e;
  };
  function* Te(
    e,
    {
      directoryIndex: t = 'index.html',
      ignoreURLParametersMatching: s = [/^utm_/, /^fbclid$/],
      cleanURLs: r = !0,
      urlManipulation: a,
    } = {},
  ) {
    let n = new URL(e, location.href);
    (n.hash = ''), yield n.href;
    let o = it(n, s);
    if ((yield o.href, t && o.pathname.endsWith('/'))) {
      let c = new URL(o.href);
      (c.pathname += t), yield c.href;
    }
    if (r) {
      let c = new URL(o.href);
      (c.pathname += '.html'), yield c.href;
    }
    if (a) {
      let c = a({ url: n });
      for (let l of c) yield l.href;
    }
  }
  var qe = class extends p {
      constructor(e, t, s) {
        let r = ({ url: a }) => {
          let n = e.exec(a.href);
          if (n && !(a.origin !== location.origin && n.index !== 0)) return n.slice(1);
        };
        super(r, t, s);
      }
    },
    Ce = (e) => {
      E.updateDetails(e);
    },
    ct = '__WB_REVISION__',
    Ae = (e) => {
      if (!e) throw new h('add-to-cache-list-unexpected-type', { entry: e });
      if (typeof e == 'string') {
        let n = new URL(e, location.href);
        return { cacheKey: n.href, url: n.href };
      }
      let { revision: t, url: s } = e;
      if (!s) throw new h('add-to-cache-list-unexpected-type', { entry: e });
      if (!t) {
        let n = new URL(s, location.href);
        return { cacheKey: n.href, url: n.href };
      }
      let r = new URL(s, location.href),
        a = new URL(s, location.href);
      return r.searchParams.set(ct, t), { cacheKey: r.href, url: a.href };
    },
    Oe = class {
      constructor() {
        i(this, 'updatedURLs', []);
        i(this, 'notUpdatedURLs', []);
        i(this, 'handlerWillStart', async ({ request: e, state: t }) => {
          t && (t.originalRequest = e);
        });
        i(this, 'cachedResponseWillBeUsed', async ({ event: e, state: t, cachedResponse: s }) => {
          if (e.type === 'install' && t?.originalRequest && t.originalRequest instanceof Request) {
            let r = t.originalRequest.url;
            s ? this.notUpdatedURLs.push(r) : this.updatedURLs.push(r);
          }
          return s;
        });
      }
    },
    ke = (e, t, s) => {
      if (typeof e == 'string') {
        let r = new URL(e, location.href),
          a = ({ url: n }) => n.href === r.href;
        return new p(a, t, s);
      }
      if (e instanceof RegExp) return new qe(e, t, s);
      if (typeof e == 'function') return new p(e, t, s);
      if (e instanceof p) return e;
      throw new h('unsupported-route-type', {
        moduleName: 'serwist',
        funcName: 'parseRoute',
        paramName: 'capture',
      });
    };
  var Ue = async (e, t, s) => {
    let r = t.map((o, c) => ({ index: c, item: o })),
      a = async (o) => {
        let c = [];
        for (;;) {
          let l = r.pop();
          if (!l) return o(c);
          let u = await s(l.item);
          c.push({ result: u, index: l.index });
        }
      },
      n = Array.from({ length: e }, () => new Promise(a));
    return (await Promise.all(n))
      .flat()
      .sort((o, c) => (o.index < c.index ? -1 : 1))
      .map((o) => o.result);
  };
  var bs = typeof navigator < 'u' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  var lt = 'serwist-expiration',
    P = 'cache-entries',
    Pe = (e) => {
      let t = new URL(e, location.href);
      return (t.hash = ''), t.href;
    },
    ut = class {
      constructor(e) {
        i(this, '_cacheName');
        i(this, '_db', null);
        this._cacheName = e;
      }
      _getId(e) {
        return `${this._cacheName}|${Pe(e)}`;
      }
      _upgradeDb(e) {
        let t = e.createObjectStore(P, { keyPath: 'id' });
        t.createIndex('cacheName', 'cacheName', { unique: !1 }),
          t.createIndex('timestamp', 'timestamp', { unique: !1 });
      }
      _upgradeDbAndDeleteOldDbs(e) {
        this._upgradeDb(e), this._cacheName && pe(this._cacheName);
      }
      async setTimestamp(e, t) {
        e = Pe(e);
        let s = { id: this._getId(e), cacheName: this._cacheName, url: e, timestamp: t },
          r = (await this.getDb()).transaction(P, 'readwrite', { durability: 'relaxed' });
        await r.store.put(s), await r.done;
      }
      async getTimestamp(e) {
        return (await (await this.getDb()).get(P, this._getId(e)))?.timestamp;
      }
      async expireEntries(e, t) {
        let s = await (await this.getDb())
            .transaction(P, 'readwrite')
            .store.index('timestamp')
            .openCursor(null, 'prev'),
          r = [],
          a = 0;
        for (; s; ) {
          let n = s.value;
          n.cacheName === this._cacheName &&
            ((e && n.timestamp < e) || (t && a >= t) ? (s.delete(), r.push(n.url)) : a++),
            (s = await s.continue());
        }
        return r;
      }
      async getDb() {
        return (
          this._db ||
            (this._db = await O(lt, 1, { upgrade: this._upgradeDbAndDeleteOldDbs.bind(this) })),
          this._db
        );
      }
    },
    ht = class {
      constructor(e, t = {}) {
        i(this, '_isRunning', !1);
        i(this, '_rerunRequested', !1);
        i(this, '_maxEntries');
        i(this, '_maxAgeSeconds');
        i(this, '_matchOptions');
        i(this, '_cacheName');
        i(this, '_timestampModel');
        (this._maxEntries = t.maxEntries),
          (this._maxAgeSeconds = t.maxAgeSeconds),
          (this._matchOptions = t.matchOptions),
          (this._cacheName = e),
          (this._timestampModel = new ut(e));
      }
      async expireEntries() {
        if (this._isRunning) {
          this._rerunRequested = !0;
          return;
        }
        this._isRunning = !0;
        let e = this._maxAgeSeconds ? Date.now() - this._maxAgeSeconds * 1e3 : 0,
          t = await this._timestampModel.expireEntries(e, this._maxEntries),
          s = await self.caches.open(this._cacheName);
        for (let r of t) await s.delete(r, this._matchOptions);
        (this._isRunning = !1),
          this._rerunRequested && ((this._rerunRequested = !1), this.expireEntries());
      }
      async updateTimestamp(e) {
        await this._timestampModel.setTimestamp(e, Date.now());
      }
      async isURLExpired(e) {
        if (!this._maxAgeSeconds) return !1;
        let t = await this._timestampModel.getTimestamp(e),
          s = Date.now() - this._maxAgeSeconds * 1e3;
        return t !== void 0 ? t < s : !0;
      }
      async delete() {
        (this._rerunRequested = !1),
          await this._timestampModel.expireEntries(Number.POSITIVE_INFINITY);
      }
    },
    dt = (e) => {
      V.add(e);
    },
    f = class {
      constructor(e = {}) {
        i(this, '_config');
        i(this, '_cacheExpirations');
        (this._config = e),
          (this._cacheExpirations = new Map()),
          this._config.maxAgeFrom || (this._config.maxAgeFrom = 'last-fetched'),
          this._config.purgeOnQuotaError && dt(() => this.deleteCacheAndMetadata());
      }
      _getCacheExpiration(e) {
        if (e === E.getRuntimeName()) throw new h('expire-custom-caches-only');
        let t = this._cacheExpirations.get(e);
        return t || ((t = new ht(e, this._config)), this._cacheExpirations.set(e, t)), t;
      }
      cachedResponseWillBeUsed({ event: e, cacheName: t, request: s, cachedResponse: r }) {
        if (!r) return null;
        let a = this._isResponseDateFresh(r),
          n = this._getCacheExpiration(t),
          o = this._config.maxAgeFrom === 'last-used',
          c = (async () => {
            o && (await n.updateTimestamp(s.url)), await n.expireEntries();
          })();
        try {
          e.waitUntil(c);
        } catch {}
        return a ? r : null;
      }
      _isResponseDateFresh(e) {
        if (this._config.maxAgeFrom === 'last-used') return !0;
        let t = Date.now();
        if (!this._config.maxAgeSeconds) return !0;
        let s = this._getDateHeaderTimestamp(e);
        return s === null ? !0 : s >= t - this._config.maxAgeSeconds * 1e3;
      }
      _getDateHeaderTimestamp(e) {
        if (!e.headers.has('date')) return null;
        let t = e.headers.get('date'),
          s = new Date(t).getTime();
        return Number.isNaN(s) ? null : s;
      }
      async cacheDidUpdate({ cacheName: e, request: t }) {
        let s = this._getCacheExpiration(e);
        await s.updateTimestamp(t.url), await s.expireEntries();
      }
      async deleteCacheAndMetadata() {
        for (let [e, t] of this._cacheExpirations) await self.caches.delete(e), await t.delete();
        this._cacheExpirations = new Map();
      }
    },
    pt = 'serwist-google-analytics',
    gt = 2880,
    ft = /^\/(\w+\/)?collect/,
    mt =
      (e) =>
      async ({ queue: t }) => {
        let s;
        for (; (s = await t.shiftRequest()); ) {
          let { request: r, timestamp: a } = s,
            n = new URL(r.url);
          try {
            let o =
                r.method === 'POST' ? new URLSearchParams(await r.clone().text()) : n.searchParams,
              c = a - (Number(o.get('qt')) || 0),
              l = Date.now() - c;
            if ((o.set('qt', String(l)), e.parameterOverrides))
              for (let u of Object.keys(e.parameterOverrides)) {
                let d = e.parameterOverrides[u];
                o.set(u, d);
              }
            typeof e.hitFilter == 'function' && e.hitFilter.call(null, o),
              await fetch(
                new Request(n.origin + n.pathname, {
                  body: o.toString(),
                  method: 'POST',
                  mode: 'cors',
                  credentials: 'omit',
                  headers: { 'Content-Type': 'text/plain' },
                }),
              );
          } catch (o) {
            throw (await t.unshiftRequest(s), o);
          }
        }
      },
    wt = (e) => {
      let t = ({ url: r }) => r.hostname === 'www.google-analytics.com' && ft.test(r.pathname),
        s = new be({ plugins: [e] });
      return [new p(t, s, 'GET'), new p(t, s, 'POST')];
    },
    yt = (e) => {
      let t = ({ url: s }) =>
        s.hostname === 'www.google-analytics.com' && s.pathname === '/analytics.js';
      return new p(t, new _({ cacheName: e }), 'GET');
    },
    Et = (e) => {
      let t = ({ url: s }) =>
        s.hostname === 'www.googletagmanager.com' && s.pathname === '/gtag/js';
      return new p(t, new _({ cacheName: e }), 'GET');
    },
    Nt = (e) => {
      let t = ({ url: s }) => s.hostname === 'www.googletagmanager.com' && s.pathname === '/gtm.js';
      return new p(t, new _({ cacheName: e }), 'GET');
    },
    Ie = ({ serwist: e, cacheName: t, ...s }) => {
      let r = E.getGoogleAnalyticsName(t),
        a = new _e(pt, { maxRetentionTime: gt, onSync: mt(s) }),
        n = [Nt(r), yt(r), Et(r), ...wt(a)];
      for (let o of n) e.registerRoute(o);
    },
    _t = class {
      constructor({ fallbackUrls: e, serwist: t }) {
        i(this, '_fallbackUrls');
        i(this, '_serwist');
        (this._fallbackUrls = e), (this._serwist = t);
      }
      async handlerDidError(e) {
        for (let t of this._fallbackUrls)
          if (typeof t == 'string') {
            let s = await this._serwist.matchPrecache(t);
            if (s !== void 0) return s;
          } else if (t.matcher(e)) {
            let s = await this._serwist.matchPrecache(t.url);
            if (s !== void 0) return s;
          }
      }
    };
  var X = class extends x {
    async _handle(e, t) {
      let s = [],
        r = await t.cacheMatch(e),
        a;
      if (!r)
        try {
          r = await t.fetchAndCachePut(e);
        } catch (n) {
          n instanceof Error && (a = n);
        }
      if (!r) throw new h('no-response', { url: e.url, error: a });
      return r;
    }
  };
  var C = class extends x {
      constructor(e = {}) {
        super(e), this.plugins.some((t) => 'cacheWillUpdate' in t) || this.plugins.unshift(Y);
      }
      async _handle(e, t) {
        let s = [],
          r = t.fetchAndCachePut(e).catch(() => {});
        t.waitUntil(r);
        let a = await t.cacheMatch(e),
          n;
        if (!a)
          try {
            a = await r;
          } catch (o) {
            o instanceof Error && (n = o);
          }
        if (!a) throw new h('no-response', { url: e.url, error: n });
        return a;
      }
    },
    Rt = class extends p {
      constructor(e, t) {
        let s = ({ request: r }) => {
          let a = e.getUrlsToPrecacheKeys();
          for (let n of Te(r.url, t)) {
            let o = a.get(n);
            if (o) return { cacheKey: o, integrity: e.getIntegrityForPrecacheKey(o) };
          }
        };
        super(s, e.precacheStrategy);
      }
    },
    bt = class {
      constructor({ precacheController: e }) {
        i(this, '_precacheController');
        i(this, 'cacheKeyWillBeUsed', async ({ request: e, params: t }) => {
          let s = t?.cacheKey || this._precacheController.getPrecacheKeyForUrl(e.url);
          return s ? new Request(s, { headers: e.headers }) : e;
        });
        this._precacheController = e;
      }
    },
    vt = (e, t = {}) => {
      let {
        cacheName: s,
        plugins: r = [],
        fetchOptions: a,
        matchOptions: n,
        fallbackToNetwork: o,
        directoryIndex: c,
        ignoreURLParametersMatching: l,
        cleanURLs: u,
        urlManipulation: d,
        cleanupOutdatedCaches: w,
        concurrency: v = 10,
        navigateFallback: I,
        navigateFallbackAllowlist: R,
        navigateFallbackDenylist: m,
      } = t ?? {};
      return {
        precacheStrategyOptions: {
          cacheName: E.getPrecacheName(s),
          plugins: [...r, new bt({ precacheController: e })],
          fetchOptions: a,
          matchOptions: n,
          fallbackToNetwork: o,
        },
        precacheRouteOptions: {
          directoryIndex: c,
          ignoreURLParametersMatching: l,
          cleanURLs: u,
          urlManipulation: d,
        },
        precacheMiscOptions: {
          cleanupOutdatedCaches: w,
          concurrency: v,
          navigateFallback: I,
          navigateFallbackAllowlist: R,
          navigateFallbackDenylist: m,
        },
      };
    },
    $e = class {
      constructor({
        precacheEntries: e,
        precacheOptions: t,
        skipWaiting: s = !1,
        importScripts: r,
        navigationPreload: a = !1,
        cacheId: n,
        clientsClaim: o = !1,
        runtimeCaching: c,
        offlineAnalyticsConfig: l,
        disableDevLogs: u = !1,
        fallbacks: d,
        requestRules: w,
      } = {}) {
        i(this, '_urlsToCacheKeys', new Map());
        i(this, '_urlsToCacheModes', new Map());
        i(this, '_cacheKeysToIntegrities', new Map());
        i(this, '_concurrentPrecaching');
        i(this, '_precacheStrategy');
        i(this, '_routes');
        i(this, '_defaultHandlerMap');
        i(this, '_catchHandler');
        i(this, '_requestRules');
        let {
          precacheStrategyOptions: v,
          precacheRouteOptions: I,
          precacheMiscOptions: R,
        } = vt(this, t);
        if (
          ((this._concurrentPrecaching = R.concurrency),
          (this._precacheStrategy = new ve(v)),
          (this._routes = new Map()),
          (this._defaultHandlerMap = new Map()),
          (this._requestRules = w),
          (this.handleInstall = this.handleInstall.bind(this)),
          (this.handleActivate = this.handleActivate.bind(this)),
          (this.handleFetch = this.handleFetch.bind(this)),
          (this.handleCache = this.handleCache.bind(this)),
          r && r.length > 0 && self.importScripts(...r),
          a && Se(),
          n !== void 0 && Ce({ prefix: n }),
          s
            ? self.skipWaiting()
            : self.addEventListener('message', (m) => {
                m.data && m.data.type === 'SKIP_WAITING' && self.skipWaiting();
              }),
          o && oe(),
          e && e.length > 0 && this.addToPrecacheList(e),
          R.cleanupOutdatedCaches && ne(v.cacheName),
          this.registerRoute(new Rt(this, I)),
          R.navigateFallback &&
            this.registerRoute(
              new xe(this.createHandlerBoundToUrl(R.navigateFallback), {
                allowlist: R.navigateFallbackAllowlist,
                denylist: R.navigateFallbackDenylist,
              }),
            ),
          l !== void 0 &&
            (typeof l == 'boolean' ? l && Ie({ serwist: this }) : Ie({ ...l, serwist: this })),
          c !== void 0)
        ) {
          if (d !== void 0) {
            let m = new _t({ fallbackUrls: d.entries, serwist: this });
            c.forEach(($) => {
              $.handler instanceof x &&
                !$.handler.plugins.some((Le) => 'handlerDidError' in Le) &&
                $.handler.plugins.push(m);
            });
          }
          for (let m of c) this.registerCapture(m.matcher, m.handler, m.method);
        }
        u && Ee();
      }
      get precacheStrategy() {
        return this._precacheStrategy;
      }
      get routes() {
        return this._routes;
      }
      addEventListeners() {
        self.addEventListener('install', this.handleInstall),
          self.addEventListener('activate', this.handleActivate),
          self.addEventListener('fetch', this.handleFetch),
          self.addEventListener('message', this.handleCache);
      }
      addToPrecacheList(e) {
        let t = [];
        for (let s of e) {
          typeof s == 'string'
            ? t.push(s)
            : s && !s.integrity && s.revision === void 0 && t.push(s.url);
          let { cacheKey: r, url: a } = Ae(s),
            n = typeof s != 'string' && s.revision ? 'reload' : 'default';
          if (this._urlsToCacheKeys.has(a) && this._urlsToCacheKeys.get(a) !== r)
            throw new h('add-to-cache-list-conflicting-entries', {
              firstEntry: this._urlsToCacheKeys.get(a),
              secondEntry: r,
            });
          if (typeof s != 'string' && s.integrity) {
            if (
              this._cacheKeysToIntegrities.has(r) &&
              this._cacheKeysToIntegrities.get(r) !== s.integrity
            )
              throw new h('add-to-cache-list-conflicting-integrities', { url: a });
            this._cacheKeysToIntegrities.set(r, s.integrity);
          }
          this._urlsToCacheKeys.set(a, r), this._urlsToCacheModes.set(a, n);
        }
        if (t.length > 0) {
          let s = `Serwist is precaching URLs without revision info: ${t.join(', ')}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`;
          console.warn(s);
        }
      }
      handleInstall(e) {
        return (
          this.registerRequestRules(e),
          F(e, async () => {
            let t = new Oe();
            this.precacheStrategy.plugins.push(t),
              await Ue(
                this._concurrentPrecaching,
                Array.from(this._urlsToCacheKeys.entries()),
                async ([a, n]) => {
                  let o = this._cacheKeysToIntegrities.get(n),
                    c = this._urlsToCacheModes.get(a),
                    l = new Request(a, { integrity: o, cache: c, credentials: 'same-origin' });
                  await Promise.all(
                    this.precacheStrategy.handleAll({
                      event: e,
                      request: l,
                      url: new URL(l.url),
                      params: { cacheKey: n },
                    }),
                  );
                },
              );
            let { updatedURLs: s, notUpdatedURLs: r } = t;
            return { updatedURLs: s, notUpdatedURLs: r };
          })
        );
      }
      async registerRequestRules(e) {
        if (this._requestRules && e?.addRoutes)
          try {
            await e.addRoutes(this._requestRules), (this._requestRules = void 0);
          } catch (t) {
            throw t;
          }
      }
      handleActivate(e) {
        return F(e, async () => {
          let t = await self.caches.open(this.precacheStrategy.cacheName),
            s = await t.keys(),
            r = new Set(this._urlsToCacheKeys.values()),
            a = [];
          for (let n of s) r.has(n.url) || (await t.delete(n), a.push(n.url));
          return { deletedCacheRequests: a };
        });
      }
      handleFetch(e) {
        let { request: t } = e,
          s = this.handleRequest({ request: t, event: e });
        s && e.respondWith(s);
      }
      handleCache(e) {
        if (e.data && e.data.type === 'CACHE_URLS') {
          let { payload: t } = e.data,
            s = Promise.all(
              t.urlsToCache.map((r) => {
                let a;
                return (
                  typeof r == 'string' ? (a = new Request(r)) : (a = new Request(...r)),
                  this.handleRequest({ request: a, event: e })
                );
              }),
            );
          e.waitUntil(s), e.ports?.[0] && s.then(() => e.ports[0].postMessage(!0));
        }
      }
      setDefaultHandler(e, t = 'GET') {
        this._defaultHandlerMap.set(t, q(e));
      }
      setCatchHandler(e) {
        this._catchHandler = q(e);
      }
      registerCapture(e, t, s) {
        let r = ke(e, t, s);
        return this.registerRoute(r), r;
      }
      registerRoute(e) {
        this._routes.has(e.method) || this._routes.set(e.method, []),
          this._routes.get(e.method).push(e);
      }
      unregisterRoute(e) {
        if (!this._routes.has(e.method))
          throw new h('unregister-route-but-not-found-with-method', { method: e.method });
        let t = this._routes.get(e.method).indexOf(e);
        if (t > -1) this._routes.get(e.method).splice(t, 1);
        else throw new h('unregister-route-route-not-registered');
      }
      getUrlsToPrecacheKeys() {
        return this._urlsToCacheKeys;
      }
      getPrecachedUrls() {
        return [...this._urlsToCacheKeys.keys()];
      }
      getPrecacheKeyForUrl(e) {
        let t = new URL(e, location.href);
        return this._urlsToCacheKeys.get(t.href);
      }
      getIntegrityForPrecacheKey(e) {
        return this._cacheKeysToIntegrities.get(e);
      }
      async matchPrecache(e) {
        let t = e instanceof Request ? e.url : e,
          s = this.getPrecacheKeyForUrl(t);
        if (s) return (await self.caches.open(this.precacheStrategy.cacheName)).match(s);
      }
      createHandlerBoundToUrl(e) {
        let t = this.getPrecacheKeyForUrl(e);
        if (!t) throw new h('non-precached-url', { url: e });
        return (s) => (
          (s.request = new Request(e)),
          (s.params = { cacheKey: t, ...s.params }),
          this.precacheStrategy.handle(s)
        );
      }
      handleRequest({ request: e, event: t }) {
        let s = new URL(e.url, location.href);
        if (!s.protocol.startsWith('http')) return;
        let r = s.origin === location.origin,
          { params: a, route: n } = this.findMatchingRoute({
            event: t,
            request: e,
            sameOrigin: r,
            url: s,
          }),
          o = n?.handler,
          c = [],
          l = e.method;
        if ((!o && this._defaultHandlerMap.has(l) && (o = this._defaultHandlerMap.get(l)), !o))
          return;
        let u;
        try {
          u = o.handle({ url: s, request: e, event: t, params: a });
        } catch (w) {
          u = Promise.reject(w);
        }
        let d = n?.catchHandler;
        return (
          u instanceof Promise &&
            (this._catchHandler || d) &&
            (u = u.catch(async (w) => {
              if (d)
                try {
                  return await d.handle({ url: s, request: e, event: t, params: a });
                } catch (v) {
                  v instanceof Error && (w = v);
                }
              if (this._catchHandler)
                return this._catchHandler.handle({ url: s, request: e, event: t });
              throw w;
            })),
          u
        );
      }
      findMatchingRoute({ url: e, sameOrigin: t, request: s, event: r }) {
        let a = this._routes.get(s.method) || [];
        for (let n of a) {
          let o,
            c = n.match({ url: e, sameOrigin: t, request: s, event: r });
          if (c)
            return (
              (o = c),
              ((Array.isArray(o) && o.length === 0) ||
                (c.constructor === Object && Object.keys(c).length === 0) ||
                typeof c == 'boolean') &&
                (o = void 0),
              { route: n, params: o }
            );
        }
        return {};
      }
    };
  var xt =
      typeof self < 'u' &&
      (self.location.hostname === 'localhost' ||
        self.location.hostname === '127.0.0.1' ||
        self.location.hostname.endsWith('.space-z.ai') ||
        self.location.hostname.endsWith('.preview.z.ai')),
    Dt = [
      { url: '/', revision: 'e07b45cb8db8c212' },
      { url: '/manifest.json', revision: 'e07b45cb8db8c212' },
      { url: '/icons/icon-192.png', revision: 'e07b45cb8db8c212' },
      { url: '/icons/icon-512.png', revision: 'e07b45cb8db8c212' },
    ],
    St = ({ url: e, request: t }) =>
      e.origin !== self.location.origin
        ? !1
        : !!(
            e.pathname.startsWith('/_next/static/') ||
            e.pathname.startsWith('/icons/') ||
            t.destination === 'font' ||
            t.destination === 'image'
          ),
    Tt = ({ url: e }) => /^\/api\/books\/[^/]+\/pages/.test(e.pathname),
    qt = ({ url: e }) => e.pathname === '/api/dictionary',
    Ct = ({ url: e, request: t }) =>
      e.origin === self.location.origin && e.pathname === '/api/tts' && t.method === 'GET',
    At = ({ url: e }) => e.pathname.startsWith('/api/og/'),
    Ot = ({ url: e }) => e.origin === self.location.origin && e.pathname.startsWith('/books/read/'),
    kt = ({ url: e, request: t }) =>
      e.origin === self.location.origin && t.method === 'GET' && t.headers.get('RSC') === '1',
    Ut = ({ url: e }) =>
      e.origin === self.location.origin &&
      e.pathname.startsWith('/api/') &&
      !e.pathname.startsWith('/api/auth/'),
    Pt = {
      cacheKeyWillBeUsed: async ({ request: e }) => {
        if (e.method !== 'POST') return e;
        try {
          let s = await e
              .clone()
              .json()
              .catch(() => null),
            r = s && typeof s.word == 'string' && s.word.length > 0 ? s.word : '';
          return `/api/dictionary?w=${encodeURIComponent(r)}&context=${encodeURIComponent(typeof s?.context == 'string' ? s.context : '')}`;
        } catch {
          return e;
        }
      },
    };
  self.addEventListener('activate', (e) => {
    e.waitUntil(
      (async () => {
        let t = new U('bookzi-sync-queue');
        for (let a of await t.getAll()) await t.deleteEntry(a.id);
        let s = ['bookzi-pages', 'bookzi-fresh-api', 'ketab-pages'],
          r = await caches.keys();
        await Promise.all(
          r.filter((a) => s.includes(a) || /^bookzi-reader-/.test(a)).map((a) => caches.delete(a)),
        );
      })(),
    );
  });
  var It = new $e({
    precacheEntries: [...(self.__SW_MANIFEST || []), ...Dt],
    skipWaiting: !0,
    clientsClaim: !0,
    navigationPreload: !0,
    disableDevLogs: !0,
    runtimeCaching: [
      {
        matcher: St,
        handler: xt
          ? new _({
              cacheName: 'bookzi-static',
              networkTimeoutSeconds: 3,
              plugins: [new f({ maxEntries: 80, maxAgeSeconds: 3600 * 24 * 30 })],
            })
          : new X({
              cacheName: 'bookzi-static',
              plugins: [new f({ maxEntries: 80, maxAgeSeconds: 3600 * 24 * 30 })],
            }),
      },
      {
        matcher: Tt,
        method: 'GET',
        handler: new C({
          cacheName: 'bookzi-book-content',
          plugins: [new f({ maxEntries: 200, maxAgeSeconds: 3600 * 24 * 90 })],
        }),
      },
      {
        matcher: qt,
        method: 'POST',
        handler: new C({
          cacheName: 'bookzi-dictionary',
          plugins: [Pt, new f({ maxEntries: 500, maxAgeSeconds: 3600 * 24 * 30 })],
        }),
      },
      {
        matcher: Ct,
        method: 'GET',
        handler: new X({
          cacheName: 'bookzi-tts-audio',
          plugins: [new f({ maxEntries: 300, maxAgeSeconds: 3600 * 24 * 30 })],
        }),
      },
      {
        matcher: At,
        method: 'GET',
        handler: new C({
          cacheName: 'bookzi-og',
          plugins: [new f({ maxEntries: 50, maxAgeSeconds: 3600 * 24 * 7 })],
        }),
      },
      {
        matcher: Ot,
        method: 'GET',
        handler: new _({
          cacheName: 'bookzi-nav',
          networkTimeoutSeconds: 3,
          plugins: [new f({ maxEntries: 100, maxAgeSeconds: 3600 * 24 * 30 })],
        }),
      },
      {
        matcher: kt,
        method: 'GET',
        handler: new _({
          cacheName: 'bookzi-rsc',
          networkTimeoutSeconds: 3,
          plugins: [new f({ maxEntries: 120, maxAgeSeconds: 3600 * 24 * 14 })],
        }),
      },
      {
        matcher: Ut,
        method: 'GET',
        handler: new C({
          cacheName: 'bookzi-api',
          plugins: [new f({ maxEntries: 300, maxAgeSeconds: 3600 * 24 * 7 })],
        }),
      },
      {
        matcher: ({ request: e }) => e.mode === 'navigate',
        handler: new _({
          cacheName: 'bookzi-nav',
          networkTimeoutSeconds: 3,
          plugins: [new f({ maxEntries: 100, maxAgeSeconds: 3600 * 24 * 30 })],
        }),
      },
    ],
    fallbacks: { entries: [{ url: '/', matcher: ({ request: e }) => e.mode === 'navigate' }] },
  });
  It.addEventListeners();
})();
