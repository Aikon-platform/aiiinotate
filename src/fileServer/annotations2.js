import { readFileToObject } from "#fileServer/utils.js";

const annotations2Invalid = readFileToObject("annotations2Invalid.jsonld");
const annotations2Valid = readFileToObject("annotations2Valid.jsonld");


export {
  annotations2Invalid,
  annotations2Valid,
}