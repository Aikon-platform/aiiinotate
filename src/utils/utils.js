import util from "node:util";
import Ajv from "ajv";

import logger from "#utils/logger.js";
import { BASE_URL, PUBLIC_URL } from "#constants";

/**
 * @param {object} obj
 * @param {string} key
 * @returns {boolean}
 */
const objectHasKey = (obj, key) =>
  Object.keys(obj).includes(key);

const addKeyValueToObj = (obj, key, value) => {
  obj[key] = value;
  return obj;
}

const isNullOrUndefined = (v) => v == null;

const isNullish = (v) => v == null || !v.length;

/** o is an object but not an array. https://stackoverflow.com/a/44556453 */
const isObject = (o) => o?.constructor === Object;

const isNonEmptyArray = (a) => Array.isArray(a) && a.length;

/**
 * extend objOut with a key-value pair fron objIn if a key is in objIn
 * @param {object} objIn: the object that should contain key
 * @param {object} objOut: the object to extend
 * @param {string|number} key: the key in objIn.
 * @param {string?} newKey: (optional) the name of the new key in objOut. if undefined, key is used.
 */
const addKeyValueToObjIfHasKey = (objIn, objOut, key, newKey) =>
  Object.keys(objIn).includes(key)
    ? addKeyValueToObj(
      objOut,
      isNullOrUndefined(newKey) ? key : newKey,
      objIn[key]
    )
    : objOut;


/**
 * merge to objects (Dict) `objB` and `objA`.
 * if `raiseOnConflict`, the two objects cannot have conflicting keys,
 * otherwise, the values in `objB` overwrite those in objA.
 *
 * @param {object} objA
 * @param {object} objB
 * @param {boolean} raiseOnConflict
 * @returns {object}
 */
const mergeObjects = (objA, objB, raiseOnConflict=false) => {
  if (!isObject(objA) || !isObject(objB)) {
    throw new Error(`mergeObjects: objA and objB must be javascript objects (not arrays), got types '${typeof objA}' for objA and '${typeof objB}' for objB.`)
  }
  // avoid wird side effects
  const objMerge = structuredClone(objA);
  const objBMerger = structuredClone(objB);

  for (const key of Object.keys(objBMerger)) {
    if (raiseOnConflict && objMerge[key] != null) {
      throw new Error(`mergeObjects: objA and objB have conflicting key: '${key}'.`)
    }
    objMerge[key] = objBMerger[key];
  }
  return objMerge;
}

/**
 * hash generating function, copied from: https://stackoverflow.com/a/52171480
 * @returns {string}
 */
const getHash = (str, seed=0) => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return String(4294967296 * (2097151 & h2) + (h1 >>> 0));
};

/**
 * `obj` is an object of form `{ key1: val1, key2: val2, key3: val3 }`, where only a single key-value pair can be defined at the same time.
 * return the only key-value pair that is not undefined.
 *
 * use case: in a route's querystring, there may be different options that are mutually exclusive (defined using JSONschema oneOf). in that case, return the only key-value pair that is not undefined.
 * see: src/data/annotations2: '/annotations/:iiifPresentationVersion/delete'
 *
 * @param {Array<object>} obj
 * @returns {Array<string, any>?}
 */
const getFirstNonEmptyPair = (obj) => {
  let [ key,val ] = [ undefined, undefined ];
  [ key, val ] = Object.entries(obj).find(([ k,v ]) => v != null);
  if (key!== undefined && val!==undefined) {
    return [ key, val ];
  }
  return undefined;
}

/**
 * if obj[typeKey] !== expectedTypeVal, throw
 * @param {object} obj
 * @param {2|3} iiifPresentationVersion
 * @param {string|number} typeKey
 * @param {any} expectedTypeVal
 */
const throwIfValueError = (obj, typeKey, expectedTypeVal) => {
  if (obj[typeKey] !== expectedTypeVal) {
    throw new Error(`expected value '${expectedTypeVal}' for key '${typeKey}', got: '${obj[typeKey]}' in object ${inspectObj(obj)}`);
  };
}

/**
 * if obj[key] is undefined, throw
 * @param {object} obj
 * @param {string|number} key
 */
const throwIfKeyUndefined = (obj, key) => {
  if (!objectHasKey(obj, key)) {
    throw new Error(`key '${key}' not found in object ${inspectObj(obj)}`);
  }
}

/**
 * shallow-compare 2 arrays.
 * @param {Array} a1
 * @param {Array} a2
 * @param {boolean} sort: if `true`, sort before comparing
 * @returns {boolean}
 */
const arrayEqualsShallow = (a1, a2, sort=false) => {
  if (!Array.isArray(a1) || !Array.isArray(a2)) {
    throw new Error(`Incorrect type: 'a1', 'a2' must be arrays, got '${typeof a1}' and '${typeof a2}' on a1='${a1}' and a2='${a2}'`)
  }
  if (sort) {
    a1 = a1.sort();
    a2 = a2.sort();
  }
  if (a1.length!==a2.length) {
    return false;
  }
  return a1.every((el, i) => a2[i]===el);
}

/**
 * convert object `x` to an array if it is not aldready an array.
 * if `convertedFlag`, return [ obj, converted ]. `converted` is `true` if the object was converted to an array, false otherwise.
 * @param {any} x
 * @param {boolean} convertedFlag
 * @returns {Array | Array<Array, boolean> }
 */
const maybeToArray = (x, convertedFlag=false) =>
  convertedFlag
    ? Array.isArray(x) ? [ x, false ] : [[ x ], true ]
    : Array.isArray(x) ? x : [ x ];

/**
 * build a URL to this aiiinotate instance.
 * if `publicUrl`, set the root to PUBLIC_URL. otherwise, set to BASE_URL
 * @param {boolean} publicUrl
 * @returns {(path: string) => string}
 */
const pathToAiiinotateUrl = (publicUrl) =>
  (path) =>
    `${publicUrl ? PUBLIC_URL : BASE_URL}${path}`
const pathToAiiinotatePublicUrl = pathToAiiinotateUrl(true);
const pathToAiiinotateBaseUrl = pathToAiiinotateUrl(false);

/**
 * display a detailed and nested view of an object. to be used with console.log.
 * @param {any} obj - object to inspect
 * @param {number} maxLines - maximum number of lines in string output. defaults to 100. set to -1 to print the whole output regardless of size.
 * @returns
 */
const inspectObj = (obj, maxLines=100) => {
  const
    str = util.inspect(obj, { showHidden: false, depth: null, colors: true }),
    strArr = str.split("\n"),
    strLen = strArr.length;
  // if maxLines === -1, return the full `str`
  if (maxLines < 0) {
    return str;
  }
  // remove the middle lines if `str` is too long
  if (strLen > maxLines) {
    const
      startProportion = 0.8,
      startSlice = strArr.slice(0, Math.round(0.8 * maxLines)),
      endSlice = strArr.slice(-Math.round((1-startProportion) * maxLines), -1);
    return (
      startSlice.join("\n")
      + `\n ... inspectObj: ${strLen - maxLines} lines omitted ... \n`
      + endSlice.join("\n")
    )
  }
  return str;
}

/**
 * return a random item from an array.
 * @param {any[]} arr
 * @returns {any}
 */
const getRandomItem = (arr) =>
  arr.at(Math.floor(Math.random() * arr.length));

/**
 * AJV instance to run JsonSchema compilation/validation anywhere in the app
 * (not just in Fastify route definition and Mongo interactions).
 * NOTE: this is a workaround since i could not get to access fastify's AJV instance, although fastify uses AJV internally.
 */
const ajv = new Ajv({
  removeAdditional: false,
  useDefaults: true,
  coerceTypes: true,
  allErrors: true
})

/**
 * wrapper for `ajv.compile`. `schema` must be a schema resolved using `fastify.schemasResolver()`
 * NOTE: this function exists because using the native `ajv.compile` on fastify schemas (with `$id`, `$ref`...) causes tests to fail WITHOUT launching an error., making it very hard to debug
 * @param {object} schema - jsonSchema
 * @returns {import("#types").AjvValidateFunctionType}
 */
const ajvCompile = (schema) => {
  if (objectHasKey(schema, "$id") || objectHasKey(schema, "$ref")) {
    const err = new Error(`'schema' has not been resolved. use 'fastify.schemasResolver()' to resolve the schema before compiling it, on schema: ${inspectObj(schema)}`);
    // logging is necessary to be sure that the error will be displayed
    logger.error(err.message);
    throw err;
  }
  return ajv.compile(schema);
}

/**
 * print in a box for debug purposes
 * @param {any} data
 * @param {string} prefix
 */
const visibleLog = (data, prefix) => {
  console.log("<".repeat(100));
  if (prefix) console.log(prefix);
  console.log(inspectObj(data));
  console.log(">".repeat(100));
}

/**
 * sort an object recursively.
 * supported types are: Objects ({}), Arrays ([]), primitive types.
 * @param {any} x
 * @returns {any}
 */
const recursiveSort = (x) => {
  if (Array.isArray(x)) {
    x = x.sort();
    for (let i=0; i<x.length; i++) {
      x[i] = recursiveSort(x[i]);
    }
    return x;
  } else if (isObject(x)) {
    const xSorted = {};
    const keys = Object.keys(x).sort();
    for (let i=0; i<keys.length; i++) {
      let
        k = keys[i],
        v = x[k];
      xSorted[k] = recursiveSort(v);
    }
    return xSorted;
  }
  return x;
}

/**
 * Map cache with a timeout and a max size:
 * - after `timeout` ms have passed, clears the cache of the key `n`.
 * - to avoid the cache to grow unbounded, we define a max size after which
 *    we delete the greatest items in the cache.
 *
 * NOTE: LIMITATIONS:
 * - `memoize` converts `fn` to an async function to work with both
 *    sync/async patterns, remember to await !
 * - the args applied to `fn` must be JSON-stringify-able: a primitive,
 *    an array, or an object, but not a function, a class or class instance
 *
 * adapted from: https://dev.to/codewithjohnson/the-power-of-a-simple-cache-system-with-javascript-map-3j01
 *
 * @param {Function} fn - the function whose result will be cached
 * @param {number} timeout - timeout in ms to clear the cache of a newly assigned value
 * @param {number} maxSize - maximm number of elements in the cache
 * @returns {async Function} - a function that takes a value and caches its result.
 */
const memoize = (fn, timeout = 2000, maxSize = 200) => {
  if (timeout <= 0 || maxSize <= 0) {
    throw new Error("memoize: 'timeout' and 'maxSize' must be greater than 0.")
  }
  const cache = new Map();
  return async (...args) => {
    // if cache.size > cacheSize, remove the oldest items.
    const extraCount = cache.size - maxSize;
    if (extraCount > 0) {
      // get the `extraCount` oldest items in the cache.
      const deleteItems = [ ...cache.entries() ]  // convert iterator to array
        .map(([ k, { timestamp }]) => [ k, timestamp ])
        .sort((a, b) => a[1] - b[1])
        .slice(0, extraCount);

      deleteItems.forEach(([ k, _ ]) => cache.delete(k));
    }

    // stringify `args` to `key`, the key to find in the cache.
    // since `map` is a key-value store, we need to stringify `args`
    // to ensure it can be used as a key to ensure consistency,
    // we sort our objects/array before stringifying
    const key = JSON.stringify(recursiveSort(args));

    // fetch result promise, from cache or by executing `fn`.
    // instead of caching the result, we cache the promise:
    // all concurrent callers awaiting the same key get the same promise
    // instance, so `fn` is only ever called once per unique key,
    // regardless of how many callers arrive before it resolves.
    let promise;
    if (cache.has(key)) {
      promise = cache.get(key).promise;
    } else {
      promise = fn(...args);
      cache.set(key, { timestamp: Date.now(), promise: promise });
      // after `timeout` ms, clear the cache of `key`
      setTimeout(
        () => cache.delete(key),
        timeout
      )
    }

    return await promise;
  }
}

export {
  maybeToArray,
  pathToAiiinotatePublicUrl,
  pathToAiiinotateBaseUrl,
  getHash,
  isNullish,
  isObject,
  objectHasKey,
  addKeyValueToObjIfHasKey,
  getFirstNonEmptyPair,
  inspectObj,
  getRandomItem,
  arrayEqualsShallow,
  throwIfKeyUndefined,
  throwIfValueError,
  ajvCompile,
  visibleLog,
  isNonEmptyArray,
  mergeObjects,
  memoize,
}