import { readFileToObject, toUrl } from "#fixtures/utils.js";

const manifest2ValidUri = { uri: toUrl("bnf_valid_manifest.json") };
const manifest2Valid = readFileToObject("bnf_valid_manifest.json");
const manifest2InvalidUri = { uri: toUrl("bnf_invalid_manifest.json") };
const manifest2Invalid = readFileToObject("bnf_invalid_manifest.json");


export {
  manifest2ValidUri,
  manifest2Valid,
  manifest2InvalidUri,
  manifest2Invalid
}
