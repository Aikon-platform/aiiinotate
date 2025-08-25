import { Command, Option, Argument } from "commander";

import { fromIiif2AnnotationList } from "#annotations/annotations2.js";
import { annotationsInsertMany } from "#annotations/annotationsModel.js";
import { getFilesToProcess, fileRead } from "#cli/io.js";

////////////////////////////////////////

// allowed imports
const importTypes = [
  "annotation",  // import a single annotation
  "annotation-list",  // import a IIIF 2.x annotationList
  "annotation-page",  // import a IIIF 3.x annotationPage
  "annotation-array",  // import a JSON array of IIIF annotations
  "manifest",  // import a single manifest
  "manifest-array"  // import a json array of manifests
]

const notImplementedExit = (method) => {
  console.log(`\n\nERROR: import is not implemented '${method}'`);
  process.exit(1);
}

const parseNumber = (x) => Number(x);

////////////////////////////////////////

/**
 *
 * @param {import("mongodb").MongoClient} mongoClient
 * @param {string[]} fileArr
 * @param {2|3} iiifVersion
 */
async function importAnnotationList(mongoClient, fileArr, iiifVersion) {
  // RUN THE SCRIPT:
  // > npm run migrate-revert && npm run migrate-apply && npm run cli import -- annotation-list -i 2 -f ./data/aikon_wit9_man11_anno165_annotation_list.jsonld
  const client = mongoClient;
  const db = client.db();
  let totalImports = 0

  for (const file of fileArr) {
    let annotationList = JSON.parse(await fileRead(file));

    if ( iiifVersion === 2 ) {
      annotationList = fromIiif2AnnotationList(annotationList);
      const result = await annotationsInsertMany(db, annotationList);
      totalImports += result;
    } else {
      notImplementedExit("import from annotation list with IIIF version", iiifVersion);
      process.exit(1);
    }
  }

  console.log(`\n\nDONE: imported ${totalImports} annotations into Aiiinotate !`);

  client.close();
}

/**
 * run the cli
 * @param {string} dataType: one of importTypes
 * @param {object} options
 * @param {import('commander').Command} command
 * @param {import('mongodb').MongoClient} mongoClient
 */
async function action(dataType, options, command, mongoClient) {

  /** @type {2 | 3} */
  const iiifVersion = options.iiifVersion;
  /** @type {string[]} */
  const files = options.files;
  /** @type {boolean} */
  const listFiles = options.listFiles;

  const filesToProcess = await getFilesToProcess(files, listFiles);

  // run
  switch (dataType) {
    case ("annotation-list"):
      importAnnotationList(mongoClient, filesToProcess, iiifVersion);
      break;
    default:
      notImplementedExit(dataType);
  }

}

/////////////////////////////////////////

/** define the cli */
function makeImportCommand(mongoClient) {

  // argument and option name syntax:
  // --opt-name <requiredVal> => you mst provide a value after --opt-name
  // --opt-name [optionalVal] => if `optionalVal` is not provided, --opt-name will be treated as boolean
  const dataTypeArg =
    new Argument("<data-type>", "type of data to import")
      .choices(importTypes);

  const versionOpt =
    new Option("-i, --iiif-version <version>", "IIIF version")
      .choices(["2", "3"])
      .argParser(parseNumber)
      .makeOptionMandatory();

  const filesOpt =
    new Option("-f, --files <files...>", "files to process, either as: space-separated filepath(s) to the JSON(s) OR path to a file containing a list of paths to JSON files to process (1 line per path)")
      .makeOptionMandatory();

  const listFilesOpt =
    new Option("-l, --list-files", "flag indicating that --files points to a file containing a list of JSON files to process (1 line per path)")

  return new Command("import")
    .description("import data into aiiinotate")
    .addArgument(dataTypeArg)
    .addOption(filesOpt)
    .addOption(versionOpt)
    .addOption(listFilesOpt)
    .action((dataType, options, command) => action(dataType, options, command, mongoClient))
}

export {
  makeImportCommand
}