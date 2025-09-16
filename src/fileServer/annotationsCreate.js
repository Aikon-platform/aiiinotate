// test data for the annotations create and createMany functions.
import { readFileToObject } from "#fileServer/utils.js";

const toUrl = (fn) => `${process.env.APP_BASE_URL}/fileServer/${fn}`;

const annotationListUri = {
  uri: toUrl("annotationList_aikon_wit9_man11_anno165_all.jsonld")
};

const annotationListUriArray = [
  { uri: toUrl("annotationList_vhs_wit250_man250_anno250_all.jsonld") },
  { uri: toUrl("annotationList_vhs_wit253_man253_anno253_all.jsonld") }
];

// will trigger an error because the path doesn't exist
const annotationListUriInvalid = { uri: "/fileServer/annotationList_that_does_not_exist.jsonld" };

const annotationListUriArrayInvalid = [
  { uri: "/fileServer/annotationList_that_does_not_exist.jsonld" }
];

const annotationList = readFileToObject("annotationList_aikon_wit9_man11_anno165_all.jsonld");

const annotationListArray = [
  readFileToObject("annotationList_vhs_wit250_man250_anno250_all.jsonld"),
  readFileToObject("annotationList_vhs_wit253_man253_anno253_all.jsonld")
];

export {
  annotationListUri,
  annotationListUriArray,
  annotationListUriInvalid,
  annotationList,
  annotationListArray,
  annotationListUriArrayInvalid
}
