import { sleep, visibleLog } from "#utils/utils.js";

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
  const r = await fetch(url, options);
  // TODO  delete
  // let r;
  // if (retries>3) {
  //   r = { ok: false, status: 500, statusText: 'Internal Server Error' };
  // } else {
  //   r = await fetch(url, options);
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