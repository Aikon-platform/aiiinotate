// test data for the annotations create and createMany functions.
import { readFileToObject, toUrl } from "#fixtures/utils.js";

const annotations2Invalid = readFileToObject("annotations2Invalid.jsonld");
const annotations2Valid = readFileToObject("annotations2Valid.jsonld");

const annotationListUri = {
  uri: toUrl("annotationList_aikon_wit9_man11_anno165_all.jsonld")
};

const annotationListUriArray = [
  { uri: toUrl("annotationList_vhs_wit250_man250_anno250_all.jsonld") },
  { uri: toUrl("annotationList_vhs_wit253_man253_anno253_all.jsonld") }
];

// will trigger an error because the path doesn't exist
const annotationListUriInvalid = { uri: "/fixtures/annotationList_that_does_not_exist.jsonld" };

const annotationListUriArrayInvalid = [
  { uri: "/fixtures/annotationList_that_does_not_exist.jsonld" }
];

const annotationList = readFileToObject("annotationList_aikon_wit9_man11_anno165_all.jsonld");

const annotationListArray = [
  readFileToObject("annotationList_vhs_wit250_man250_anno250_all.jsonld"),
  readFileToObject("annotationList_vhs_wit253_man253_anno253_all.jsonld")
];

export {
  annotations2Invalid,
  annotations2Valid,
  annotationListUri,
  annotationListUriArray,
  annotationListUriInvalid,
  annotationList,
  annotationListArray,
  annotationListUriArrayInvalid
}
