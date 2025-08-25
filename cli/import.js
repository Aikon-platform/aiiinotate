import { Command, Option, Argument } from "commander";

import Annotations2 from "#annotations/annotations2.js";
import Annotations3 from "#annotations/annotations3.js";
import { getFilesToProcess, fileRead } from "#cli/io.js";

////////////////////////////////////////

// allowed imports
const importTypes = [
  "annotation",  // import a single annotation
  "annotation-list",  // import a IIIF 2.x annotationList
  "annotation-page",  // import a IIIF 3.x annotationPage
  "manifest",  // import a single manifest
  // "annotation-array",  // import a JSON array of IIIF annotations
  // "manifest-array"  // import a json array of manifests
]

// allowed import types per IIIF version
const allowedImportTypes = {
  2: ["annotation", "annotation-list", "manifest"],
  3: ["annotation", "annotation-page", "manifest"]
}

const checkAllowedImportType = (iiifVersion, dataType) => {
  if (
    ! allowedImportTypes[iiifVersion].includes(dataType)
  ) {
    console.error(`${checkAllowedImportType.name}: forbidden import type '${dataType}' for IIIF version '${iiifVersion}'. allowed import types are: ${allowedImportTypes[iiifVersion]}`);
    process.exit(1);
  };

}

const notImplementedExit = (method) => {
  console.log(`\n\nERROR: import is not implemented '${method}'`);
  process.exit(1);
}

const parseNumber = (x) => Number(x);

////////////////////////////////////////

async function importAnnotationPage(annotations3, fileArr, iiifVersion) {
  notImplementedExit(`${importAnnotationPage.name} is not implemented`)
}

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

  checkAllowedImportType(iiifVersion, dataType);

  const filesToProcess = await getFilesToProcess(files, listFiles);

  const annotations2 = new Annotations2(
    mongoClient,
    mongoClient.db()
  );

  // run
  switch (dataType) {
    case ("annotation-list"):
      await importAnnotationList(annotations2, filesToProcess, iiifVersion);
      break;
    default:
      notImplementedExit(dataType);
  }
  mongoClient.close();

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