import util from "node:util";


const objectHasKey = (obj, key) =>
  Object.keys(obj).includes(key);

const addKeyValueToObj = (obj, key, value) => {
  obj[key] = value;
  return obj;
}

const isNullOrUndefined = (v) => v == null;

const isNullish = (v) => v == null || !v.length;

/** o is an object but not an array. https://stackoverflow.com/a/44556453 */
const isObject = (o) => o.constructor === Object;

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
 * if obj[typeKey] !== expectedTypeVal, throw
 * @param {object} obj
 * @param {2|3} iiifPresentationVersion
 * @param {string|number} typeKey
 * @param {any} expectedTypeVal
 */
const throwIfValueError = (obj, typeKey, expectedTypeVal) => {
  if ( obj[typeKey] !== expectedTypeVal ) {
    throw new Error(`expected value '${expectedTypeVal}' for key '${typeKey}', got: '${obj[typeKey]}' in object ${inspectObj(obj)}`);
  };
}

/**
 * if obj[key] is undefined, throw
 * @param {object} obj
 * @param {string|number} key
 */
const throwIfKeyUndefined = (obj, key) => {
  if ( !objectHasKey(obj, key) ) {
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
  if ( !Array.isArray(a1) || !Array.isArray(a2) ) {
    throw new Error(`Incorrect type: 'a1', 'a2' must be arrays, got '${typeof a1}' and '${typeof a2}' on a1='${a1}' and a2='${a2}'`)
  }
  if ( sort ) {
    a1 = a1.sort();
    a2 = a2.sort();
  }
  if ( a1.length!==a2.length ) {
    return false;
  }
  return a1.every((el, i) => a2[i]===el);
}

const maybeToArray = (x) =>
  Array.isArray(x) ? x : [x];

const pathToUrl = (path) =>
  `${process.env.APP_BASE_URL}${path}`

const inspectObj = (obj) =>
  util.inspect(obj, {showHidden: false, depth: null, colors: true});

/**
 * return a random item from an array.
 * @param {any[]} arr
 * @returns {any}
 */
const getRandomItem = (arr) =>
  arr.at(Math.floor(Math.random() * arr.length));

export {
  maybeToArray,
  pathToUrl,
  getHash,
  isNullish,
  isObject,
  objectHasKey,
  addKeyValueToObjIfHasKey,
  inspectObj,
  getRandomItem,
  arrayEqualsShallow,
  throwIfKeyUndefined,
  throwIfValueError
}