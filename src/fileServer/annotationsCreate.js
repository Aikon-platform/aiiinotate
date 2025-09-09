// test data for the annotations create and createMany functions.
import url from "url";
import path from "path";

// // path to dirctory of curent file
// const __dirname = path.dirname(url.fileURLToPath(import.meta.url));


const uriData = {
  uri: "/fileServer/annotationList_aikon_wit9_man11_anno165_all.jsonld"
}

const uriDataArray = [
  { uri: "/fileServer/annotationList_vhs_wit250_man250_anno250_all.jsonld" },
  { uri: "/fileServer/annotationList_vhs_wit253_man253_anno253_all.jsonld" }
]

// will trigger an error because the path doesn't exist
const uriDataArrayInvalid = [
  { uri: "/fileServer/annotationList_that_does_not_exist.jsonld" }
]

const annotationList = {

}

const annotationListArray = [

]

export {
  uriData,
  uriDataArray,
  annotationList,
  annotationListArray,
  uriDataArrayInvalid
}
