import pLimit from "p-limit";

import { sleep, visibleLog } from "#utils/utils.js";


/**
 * Limiter is a wrapper to `p-limit` that tracks the number
 * of concurrent processes currently used by the limiter.
 * this is used instead of a plain `p-limit` object because
 * there is a very small possibility that `pendingCount`
 * and `activeCount` can become desynchronized for a small
 * moment in the call stack. this adds an extra layer of security
 */
class Limiter {
  /** @param {number} maxConcurrency */
  constructor(maxConcurrency) {
    this._maxConcurrency = maxConcurrency;
    this._count = 0;
    this._limit = pLimit(this._maxConcurrency);
  }
  /** @type {(fn:Function, args: Array) => Promise} */
  async use(fn, args) {
    this._count++;
    try {
      return this._limit(() => fn(...args))
    } finally {
      this._count--
    }
  }
  /** @type {() => number} */
  count() { return this._count }
  /** @type {() => number} */
  pendingCount() { return this._limit.pendingCount }
  /** @type {() => number} */
  activeCount() { return this._limit.activeCount }
}

/**
 * LimiterPool handles rate-limiting.
 * it stores a map of URL hosts to rate-limiters. used with `fetch`,
 * it means that a maximum of `maxConcurrency` requests can be made
 * at once to a given host.
 * LimiterPool also tracks the number of requests per limiter. if a
 * limiter is undefined, the limiter is dropped to avoid our LimiterPool
 * to grow unbounded.
 */
class LimiterPool {
  /** @param {number} maxConcurrency */
  constructor(maxConcurrency) {
    this._maxConcurrency = maxConcurrency;
    // limiters is a map of (URL host, Limiter).
    // we use a map instead of an object because host is user supplied
    // and using a user-defined value as an object key is a security risk:
    // it can lead to object prototype pollution
    this._limiters = new Map();
  }
  /**
   * add a limiter for a new host
   * @type {(host:string|URL) => void}
   */
  add(host) {
    if (!this._limiters.has(host)) {
      this._limiters.set(host, new Limiter(this._maxConcurrency)); // pLimit(this._maxConcurrency);
    }
  }
  /**
   * delete a limiter for an HTTP host
   * @type {(host:string|URL) => void}
   */
  drop(host) {
    if (Object.keys(this._limiters).includes(host)) {
      this._limiters.delete(host);
    }
  }
  /**
   * get a limiter by its host
   * @type {() => Limiter}
   */
  get(host) {
    if (!this._limiters.has(host)) {
      this.add(host);
    }
    return this._limiters.get(host);
  }
  /**
   * use a limiter and, if it becomes undefined, drop the limiter afterwards
   * @type {(host:string|URL, fn:Function, args>Array) => Promise}
   */
  async use(host, fn, args) {
    const limiter = this.get(host);
    try {
      return await limiter.use(fn, args);
    } finally {
      // drop the limiter if it is unused
      // NOTE: the current limiter becomes undefined after that.
      if (limiter.count()===0 && limiter.activeCount()===0 && limiter.pendingCount()===0) {
        this.drop(host);
      }
    }
  }
}

const lp = new LimiterPool(10);

/**
 * rate-limited alternative to `fetch`
 * NOTE: should be used instead of `fetch` when querying external services.
 *
 * @param {string|URL} url - url to fetch
 * @param {RequestInit} options - fetch options
 */
const fetchRl = async (url, options) => {
  const host = (new URL(url)).host
  return lp.use(host, fetch, [ url, options ]);
}

/**
 * JS fetch with retry logic.
 * backoff time doubles with each retry.
 * returns the full fetch response object.
 * @param {string|URL} url
 * @param {RequestInit} options - fetch options ({ method: string?, body: object, ... })
 * @param {number} retries
 * @param {number} backoff - backoff time in ms.
 * @returns {Promise<Response>}
 */
const fetchRetry = async (url, options={}, retries=5, backoff=300) => {
  const retryCodes = [ 408, 429, 500, 502, 503, 504, 522, 524 ];
  const r = await fetchRl(url, options);
  // // TODO  delete
  // let r;
  // if (retries>3) {
  //   r = { ok: false, status: 500, statusText: "Internal Server Error" };
  // } else {
  //   r = await fetchRl(url, options);
  // }
  if (r.ok) {
    return r
  }
  if (retries > 0 && retryCodes.includes(r.status)) {
    visibleLog([ "RETRY", url, options, retries-1, backoff*2 ]);
    await sleep(backoff);
    return fetchRetry(url, options, retries-1, backoff*2);
  } else {
    throw new Error(`error fetching data: ${r.status} ${r.statusText} (${url})`)
  }
}

export {
  fetchRetry
}