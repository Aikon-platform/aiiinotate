import { Command, Option, Argument } from "commander";

import Annotations2 from "#annotations/annotations2.js";
import Annotations3 from "#annotations/annotations3.js";
import { getFilesToProcess, fileRead, parseImportInputFile } from "#cli/utils/io.js";
import loadMongoClient from "#cli/utils/mongoClient.js";

////////////////////////////////////////

// // allowed imports
// const importTypes = [
//   "annotation",  // import a single annotation
//   "annotation-list",  // import a IIIF 2.x annotationList
//   "annotation-page",  // import a IIIF 3.x annotationPage
//   "manifest",  // import a single manifest
//   // "annotation-array",  // import a JSON array of IIIF annotations
//   // "manifest-array"  // import a json array of manifests
// ]

// // allowed import types per IIIF version
// const allowedImportTypes = {
//   2: ["annotation", "annotation-list", "manifest"],
//   3: ["annotation", "annotation-page", "manifest"]
// }

// const checkAllowedImportType = (iiifVersion, dataType) => {
//   if (
//     ! allowedImportTypes[iiifVersion].includes(dataType)
//   ) {
//     console.error(`${checkAllowedImportType.name}: forbidden import type '${dataType}' for IIIF version '${iiifVersion}'. allowed import types are: ${allowedImportTypes[iiifVersion]}`);
//     process.exit(1);
//   };
//
// }

const notImplementedExit = (method) => {
  console.log(`\n\nERROR: import is not implemented '${method}'`);
  process.exit(1);
}

const parseNumber = (x) => Number(x);

////////////////////////////////////////

async function importAnnotationPage(annotations3, fileArr, iiifVersion) {
  notImplementedExit(`${importAnnotationPage.name} is not implemented`)
}

// TODO change with fastify instance
/**
 *
 * @param {Annotations2} annotations2
 * @param {string[]} fileArr
 * @param {2|3} iiifVersion
 */
async function importAnnotationList(annotations2, fileArr, iiifVersion) {
  // RUN THE SCRIPT:
  // > npm run migrate-revert && npm run migrate-apply && npm run cli import -- annotation-list -i 2 -f ./data/aikon_wit9_man11_anno165_annotation_list.jsonld
  let totalImports = 0

  for (const file of fileArr) {
    const annotationList = JSON.parse(await fileRead(file));
    const result = await annotations2.insertAnnotationList(annotationList);
    totalImports += Object.keys(result).length;
  }

  console.log(`\n\nDONE: imported ${totalImports} annotations into Aiiinotate !`);
  return
}

////////////////////////////////////////

// TODO use parseImportInputFile

/**
 * run the cli
 * @param {import('commander').Command} command
 * @param {object} options
 */
async function action(mongoClient, command, options) {

  /** @type {2 | 3} */
  const iiifVersion = options.iiifVersion;
  /** @type {string[]} */
  const inputFile = options.inputFile;
  // /** @type {boolean} */
  // const listFiles = options.listFiles;

  // checkAllowedImportType(iiifVersion, dataType);

  // TODO update
  const filesToProcess = parseImportInputFile(inputFile);

  // TODO update with fastify instance
  const annotations2 = new Annotations2(
    mongoClient,
    mongoClient.db()
  );

  // run
  if ( iiifVersion===2 ) {
    await importAnnotationList(/*...*/)
  } else {
    await importAnnotationPage(/*...*/)
  }
  // switch (dataType) {
  //   case ("annotation-list"):
  //     await importAnnotationList(annotations2, filesToProcess, iiifVersion);
  //     break;
  //   default:
  //     notImplementedExit(dataType);
  // }
  mongoClient.close();

}

/////////////////////////////////////////

/** define the cli */
function makeImportCommand(mongoClient) {

  const versionOpt =
    new Option("-i, --iiif-version <version>", "IIIF version")
      .choices(["2", "3"])
      .argParser(parseNumber)
      .makeOptionMandatory();

  const filesOpt =
    new Option("-f, --file <file>", "file containing paths to AnnotationLists or AnnotationPages to process (1 line per path)")
      .makeOptionMandatory();

  return new Command("import")
    .description("import data into aiiinotate")
    .addOption(filesOpt)
    .addOption(versionOpt)
    .action((options, command) => action(mongoClient, command, options))
}

export default makeImportCommand;