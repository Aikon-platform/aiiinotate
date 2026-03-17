import { Command, Option, Argument } from "commander";

import { fileRead, parseImportInputFile } from "#cli/utils/io.js";
import FastifyClient from "#cli/utils/fastifyClient.js";
import ProgressBar from "#cli/utils/progressbar.js";

/** @typedef {import("#types").FastifyInstanceType} FastifyInstanceType */

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

/**
 * @param {FastifyInstanceType} fastifyClient
 * @param {string[]} fileArr - array of full paths to annotationLists to insert.
 */
async function importAnnotationPage(fastifyClient, fileArr) {
  notImplementedExit(`${importAnnotationPage.name} is not implemented`)
}

/**
 * @param {FastifyClient} fastifyClient
 * @param {string[]} fileArr - array of full paths to annotationLists to insert.
 */
async function importAnnotationList(fastifyClient, fileArr) {
  fileArr = fileArr.slice(0,10)
  // RUN THE SCRIPT:
  // > npm run migrate-revert && npm run migrate-apply && npm run cli import -- annotation-list -i 2 -f ./data/aikon_wit9_man11_anno165_annotation_list.jsonld
  let totalImports = 0

  const pb = new ProgressBar({ desc: "importing annotations", total: fileArr.length});
  for ( const [i, file] of fileArr.entries() ) {
    const annotationList = JSON.parse(fileRead(file));
    // console.log(annotationList);
    const result = await fastifyClient.importAnnotationList(annotationList);
    pb.update(i)
    totalImports += Object.keys(result).length;
  }

  console.log(`\n\nDONE: imported ${totalImports} annotations into Aiiinotate !`);
  return
}

////////////////////////////////////////

/**
 * run the cli
 * @param {import('commander').Command} command
 * @param {object} options
 */
async function action(command, options) {

  /** @type {2 | 3} */
  const iiifVersion = options.iiifVersion;
  /** @type {string[]} */
  const inputFile = options.file;

  const fastifyClient = new FastifyClient();
  await fastifyClient.build();

  // run
  const filesToProcess = await parseImportInputFile(inputFile);
  if ( iiifVersion===2 ) {
    await importAnnotationList(fastifyClient, filesToProcess);
  } else {
    await importAnnotationPage(fastifyClient, filesToProcess);
  }
  // exit
  await fastifyClient.stop();
}

/////////////////////////////////////////

/** define the cli */
function makeImportCommand() {

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
    .action((options, command) => action(command, options))
}

export default makeImportCommand;