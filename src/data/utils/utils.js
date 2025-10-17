import util from "node:util";
import Ajv from "ajv";


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
  [ key, val ] = Object.entries(obj).find(([k,v]) => v != null);
  if ( key!== undefined && val!==undefined ) {
    return [key, val];
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

/**
 * convert object `x` to an array if it is not aldready an array.
 * if `convertedFlag`, return [ obj, converted ]. `converted` is `true` if the object was converted to an array, false otherwise.
 * @param {any} x
 * @param {boolean} convertedFlag
 * @returns {Array | Array<Array, boolean> }
 */
const maybeToArray = (x, convertedFlag=false) =>
  convertedFlag
    ? Array.isArray(x) ? [x, false] : [[x], true]
    : Array.isArray(x) ? x : [x];

const pathToUrl = (path) =>
  `${process.env.APP_BASE_URL}${path}`

/**
 * display a detailed and nested view of an object. to be used with console.log.
 * @param {any} obj - object to inspect
 * @param {number|Infinity} maxLines - maximum number of lines in string output. defaults to 100.
 * @returns
 */
const inspectObj = (obj, maxLines=100) => {
  const
    str = util.inspect(obj, {showHidden: false, depth: null, colors: true}),
    strArr = str.split("\n"),
    strLen = strArr.length;
  // remove the middle lines if `str` is too long
  if ( strLen > maxLines ) {
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
  if ( objectHasKey(schema, "$id") || objectHasKey(schema, "$ref") ) {
    const err = new Error(`ajvCompile: 'schema' has not been resolved. use 'fastify.schemasResolver()' to resolve the schema before compiling it, on schema: ${inspectObj(schema)}`);
    // `console.error` is necessary to be sure that the error will be displayed
    console.error(err);
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
  if ( prefix ) console.log(prefix);
  console.log(inspectObj(data));
  console.log(">".repeat(100));
}

export {
  maybeToArray,
  pathToUrl,
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
  visibleLog
}