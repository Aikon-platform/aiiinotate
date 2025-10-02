import { readFileToObject, toUrl } from "#fileServer/utils.js";

const manifest2ValidUri = { uri: toUrl("bnf_valid_manifest.json") };
const manifest2Valid = readFileToObject("bnf_valid_manifest.json");


export {
  manifest2ValidUri,
  manifest2Valid
}
