// TODO : fileServer to read manifests + tests for insert

import { readFileToObject, toUrl } from "#fileServer/utils.js";

console.log("^".repeat(100));
console.log(toUrl("bnf_valid_manifest.json"));
console.log("v".repeat(100));

const manifest2ValidUri = { uri: toUrl("bnf_valid_manifest.json") };
const manifest2Valid = readFileToObject("bnf_valid_manifest.json");


export {
  manifest2ValidUri,
  manifest2Valid
}
